import { renderCard, loadCoverPhoto } from "@/lib/ogCard";
import { db } from "@/lib/db";
import { article, magazine } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

const MAGAZINE_BRANDING: Record<string, { color: string; accent: string; name: string; theme: string }> = {
  "weekly-weird-news": { color: "#8B4513", accent: "#FFD700", name: "Weekly Weird News", theme: "tabloid" },
  "weird-and-wild":     { color: "#302b63", accent: "#667eea", name: "New Frontiers in Science", theme: "glass" },
  "tech-pulse":         { color: "#1e3a5f", accent: "#58a6ff", name: "Tech Pulse", theme: "linear" },
  "poli-split":         { color: "#7c3aed", accent: "#a78bfa", name: "Political Picture", theme: "vercel" },
  "climate-watch":      { color: "#059669", accent: "#34d399", name: "Climate Watch", theme: "dashboard" },
  "startup-signal":     { color: "#d97706", accent: "#fbbf24", name: "Startup Signal", theme: "magazine" },
  "oss-report":         { color: "#dc2626", accent: "#f87171", name: "Open Source Report", theme: "terminal" },
  "starfall-weekly":    { color: "#0f380f", accent: "#00ff40", name: "Starfall Weekly", theme: "crt" },
  "vital-sign":         { color: "#0b5563", accent: "#2dd4bf", name: "Vital Signs", theme: "dashboard" },
  "neural-hardware":    { color: "#00cc88", accent: "#00fa9a", name: "Neural Hardware", theme: "linear" },
  "dark-matter":        { color: "#6b21a8", accent: "#a855f7", name: "Dark Matter", theme: "glass" },
  "the-veil":           { color: "#7c3aed", accent: "#c084fc", name: "The Veil", theme: "glass" },
  "the-green-room":     { color: "#059669", accent: "#34d399", name: "The Green Room", theme: "magazine" },
  "just-the-news-thats-fit-to-print": { color: "#475569", accent: "#94a3b8", name: "Just the News", theme: "vercel" },
};

export const runtime = "nodejs";


// The font is bundled in /public/fonts so card images never depend on a live
// download from Google (a failed download made the card image fail to render,
// so shared links showed no picture). Kept in memory after the first read.
let cachedFont: ArrayBuffer | null = null;

async function loadFont(): Promise<ArrayBuffer | null> {
  if (cachedFont) return cachedFont;
  try {
    const { readFile } = await import("fs/promises");
    const path = await import("path");
    const buf = await readFile(path.join(process.cwd(), "public", "fonts", "Inter-Regular.ttf"));
    cachedFont = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return cachedFont;
  } catch {
    // Fall back to downloading it (old behaviour) if the bundled file is missing.
    try {
      const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap";
      const css = await fetch(cssUrl).then((r) => r.text());
      const match = css.match(/url\(([^)]+)\)/);
      if (!match) return null;
      const fontUrl = match[1].replace(/['"]/g, "");
      const data = await fetch(fontUrl).then((r) => r.arrayBuffer());
      if (data.byteLength > 40) cachedFont = data;
      return data;
    } catch {
      return null;
    }
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get("articleId");

  if (!articleId) {
    return new Response("Missing articleId", { status: 400 });
  }

  const rows: any[] = await db
    .select()
    .from(article)
    .leftJoin(magazine, eq(article.magazineId, magazine.id))
    .where(eq(article.id, articleId));

  const r = rows[0];
  if (!r || !r.article) {
    return new Response("Article not found", { status: 404 });
  }

  const a = r.article;
  const mag = r.magazine;
  const magId = a.magazineId || "ai-news-nexus";
  const branding = MAGAZINE_BRANDING[magId];
  const color = branding?.color || "#1e3a5f";
  const accent = branding?.accent || "#58a6ff";
  const magName = mag?.name || branding?.name || "Anteroom";

  const title = (a.headline || a.title || "Anteroom").replace(/\s+/g, " ").trim();

  // Photo (any format, incl. WebP) -> 1200x630 cover-cropped JPEG data URL.
  const photo = await loadCoverPhoto(a.imageUrl || "");
  const fontData = await loadFont();

  return renderCard({ title, magName, color, accent, photo, fontData });
}

