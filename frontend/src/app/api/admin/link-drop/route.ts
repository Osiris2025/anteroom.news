import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { auth } from "@/lib/auth";
import crypto from "crypto";

const ADMIN_ROLES = ["superadmin", "admin"];

// fetch + extract OpenGraph / meta tags from a URL
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
    // og:title, og:description, og:image — also twitter:fallbacks
    const re = new RegExp(
      `<meta[^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["'][^>]+content=["']([^"']+)["']`,
      "i"
    );
    const m = html.match(re);
    if (m) return m[1].trim();
    // reverse attribute order
    const re2 = new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["'](?:og:|twitter:)${prop}["']`,
      "i"
    );
    const m2 = html.match(re2);
    return m2 ? m2[1].trim() : null;
  };

  // title fallback chain: og:title -> twitter:title -> <title>
  const title =
    og("title") ||
    html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]?.trim() ||
    null;

  const description = og("description");
  const imageUrl = og("image");

  return { title, description, imageUrl };
}

// POST /api/admin/link-drop — paste a URL, AI interrogates it, creates a draft
// body: { url, magazineId? }
export async function POST(req: NextRequest) {
  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {}
  const role = (session?.user as any)?.role || "";
  if (!ADMIN_ROLES.includes(role)) {
    return Response.json({ error: "Forbidden — admin only" }, { status: 403 });
  }

  let body: any = {};
  try {
    body = await req.json();
  } catch {}
  const rawUrl = (body.url || "").trim();
  if (!rawUrl) {
    return Response.json({ error: "url is required" }, { status: 400 });
  }

  // Basic URL validation
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return Response.json({ error: "Only http/https URLs are supported" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "Invalid URL" }, { status: 400 });
  }

  const magazineId = body.magazineId || null;

  // Fetch + extract meta
  const meta = await extractMeta(rawUrl);
  if (!meta.title) {
    return Response.json(
      { error: "Could not extract a title from that URL — it may be a paywall or non-article page" },
      { status: 422 }
    );
  }

  // Generate a short unique id
  const id = `link-${crypto.randomBytes(6).toString("hex")}`;

  try {
    const [created] = await db
      .insert(article)
      .values({
        id,
        ingress: "admin-link",
        sourceUrl: rawUrl,
        imageUrl: meta.imageUrl,
        title: meta.title,
        summary: meta.description || null,
        status: "draft",
        magazineId,
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