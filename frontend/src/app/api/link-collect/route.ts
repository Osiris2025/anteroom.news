import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { article } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";

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
        "User-Agent":
          "Mozilla/5.0 (compatible; AINewsNexus/1.0; +https://nexus.osiris2025.com)",
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

// POST /api/link-collect — Raindrop-style bookmarklet endpoint
// Any authenticated user can submit a URL; it's dropped as a draft
// Body: { url }
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
      { error: "Could not extract a title from that URL — it may be a paywall or non-article page" },
      { status: 422 }
    );
  }

  const id = `collect-${crypto.randomBytes(6).toString("hex")}`;

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
        submittedBy: session?.user?.id || null,
        submittedAt: new Date(),
      })
      .returning();

    return Response.json({ article: created });
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Failed to create article" },
      { status: 500 }
    );
  }
}

// GET /api/link-collect — bookmarklet info page (returns HTML for the bookmarklet)
export async function GET() {
  const bookmarkletCode = `javascript:(function(){
    var u=location.href;
    fetch('https://nexus.osiris2025.com/api/link-collect',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({url:u}),
      credentials:'include'
    }).then(function(r){return r.json()}).then(function(d){
      if(d.article){alert('Saved to Nexus: '+d.article.title)}else{alert('Error: '+(d.error||'unknown'))}
    }).catch(function(e){alert('Error: '+e.message)})
  })();`;

  const pageHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Collector — AI News Nexus</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #0b0e11; color: #e6e6e6; max-width: 600px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
    h1 { font-size: 24px; font-weight: 800; margin-bottom: 4px; }
    .accent { color: #ffd700; }
    .card { background: #13161a; border-radius: 12; padding: 24; margin: 20 0; }
    code { background: #1a1d21; padding: 2px 6px; border-radius: 4px; font-size: 13px; }
    .bookmarklet { display: inline-block; padding: 12px 24px; background: #ffd700; color: #000; font-weight: 700; border-radius: 8px; text-decoration: none; font-size: 14px; cursor: move; }
    .bookmarklet:hover { background: #ffed4a; }
    .steps { margin: 20px 0; }
    .steps li { margin-bottom: 8px; }
    a { color: #ffd700; }
  </style>
</head>
<body>
  <h1>🔗 <span class="accent">Link Collector</span></h1>
  <p style="margin-bottom: 24px;">Save any link to AI News Nexus as a draft article. Drag the button below to your bookmarks bar.</p>
  
  <div style="background: #13161a; border-radius: 12px; padding: 24px; margin-bottom: 20px; text-align: center;">
    <p style="margin-top: 0; font-size: 13px; opacity: 0.7;">→ Drag this to your bookmarks bar ←</p>
    <a href="${bookmarkletCode.replace(/"/g, '&quot;')}" class="bookmarklet" onclick="return false;">
      ⚡ Save to Nexus
    </a>
  </div>

  <h2 style="font-size: 16px;">How to use</h2>
  <ol class="steps">
    <li>Drag the <strong>"Save to Nexus"</strong> button above to your browser's bookmarks bar</li>
    <li>Sign in to <a href="https://nexus.osiris2025.com">nexus.osiris2025.com</a> (required for bookmarklet to work)</li>
    <li>When you find an interesting article, click the bookmarklet</li>
    <li>It saves the page title + URL + image to your Nexus drafts queue</li>
  </ol>

  <div style="background: #1a1d21; border-radius: 8px; padding: 16px; margin-top: 24px; font-size: 13px; opacity: 0.7;">
    <strong>💡 Tip:</strong> After dropping links, visit the Dispatch Desk at 
    <a href="https://nexus.osiris2025.com/admin">/admin</a> → Inbox to review, approve, and publish.
    Use the Link Drop tab to assign magazines and generate AI commentary.
  </div>
</body>
</html>`;

  return new Response(pageHtml, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}