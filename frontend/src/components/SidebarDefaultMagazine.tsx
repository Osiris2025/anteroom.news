"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { MAGAZINES } from "@/lib/themes";

/** Sidebar control just above the magazine list: shows the reader's default magazine
 *  and, when they are on a magazine page, lets them make that one the default. */
export default function SidebarDefaultMagazine({ onNavigate }: { onNavigate?: () => void }) {
  const { data: session } = useSession();
  const uid = (session?.user as any)?.id;
  const pathname = usePathname() || "";
  const [current, setCurrent] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!uid) { setCurrent(undefined); return; }
    (async () => {
      try { const j = await (await fetch("/api/preferences")).json(); setCurrent(j.defaultMagazineId ?? null); }
      catch { setCurrent(null); }
    })();
  }, [uid]);

  useEffect(() => {
    const on = (e: Event) => setCurrent((e as CustomEvent).detail?.id ?? null);
    window.addEventListener("nexus:default-magazine", on);
    return () => window.removeEventListener("nexus:default-magazine", on);
  }, []);

  if (!uid || current === undefined) return null;

  const m = pathname.match(/^\/magazines\/([^/?#]+)/);
  const viewing = m ? decodeURIComponent(m[1]) : null;
  const viewingMag = viewing ? MAGAZINES.find((x) => x.id === viewing) : null;
  const defMag = current ? MAGAZINES.find((x) => x.id === current) : null;

  const set = async (id: string | null) => {
    setBusy(true);
    try {
      const r = await fetch("/api/preferences", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ defaultMagazineId: id }) });
      if (r.ok) { setCurrent(id); window.dispatchEvent(new CustomEvent("nexus:default-magazine", { detail: { id } })); }
    } catch {}
    setBusy(false);
  };

  const pill: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
    borderRadius: 999, padding: "5px 12px", cursor: busy ? "wait" : "pointer", whiteSpace: "nowrap",
  };

  return (
    <div style={{ padding: "0 10px 6px" }}>
      {viewingMag && current !== viewingMag.id && (
        <button onClick={() => set(viewingMag.id)} disabled={busy}
          style={{ ...pill, color: "#ffd75e", background: "rgba(255,215,94,.12)", border: "1px solid rgba(255,215,94,.45)" }}>
          ⌂ Make this my default magazine
        </button>
      )}
      {viewingMag && current === viewingMag.id && (
        <button onClick={() => set(null)} disabled={busy} title="Click to clear your default"
          style={{ ...pill, color: "#fff", background: viewingMag.accent, border: `1px solid ${viewingMag.accent}` }}>
          ✓ Your default magazine
        </button>
      )}
      {!viewingMag && defMag && (
        <a href={"/magazines/" + defMag.id} onClick={onNavigate}
          style={{ fontSize: 12, color: "#cdd3dd", textDecoration: "none" }}>
          ⌂ Your default: <b>{defMag.name}</b>
        </a>
      )}
      {!viewingMag && !defMag && (
        <span style={{ fontSize: 12, color: "#8d96a6" }}>Open a magazine to set it as your default.</span>
      )}
    </div>
  );
}
