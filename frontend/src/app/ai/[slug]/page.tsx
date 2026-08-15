"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import FrontierRail from "@/components/FrontierRail";
import AdminCardTools from "@/components/AdminCardTools";
import { sourceLabel, hostOf } from "@/lib/sourceUtil";

type NewsItem = {
  id: string; title: string; headline?: string | null; summary: string | null;
  sourceUrl: string | null; sourceName?: string | null; imageUrl?: string | null; publishedAt?: string | null;
  pinned?: boolean; magazineId?: string | null; subcategory?: string | null;
};
type ModelInfo = { slug: string; name: string; vendor: string; color: string; desc: string };

// Curated page of news for ONE tracked AI model/framework (e.g. /ai/deepseek).
// Two-column on desktop: story history left, AI Frontier rail right.
export default function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (params as any).slug || "";
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [err, setErr] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [magazines, setMagazines] = useState<{ id: string; name: string }[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    fetch("/api/admin/session").then((r) => r.json()).then((j) => {
      setIsAdmin(!!j.isAdmin);
      if (j.isAdmin) {
        fetch("/api/magazines").then((r) => r.json()).then((m) => {
          if (m.magazines) setMagazines(m.magazines.map((x: any) => ({ id: x.id, name: x.name })));
        }).catch(() => {});
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/ai/model/${slug}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error) { setModel(j.model); setNews(j.news || []); } else setErr(j.error); })
      .catch(() => setErr("couldn't load"));
  }, [slug, reloadKey]);

  return (
    <>
      <style>{`@media(min-width:921px){.ai-mp{display:flex;gap:28px;align-items:flex-start}.ai-mp-main{flex:1 1 0;min-width:0}.ai-mp-rail{flex:0 0 280px;width:280px;max-width:100%;position:sticky;top:76px}}
        /* Admin tools: hidden unless hovering the story card */
        .ai-subcard-tools{opacity:0;pointer-events:none;transition:opacity .14s ease}
        .ai-subcard:hover .ai-subcard-tools{opacity:1;pointer-events:auto}
        @media(max-width:760px){.ai-subcard-tools{position:static!important;opacity:1!important;pointer-events:auto!important;margin-top:4px;border-radius:10px;border-top:1px solid rgba(150,150,150,.25)!important}}
      `}</style>
      <div className="ai-mp">
        <div className="ai-mp-main" style={{ maxWidth: 860, margin: "0 auto", padding: "24px 20px 60px" }}>
          <Link href="/magazines/neural-hardware" style={{ fontSize: 12, opacity: .6, textDecoration: "none", color: "inherit" }}>← Neural Hardware</Link>
          {err && <div style={{ marginTop: 20 }}>{err}</div>}
          {model && (
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: "50%", background: model.color }} />
              <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800 }}>{model.name}</h1>
              <span style={{ opacity: .55, fontSize: 13 }}>{model.vendor}</span>
            </div>
          )}
          {model && <div style={{ opacity: .6, fontSize: 13, marginTop: 4 }}>{model.desc}</div>}
          <div style={{ margin: "18px 0 4px", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1.5, opacity: .6 }}>Story history ({news.length})</div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {news.map((a) => {
              const showTools = isAdmin && !!a.sourceUrl;
              const label = sourceLabel(a.sourceUrl, undefined, a.sourceName);
              return (
                <div key={a.id} className="ai-subcard" style={{ position: "relative" }}>
                  <a href={`/articles/${a.id}`} style={{
                    display: "flex", gap: 14, textDecoration: "none", color: "inherit",
                    border: "1px solid var(--border,rgba(150,150,150,.16))", borderRadius: 12, padding: 14, transition: "border-color .12s", minWidth: 0,
                  }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--accent,#ffd700)")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--border,rgba(150,150,150,.16))")}>
                    {a.imageUrl ? (
                      <img src={a.imageUrl} alt="" style={{ flex: "0 0 120px", width: 120, height: 76, objectFit: "cover", borderRadius: 8 }} loading="lazy" />
                    ) : (
                      // Graceful fallback thumbnail so Google-News-sourced stories
                      // (which carry no image) aren't blank in the list.
                      <div style={{ flex: "0 0 120px", width: 120, height: 76, borderRadius: 8, background: "linear-gradient(135deg, " + (model?.color || "#555") + "22, rgba(127,127,127,.12))", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: 22, color: (model?.color || "#888") }}>
                        {(model?.name || "?").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      {a.pinned && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent,#ffd700)", letterSpacing: 1 }}>PINNED</div>}
                      <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{a.headline || a.title}</div>
                      {a.summary && <div style={{ fontSize: 12.5, opacity: .65, marginTop: 4, lineHeight: 1.45 }}>{a.summary}</div>}
                      <div style={{ fontSize: 11, opacity: .55, marginTop: 6, display: "flex", gap: 10, flexWrap: "wrap" }}>
                        {a.sourceUrl && <span>via {label}</span>}
                        {a.publishedAt && <span>{new Date(a.publishedAt).toLocaleString()}</span>}
                      </div>
                    </div>
                  </a>
                  {showTools && (
                    <div className="ai-subcard-tools" style={{
                      position: "absolute", left: 0, right: 0, bottom: 0, borderRadius: 0,
                      border: "1px solid rgba(150,150,150,.25)", borderTop: "1px solid var(--accent, rgba(255,215,0,.45))",
                      background: "rgba(10,12,16,.95)", padding: "6px 8px",
                    }}>
                      <AdminCardTools
                        articleId={a.id}
                        currentMag={a.magazineId || "neural-hardware"}
                        currentSubcat={a.subcategory}
                        featured={false}
                        pinned={!!a.pinned}
                        magazines={magazines}
                        subcats={[]}
                        onChanged={() => setReloadKey((k) => k + 1)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {!err && model && news.length === 0 && <div style={{ opacity: .55, padding: 20 }}>No published stories tagged to this model yet.</div>}
          </div>
        </div>

        <div className="ai-mp-rail" style={{ padding: "24px 20px 40px 0" }}>
          <FrontierRail />
        </div>
      </div>
    </>
  );
}