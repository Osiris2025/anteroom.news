"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import FrontierRail from "@/components/FrontierRail";

type NewsItem = {
  id: string; title: string; headline?: string | null; summary: string | null;
  sourceUrl: string | null; imageUrl?: string | null; publishedAt?: string | null;
  pinned?: boolean; magazineId?: string | null;
};
type ModelInfo = { slug: string; name: string; vendor: string; color: string; desc: string };

// Curated page of news for ONE tracked AI model/framework (e.g. /ai/deepseek).
// Two-column on desktop: story history left, AI Frontier rail right.
export default function ModelPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (params as any).slug || "";
  const [model, setModel] = useState<ModelInfo | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch(`/api/ai/model/${slug}`)
      .then((r) => r.json())
      .then((j) => { if (!j.error) { setModel(j.model); setNews(j.news || []); } else setErr(j.error); })
      .catch(() => setErr("couldn't load"));
  }, [slug]);

  return (
    <>
      <style>{`@media(min-width:921px){.ai-mp{display:flex;gap:28px;align-items:flex-start}.ai-mp-main{flex:1 1 0;min-width:0}.ai-mp-rail{flex:0 0 280px;width:280px;max-width:100%;position:sticky;top:76px}}`}</style>
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
            {news.map((a) => (
              <a key={a.id} href={`/articles/${a.id}`} style={{
                display: "flex", gap: 14, textDecoration: "none", color: "inherit",
                border: "1px solid var(--border,rgba(150,150,150,.16))", borderRadius: 12, padding: 14, transition: "border-color .12s", minWidth: 0,
              }}>
                {a.imageUrl && (
                  <img src={a.imageUrl} alt="" style={{ flex: "0 0 120px", width: 120, height: 76, objectFit: "cover", borderRadius: 8 }} loading="lazy" />
                )}
                <div style={{ minWidth: 0 }}>
                  {a.pinned && <div style={{ fontSize: 9, fontWeight: 700, color: "var(--accent,#ffd700)", letterSpacing: 1 }}>PINNED</div>}
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.3 }}>{a.headline || a.title}</div>
                  {a.summary && <div style={{ fontSize: 12.5, opacity: .65, marginTop: 4, lineHeight: 1.45 }}>{a.summary}</div>}
                  {a.publishedAt && <div style={{ fontSize: 11, opacity: .5, marginTop: 6 }}>{new Date(a.publishedAt).toLocaleString()}</div>}
                </div>
              </a>
            ))}
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