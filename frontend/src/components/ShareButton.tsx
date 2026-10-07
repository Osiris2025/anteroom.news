"use client";
import { useState } from "react";

// Native share sheet (Web Share API). On iPhone/iPad/Mac Safari this opens the
// Apple share sheet. Where navigator.share is missing, copies the link instead.
export default function ShareButton({ title, text, url, style }: { title: string; text?: string | null; url: string; style?: React.CSSProperties }) {
  const [note, setNote] = useState<string | null>(null);
  const flash = (m: string) => { setNote(m); setTimeout(() => setNote(null), 2000); };

  async function onShare() {
    const nav: any = typeof navigator !== "undefined" ? navigator : null;
    if (nav?.share) {
      try {
        await nav.share({ title, text: text || undefined, url });
      } catch (e: any) {
        if (e?.name === "AbortError") return; // user cancelled
        await copy();
      }
      return;
    }
    await copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch {}
      ta.remove();
    }
    flash("Link copied");
  }

  return (
    <span style={{ position: "relative", display: "inline-flex" }}>
      <button type="button" onClick={onShare} aria-label="Share" style={{ ...style, display: "inline-flex", alignItems: "center", gap: 8 }}>
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 3v12" /><path d="M8 7l4-4 4 4" /><path d="M7 10H5v11h14V10h-2" />
        </svg>
        Share
      </button>
      {note && (
        <span role="status" style={{ position: "absolute", top: "100%", left: 0, marginTop: 6, fontSize: 12, whiteSpace: "nowrap", opacity: 0.9 }}>{note}</span>
      )}
    </span>
  );
}
