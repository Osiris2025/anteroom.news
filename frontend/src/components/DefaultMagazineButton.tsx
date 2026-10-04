"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

/** "Make this my default magazine" — sits right after the Follow button.
 *  Signed-in readers only. Click again to clear the default. */
export default function DefaultMagazineButton({ magazineId, magazineName, accent }: { magazineId: string; magazineName: string; accent?: string }) {
  const { data: session } = useSession();
  const uid = (session?.user as any)?.id;
  const [current, setCurrent] = useState<string | null | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!uid) { setCurrent(undefined); return; }
    (async () => {
      try {
        const r = await fetch("/api/preferences");
        const j = await r.json();
        setCurrent(j.defaultMagazineId ?? null);
      } catch { setCurrent(null); }
    })();
  }, [uid, magazineId]);

  useEffect(() => {
    const on = (e: Event) => setCurrent((e as CustomEvent).detail?.id ?? null);
    window.addEventListener("nexus:default-magazine", on);
    return () => window.removeEventListener("nexus:default-magazine", on);
  }, []);

  if (!uid || current === undefined) return null;
  const isDefault = current === magazineId;
  const color = accent || "#0072f5";

  const toggle = async () => {
    setLoading(true);
    try {
      const next = isDefault ? null : magazineId;
      const r = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultMagazineId: next }),
      });
      if (r.ok) { setCurrent(next); window.dispatchEvent(new CustomEvent("nexus:default-magazine", { detail: { id: next } })); }
    } catch (e) { console.error("Default magazine change failed", e); }
    setLoading(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={isDefault ? `${magazineName} is your default magazine. Click to clear.` : `You'll land on ${magazineName} when you sign in`}
      style={{
        fontSize: 12, fontWeight: 600, letterSpacing: "0.2px",
        border: `1px solid ${isDefault ? color : "#ddd"}`,
        borderRadius: 999, padding: "4px 12px", cursor: loading ? "wait" : "pointer",
        background: isDefault ? color : "transparent",
        color: isDefault ? "#fff" : "#666",
        display: "inline-flex", alignItems: "center", gap: 6,
        whiteSpace: "nowrap", transition: "all 0.15s",
        boxShadow: isDefault ? `0 1px 6px ${color}55` : "none",
      }}
    >
      {loading ? "..." : isDefault ? "✓ Your default magazine" : "⌂ Make this my default magazine"}
    </button>
  );
}
