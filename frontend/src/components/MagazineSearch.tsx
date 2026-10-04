"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

type Hit = {
  id: string;
  title: string;
  headline?: string | null;
  magazine?: { id: string; name: string } | null;
};

/**
 * Fuzzy article search in the top navbar, pre-scoped to the current magazine.
 * Mirrors the admin queue's fuzzy `?q=` matching (server-side ilike on
 * title/headline/summary). If we're not on a magazine page, searches across
 * all live articles. Selecting a result opens the article.
 */
export default function MagazineSearch({ vertical = false }: { vertical?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Derive the current magazine from the route (/magazines/tech-pulse).
  const m = pathname.match(/^\/magazines\/([^/]+)/)?.[1] || "";

  // Debounced fuzzy search.
  useEffect(() => {
    if (!q.trim()) { setHits([]); setOpen(false); return; }
    setBusy(true);
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/articles?${m ? `magazine=${m}&` : ""}q=${encodeURIComponent(q.trim())}&limit=8`);
        const j = await r.json();
        setHits(j.articles || []);
        setOpen(true);
      } catch { setHits([]); setOpen(false); }
      setBusy(false);
    }, 220);
    return () => clearTimeout(t);
  }, [q, m]);

  // Close on outside click / Escape.
  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onClick); document.removeEventListener("keydown", onKey); };
  }, []);

  return (
    <div ref={box} style={{ position: "relative", marginRight: vertical ? 0 : 14, width: vertical ? "100%" : "min(220px, 20vw)", marginBottom: vertical ? 6 : 0 }}>
      <input
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => { if (hits.length) setOpen(true); }}
        placeholder={m ? `🔍 Search ${m.replace(/-/g, " ")}…` : "🔍 Search articles…"}
        style={{
          width: "100%", padding: "7px 12px", borderRadius: 8, fontSize: 13,
          border: "1px solid rgba(150,150,150,.3)", background: "transparent",
          color: "inherit", outline: "none",
        }}
      />
      {busy && q.trim() && hits.length === 0 && (
        <div style={{ position: "absolute", top: 40, left: 0, right: 0, padding: 8, fontSize: 12, opacity: .6 }}>searching…</div>
      )}
      {open && hits.length > 0 && (
        <div style={{
          position: "absolute", top: 40, left: 0, right: 0, zIndex: 60,
          background: "var(--bg,#101317)", border: "1px solid rgba(150,150,150,.25)", borderRadius: 10,
          boxShadow: "0 8px 24px rgba(0,0,0,.35)", overflow: "hidden", maxHeight: 380, overflowY: "auto",
        }}>
          {hits.map((a) => (
            <Link
              key={a.id}
              href={`/articles/${a.id}`}
              onClick={() => setOpen(false)}
              style={{ display: "block", padding: "9px 12px", textDecoration: "none", color: "inherit", borderBottom: "1px solid rgba(150,150,150,.1)" }}
            >
              <div style={{ fontSize: 13, lineHeight: 1.3 }}>{a.title}</div>
              {a.magazine?.name && <div style={{ fontSize: 11, opacity: .6, marginTop: 2 }}>{a.magazine.name}</div>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}