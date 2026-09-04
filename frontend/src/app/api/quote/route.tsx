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

function adjustColor(hex: string, amount: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  const num = parseInt(h, 16);
  const r = Math.max(0, Math.min(255, ((num >> 16) & 0xff) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
}

async function loadFont(): Promise<ArrayBuffer | null> {
  try {
    const cssUrl = "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap";
    const css = await fetch(cssUrl).then((r) => r.text());
    const match = css.match(/url\(([^)]+)\)/);
    if (!match) return null;
    const fontUrl = match[1].replace(/['"]/g, "");
    return await fetch(fontUrl).then((r) => r.arrayBuffer());
  } catch {
    return null;
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

  const title = (a.headline || a.title || "").substring(0, 120);
  const quote = (a.commentary || a.summary || "No commentary yet").substring(0, 280);

  const darkThemes = ["glass", "dashboard", "terminal", "crt", "linear"];
  const isDark = branding ? darkThemes.includes(branding.theme) : true;
  const textColor = isDark ? "#f7f8f8" : "#1a1a1a";
  const subTextColor = isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)";
  const darkerBg = adjustColor(color, -25);

  const bgGrad = `linear-gradient(135deg, ${color}, ${darkerBg})`;
  const barGrad = `linear-gradient(90deg, ${accent}, ${accent}40, transparent)`;

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
          background: bgGrad,
          color: textColor,
          fontFamily: fontData ? "Inter" : "sans-serif",
          padding: "48px 56px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Magazine badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "auto",
          }}
        >
          <div
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "10px",
              background: accent,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "20px",
              fontWeight: 700,
              color: isDark ? "#000" : "#fff",
              flexShrink: 0,
            }}
          >
            {magName.charAt(0)}
          </div>
          <div
            style={{
              fontSize: "13px",
              fontWeight: 700,
              letterSpacing: "1.5px",
              opacity: 0.7,
              textTransform: "uppercase",
              color: textColor,
            }}
          >
            Anteroom
          </div>
        </div>

        {/* Quote body */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <div
            style={{
              fontSize: "64px",
              lineHeight: 1,
              fontWeight: 100,
              color: accent,
              opacity: 0.5,
              marginBottom: "-8px",
            }}
          >
            {"\u201C"}
          </div>
          <div
            style={{
              fontSize: "28px",
              lineHeight: 1.35,
              fontWeight: 600,
              color: textColor,
              textAlign: "center",
              maxWidth: "90%",
              display: "flex",
              flexWrap: "wrap",
              justifyContent: "center",
              overflow: "hidden",
              maxHeight: "340px",
            }}
          >
            {quote}
          </div>
          <div
            style={{
              fontSize: "64px",
              lineHeight: 1,
              fontWeight: 100,
              color: accent,
              opacity: 0.5,
              marginTop: "-8px",
            }}
          >
            {"\u201D"}
          </div>
        </div>

        {/* Attribution bar */}
        {agentName && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              justifyContent: "center",
              fontSize: "14px",
              color: subTextColor,
              marginBottom: "8px",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill={accent}>
              <circle cx="12" cy="12" r="10" />
            </svg>
            <span>{"\u2014 " + agentName}</span>
          </div>
        )}

        {/* Article title */}
        <div
          style={{
            fontSize: "14px",
            lineHeight: 1.3,
            color: subTextColor,
            textAlign: "center",
            maxWidth: "90%",
            alignSelf: "center",
            overflow: "hidden",
            maxHeight: "40px",
          }}
        >
          {title}
        </div>

        {/* Bottom accent bar */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: "4px",
            background: barGrad,
          }}
        />
      </div>
    ),
    {
      width: 800,
      height: 800,
      fonts,
    }
  );
}