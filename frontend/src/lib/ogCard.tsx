import { ImageResponse } from "next/og";

function isAbsoluteHttpUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Download the article photo and cover-crop it to 1200x630 with sharp.
 *  Handles JPEG/PNG/GIF and WebP alike. Returns "" on any failure, so the
 *  card falls back to the magazine colour background. */
export async function loadCoverPhoto(rawUrl: string): Promise<string> {
  if (!rawUrl || !isAbsoluteHttpUrl(rawUrl)) return "";
  try {
    const res = await fetch(rawUrl, {
      headers: { Accept: "image/*,*/*;q=0.8", "User-Agent": "Mozilla/5.0 (compatible; AnteroomOG/1.0)" },
      signal: AbortSignal.timeout(10_000),
      redirect: "follow",
    });
    if (!res.ok) return "";
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength < 12) return "";
    const sharp = (await import("sharp")).default;
    const jpg = await sharp(buf)
      .rotate()
      .resize({ width: 1200, height: 630, fit: "cover", position: "attention" })
      .jpeg({ quality: 82 })
      .toBuffer();
    return `data:image/jpeg;base64,${jpg.toString("base64")}`;
  } catch {
    return "";
  }
}

export function renderCard(o: { title: string; magName: string; color: string; accent: string; photo: string; fontData: ArrayBuffer | null }) {
  const { magName, color, accent, photo, fontData } = o;
  // Clamp to ~3 lines: shrink the font for long titles, then trim with an ellipsis.
  const len = o.title.length;
  const fontSize = len <= 50 ? 64 : len <= 80 ? 54 : len <= 120 ? 46 : 40;
  const charsPerLine = Math.floor(1070 / (fontSize * 0.52));
  const maxChars = charsPerLine * 3;
  const title = len > maxChars ? o.title.slice(0, maxChars - 1).replace(/\s+\S*$/, "") + "…" : o.title;
  const fonts = fontData && fontData.byteLength > 40
    ? [{ name: "Inter", data: fontData, weight: 400 as const, style: "normal" as const }]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          position: "relative",
          background: `linear-gradient(135deg, ${color}, ${adjustColor(color, -40)})`,
          fontFamily: fontData ? "Inter" : "sans-serif",
          color: "#fff",
        }}
      >
        {photo && (
          <img src={photo} alt="" width={1200} height={630}
            style={{ position: "absolute", top: 0, left: 0, width: "1200px", height: "630px", objectFit: "cover" }} />
        )}
        {/* dark gradient so the headline reads over any photo */}
        <div style={{
          position: "absolute", left: 0, right: 0, bottom: 0, height: photo ? "420px" : "630px",
          background: photo
            ? "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.55) 40%, rgba(0,0,0,0.88) 100%)"
            : "linear-gradient(180deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.35) 100%)",
          display: "flex",
        }} />
        {/* small brand mark */}
        <div style={{
          position: "absolute", top: 32, left: 40, display: "flex", alignItems: "center", gap: 10,
          padding: "8px 14px", borderRadius: 999, background: "rgba(0,0,0,0.45)",
          fontSize: 20, letterSpacing: "1px", color: "rgba(255,255,255,0.92)",
        }}>
          <div style={{ width: 10, height: 10, borderRadius: 999, background: accent, display: "flex" }} />
          <span>{`ANTEROOM · ${magName}`}</span>
        </div>
        {/* headline */}
        <div style={{
          position: "absolute", left: 64, right: 64, bottom: 56, display: "flex",
          fontSize, lineHeight: 1.15, fontWeight: 700, letterSpacing: "-0.5px",
          textShadow: "0 2px 12px rgba(0,0,0,0.6)",
        }}>
          {title}
        </div>
        <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 6, display: "flex",
          background: `linear-gradient(90deg, ${accent}, ${accent}40, transparent)` }} />
      </div>
    ),
    { width: 1200, height: 630, fonts }
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
