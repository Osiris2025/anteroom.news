import type { CSSProperties } from "react";
import { cleanCommentaryParagraphs } from "@/lib/commentary";

/**
 * Renders article commentary as real paragraphs.
 *
 * Commentary is stored as plain text (paragraphs separated by blank lines).
 * Older rows can contain stray markdown (**bold**, *italics*, "Take:" labels,
 * bullets, "Source: https://..." lines); cleanCommentaryParagraphs strips those
 * so legacy text still reads cleanly. Each paragraph is rendered as React text
 * inside <p>, so it is always HTML-escaped. Never use dangerouslySetInnerHTML
 * for commentary.
 */
export default function CommentaryBody({
  text,
  style,
  paragraphStyle,
  maxChars,
}: {
  text: string | null | undefined;
  style?: CSSProperties;
  paragraphStyle?: CSSProperties;
  /** Optional preview length; the last shown paragraph is cut with "…". */
  maxChars?: number;
}) {
  let paras = cleanCommentaryParagraphs(text);
  if (maxChars && maxChars > 0) {
    const out: string[] = [];
    let used = 0;
    for (const p of paras) {
      if (used + p.length <= maxChars) { out.push(p); used += p.length; continue; }
      const room = maxChars - used;
      if (room > 40) out.push(p.slice(0, room).replace(/\s+\S*$/, "") + "…");
      else if (out.length) out[out.length - 1] = out[out.length - 1].replace(/[.!?]?$/, "") + "…";
      break;
    }
    paras = out;
  }
  if (paras.length === 0) return null;
  return (
    <div style={style}>
      {paras.map((p, i) => (
        <p key={i} style={{ margin: i === paras.length - 1 ? 0 : "0 0 0.85em", ...paragraphStyle }}>
          {p}
        </p>
      ))}
    </div>
  );
}
