import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

// Fetch + extract OpenGraph / meta tags from a URL (shared with link-drop)
async function extractMeta(url: string): Promise<{
  title: string | null;
  description: string | null;
  imageUrl: string | null;
}> {
  let resp: Response;
  try {
    resp = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AINewsNexus/1.0; +https://nexus.osiris2025.com)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
  } catch {
    return { title: null, description: null, imageUrl: null };
  }
  if (!resp.ok) return { title: null, description: null, imageUrl: null };

  const html = await resp.text().catch(() => "");
  if (!html) return { title: null, description: null, imageUrl: null };

  const og = (prop: string): string | null => {
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["'][^>]+content=["']([^"']+)["']`,
      "i"
    );
    const m = html.match(re);
    if (m) return m[1].trim();
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["']`,
      "i"
    );
    const m2 = html.match(re2);
    return m2 ? m2[1].trim() : null;
  };

  const title =
    og("title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    null;
  const description = og("description");
  const imageUrl = og("image");

  return { title, description, imageUrl };
}

// Use OpenRouter to detect the best magazine + generate suitability warnings.
async function detectMagazine(
  title: string,
  description: string | null
): Promise<{ magazineId: string | null; warnings: any[] } | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  let magazines: { id: string; name: string; tagline: string | null }[] = [];
  try {
    magazines = await db
      .select({ id: magazine.id, name: magazine.name, tagline: magazine.tagline })
      .from(magazine);
  } catch {
    return null;
  }

  if (magazines.length === 0) return { magazineId: null, warnings: [] };

  const magList = magazines
    .map((m) => '"' + m.id + '": ' + m.name + (m.tagline ? " - " + m.tagline : ""))
    .join("\n");

  const system = [
    "You are an AI news curator that classifies articles into the correct magazine.",
    "Available magazines:",
    magList,
    "",
    'Respond with valid JSON ONLY (no markdown, no explanation):',
    '{ "magazineId": "best-matching magazine id (or null if none fits)", "warnings": [{"level": "info"|"warning"|"blocker", "message": "why"}] }',
    'Warnings: "blocker" for non-news/paywall/spam, "warning" for borderline/opinion, "info" for mild concerns.',
    "If it's clearly a news article without issues, return empty warnings.",
    "Pick the magazine that best matches the article's subject matter.",
  ].filter(Boolean).join("\n");

  const user = "Title: " + title + "\nDescription: " + (description || "(none)") + "\n\nClassify this article.";

  try {
    const resp = await fetch(OPENROUTER_BASE + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey,
        "HTTP-Referer": "https://nexus.osiris2025.com",
        "X-Title": "Anteroom",
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-v4-flash-0731",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!resp.ok) return null;

    const data: any = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    if (!content) return null;

    // Try to parse JSON from response
    const jsonStr = content.replace(/```json\s*/gi, "").replace(/```\s*$/g, "").trim();
    const parsed = JSON.parse(jsonStr);

    const validIds = new Set(magazines.map((m) => m.id));
    const magazineId = validIds.has(parsed.magazineId) ? parsed.magazineId : null;
    const warnings = Array.isArray(parsed.warnings) ? parsed.warnings : [];

    return { magazineId, warnings };
  } catch {
    return null;
  }
}

// POST /api/link-collect — Raindrop-style bookmarklet endpoint
// Any authenticated user can submit a URL; it's dropped as a draft
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}
  if (!session?.user) {
    return Response.json({ error: "Authentication required. Sign in first." }, { status: 401 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Only http/https URLs are supported" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  // Fetch + extract meta
  const meta = await extractMeta(rawUrl);
  if (!meta.title) {
    return Response.json(
      { error: "Could not extract a title from that URL - it may be a paywall or non-article page" },
      { status: 422 }
    );
  }

  // Try AI magazine detection + suitability warnings
  const aiResult = await detectMagazine(meta.title, meta.description);

  const id = "collect-" + crypto.randomBytes(6).toString("hex");

  try {
    const [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "link-collect",
        sourceUrl: rawUrl,
        imageUrl: meta.imageUrl,
        title: meta.title,
        summary: meta.description || null,
        status: "draft",
        magazineId: aiResult?.magazineId || null,
        warnings: aiResult?.warnings || null,
        submittedBy: session?.user?.id || null,
        submittedAt: new Date(),
      })
      .returning();

    return Response.json({
      article: created,
      aiDetected: !!aiResult,
      magazineDetected: aiResult?.magazineId || null,
      warnings: aiResult?.warnings || [],
    });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Failed to create article" },
      { status: 500 }
    );
  }
}

// GET /api/link-collect — bookmarklet info page
export async function GET() {
  const bookmarkletCode = "javascript:(function(){" +
    "var u=location.href;" +
    "fetch('https://nexus.osiris2025.com/api/link-collect',{" +
    "method:'POST'," +
    "headers:{'Content-Type':'application/json'}," +
    "body:JSON.stringify({url:u})," +
    "credentials:'include'" +
    "}).then(function(r){return r.json()}).then(function(d){" +
    "if(d.article){alert('Saved to Anteroom: '+d.article.title)}" +
    "else{alert('Error: '+(d.error||'unknown'))}" +
    "}).catch(function(e){alert('Error: '+e.message)})" +
    "})();";

  const pageHtml = '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '  <meta charset="UTF-8">\n' +
    '  <meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
    '  <title>Link Collector - Anteroom</title>\n' +
    '  <style>\n' +
    '    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0e11; color: #e6e6e6; max-width: 600px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }\n' +
    '    h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }\n' +
    '    .accent { color: #ffd700; }\n' +
    '    .card { background: #13161a; border-radius: 12px; padding: 24px; margin: 20px 0; }\n' +
    '    code { background: #1a1d21; padding: 2px 6px; border-radius: 4px; font-size: 13px; }\n' +
    '    .bookmarklet { display: inline-block; padding: 12px 24px; background: #ffd700; color: #000; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px; cursor: move; }\n' +
    '    .bookmarklet:hover { background: #ffed4a; }\n' +
    '    .steps { margin: 20px 0; }\n' +
    '    .steps li { margin-bottom: 8px; }\n' +
    '    a { color: #ffd700; }\n' +
    '  </style>\n' +
    '</head>\n' +
    '<body>\n' +
    '  <h1>&#128279; <span class="accent">Link Collector</span></h1>\n' +
    '  <p style="margin-bottom: 24px;">Save any link to Anteroom as a draft article. Drag the button below to your bookmarks bar.</p>\n' +
    '  \n' +
    '  <div class="card" style="text-align: center;">\n' +
    '    <p style="margin-top: 0; font-size: 13px; opacity: 0.7;">Drag this to your bookmarks bar</p>\n' +
    '    <a href="' + bookmarkletCode.replace(/"/g, '&quot;') + '" class="bookmarklet" onclick="return false;">\n' +
    '      &#9889; Save to Anteroom\n' +
    '    </a>\n' +
    '  </div>\n' +
    '\n' +
    '  <h2 style="font-size: 16px;">How to use</h2>\n' +
    '  <ol class="steps">\n' +
    '    <li>Sign in to <a href="https://nexus.osiris2025.com">nexus.osiris2025.com</a></li>\n' +
    '    <li>Drag the <strong>"Save to Anteroom"</strong> button above to your browser bookmarks bar</li>\n' +
    '    <li>When you find an interesting article, click the bookmarklet</li>\n' +
    '    <li>AI auto-detects which magazine it belongs to with suitability warnings</li>\n' +
    '  </ol>\n' +
    '\n' +
    '  <div style="background: #1a1d21; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 13px; opacity: 0.7;">\n' +
    '    <strong>&#128161; Tip:</strong> After dropping links, visit \n' +
    '    <a href="https://nexus.osiris2025.com/admin">Dispatch Desk</a> &rarr; Inbox to review, approve, and publish.\n' +
    '    Links now get AI magazine detection + suitability warnings automatically.\n' +
    '  </div>\n' +
    '</body>\n' +
    '</html>';

  return new Response(pageHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
