import { ImageResponse } from "next/og";
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

function isAbsoluteHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/** True when the URL path or query clearly indicates WebP (Satori cannot draw WebP). */
function urlLooksLikeWebp(url: string): boolean {
  const lower = url.toLowerCase();
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    if (pathname.endsWith(".webp")) return true;
  } catch {
    if (lower.split("?")[0].endsWith(".webp")) return true;
  }
  // Reddit / CDN force-webp query params
  return lower.includes("auto=webp") || lower.includes("format=webp");
}

/** JPEG / PNG / GIF / SVG — pass through to Satori unchanged. */
function isSatoriNativeUrl(url: string): boolean {
  if (!isAbsoluteHttpUrl(url)) return false;
  if (urlLooksLikeWebp(url)) return false;
  const lower = url.toLowerCase();
  const hasKnownExt =
    lower.endsWith(".jpg") ||
    lower.endsWith(".jpeg") ||
    lower.endsWith(".png") ||
    lower.endsWith(".gif") ||
    lower.endsWith(".svg") ||
    lower.includes(".jpg") ||
    lower.includes(".jpeg") ||
    lower.includes(".png") ||
    lower.includes(".gif");
  return hasKnownExt;
}

function isWebpBuffer(buf: Buffer): boolean {
  // RIFF....WEBP
  return (
    buf.length >= 12 &&
    buf[0] === 0x52 &&
    buf[1] === 0x49 &&
    buf[2] === 0x46 &&
    buf[3] === 0x46 &&
    buf[8] === 0x57 &&
    buf[9] === 0x45 &&
    buf[10] === 0x42 &&
    buf[11] === 0x50
  );
}

/**
 * Resolve an article image for Satori.
 * WebP (by extension, query, content-type, or magic bytes) is downloaded and
 * converted to a PNG data URL via sharp. JPEG/PNG/GIF/SVG URLs are kept as-is.
 */
async function resolveImageForSatori(rawUrl: string): Promise<string> {
  if (!rawUrl || !isAbsoluteHttpUrl(rawUrl)) return "";

  const needsWebpConvert = urlLooksLikeWebp(rawUrl);

  if (!needsWebpConvert && isSatoriNativeUrl(rawUrl)) {
    return rawUrl;
  }

  if (!needsWebpConvert) {
    // Unknown / extensionless URL — skip (same as previous allowlist behaviour)
    return "";
  }

  try {
    const res = await fetch(rawUrl, {
      headers: { Accept: "image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });
    if (!res.ok) return "";

    const contentType = (res.headers.get("content-type") || "").toLowerCase();
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 12) return "";

    const isWebp =
      contentType.includes("image/webp") ||
      isWebpBuffer(buf) ||
      needsWebpConvert;

    if (!isWebp) {
      // Query said webp but body isn't — if it's a native format, use original URL
      if (
        contentType.includes("image/jpeg") ||
        contentType.includes("image/png") ||
        contentType.includes("image/gif") ||
        contentType.includes("image/svg")
      ) {
        return rawUrl;
      }
      return "";
    }

    const sharp = (await import("sharp")).default;
    // Cap size so the data URL stays within ImageResponse asset limits
    const png = await sharp(buf)
      .rotate()
      .resize({
        width: 840,
        height: 600,
        fit: "inside",
        withoutEnlargement: true,
      })
      .png()
      .toBuffer();

    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return "";
  }
}

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
  const agentName = mag?.agentName || "";

  const title = (a.headline || a.title || "Anteroom").substring(0, 200);
  const description = (a.summary || "").substring(0, 250);

  // WebP → PNG data URL; JPEG/PNG/GIF/SVG stay as remote URLs
  const imageUrl = await resolveImageForSatori(a.imageUrl || "");

  const darkThemes = ["glass", "dashboard", "terminal", "crt", "linear"];
  const isDark = branding ? darkThemes.includes(branding.theme) : true;
  const textColor = isDark ? "#f7f8f8" : "#1a1a1a";
  const subTextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
  const darkerBg = adjustColor(color, -25);

  const fontData = await loadFont();
  const fonts = fontData && fontData.byteLength > 40
    ? [{ name: "Inter", data: fontData, weight: 400 as const, style: "normal" as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: `linear-gradient(135deg, ${color}, ${darkerBg})`,
          color: textColor,
          fontFamily: fontData ? "Inter" : "sans-serif",
          padding: "56px 64px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Magazine header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            marginBottom: "28px",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "12px",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: 700,
              color: isDark ? "#000" : "#fff",
              flexShrink: 0,
            }}
          >
            {magName.charAt(0)}
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "2px",
                opacity: 0.7,
                textTransform: "uppercase",
              }}
            >
              Anteroom
            </div>
            <div style={{ fontSize: "22px", fontWeight: 700, marginTop: "2px" }}>
              {magName}
            </div>
          </div>
        </div>

        {/* Content */}
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: "48px",
            alignItems: "center",
            minHeight: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: imageUrl ? "1.4 1 0%" : "1",
              justifyContent: "center",
              gap: "12px",
            }}
          >
            <div
              style={{
                fontSize: "44px",
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: "-0.5px",
                color: textColor,
                display: "flex",
                flexWrap: "wrap",
                overflow: "hidden",
                maxHeight: "220px",
              }}
            >
              {title}
            </div>
            {description && (
              <div
                style={{
                  fontSize: "18px",
                  lineHeight: 1.4,
                  color: subTextColor,
                  display: "flex",
                  flexWrap: "wrap",
                  overflow: "hidden",
                  maxHeight: "80px",
                  maxWidth: "90%",
                }}
              >
                {description}
              </div>
            )}
            {agentName && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginTop: "12px",
                  fontSize: "14px",
                  opacity: 0.7,
                  color: subTextColor,
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill={accent}>
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>{agentName}</span>
              </div>
            )}
          </div>

          {imageUrl && (
            <div
              style={{
                flex: "1 1 0%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src={imageUrl}
                alt=""
                width={420}
                height={300}
                style={{
                  width: "420px",
                  height: "300px",
                  objectFit: "cover",
                  borderRadius: "16px",
                  border: `2px solid ${accent}30`,
                }}
              />
            </div>
          )}
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)`,
          }}
        />

        {/* Decorative corner glow */}
        <div
          style={{
            position: "absolute",
            top: "-50px",
            right: "-50px",
            width: "250px",
            height: "250px",
            borderRadius: "50%",
            background: `${accent}12`,
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts,
    }
  );
}

function adjustColor(hex: string, amount: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}
