"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

type ArticleHit = {
  id: string;
  title: string;
  headline?: string | null;
  summary?: string | null;
  sourceUrl?: string | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  subcategory?: string | null;
  magazine?: { id: string; name: string } | null;
};

const MAGAZINES_LIST = [
  { id: "tech-pulse", name: "Tech Pulse" },
  { id: "poli-split", name: "Poli Split" },
  { id: "weekly-weird-news", name: "Weekly Weird News" },
  { id: "weird-and-wild", name: "New Frontiers in Science" },
  { id: "climate-watch", name: "Climate Watch" },
  { id: "startup-signal", name: "Startup Signal" },
  { id: "oss-report", name: "OSS Report" },
  { id: "the-veil", name: "The Veil" },
  { id: "the-green-room", name: "The Green Room" },
  { id: "just-the-news", name: "Just The News" },
];

function SearchPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [magazine, setMagazine] = useState(searchParams.get("magazine") || "all");
  const [results, setResults] = useState<ArticleHit[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");

  const doSearch = useCallback(async (query: string, mag: string) => {
    if (!query.trim()) {
      setResults([]);
      setSearched(false);
      return;
    }

    setLoading(true);
    setError("");
    setSearched(true);

    try {
      const params = new URLSearchParams();
      params.set("q", query.trim());
      params.set("limit", "50");
      if (mag && mag !== "all") params.set("magazine", mag);

      const r = await fetch(`/api/articles?${params.toString()}`);
      if (!r.ok) {
        setError(`Search failed (${r.status})`);
        setResults([]);
        return;
      }
      const j = await r.json();
      setResults(j.articles || []);
    } catch (e: any) {
      setError(e?.message || "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (magazine && magazine !== "all") params.set("magazine", magazine);
    const qs = params.toString();
    router.replace(`/search${qs ? `?${qs}` : ""}`, { scroll: false });
    doSearch(q, magazine);
  };

  useEffect(() => {
    const qp = searchParams.get("q");
    const mp = searchParams.get("magazine");
    if (qp) {
      setQ(qp);
      if (mp) setMagazine(mp);
      doSearch(qp, mp || "all");
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ letterSpacing: "-.02em" }}>
        🔍 Search Articles
      </h1>

      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-medium mb-1 opacity-60">Search terms</label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type to search across all articles…"
            className="w-full px-4 py-2.5 rounded-lg border text-sm"
            style={{
              border: "1px solid rgba(150,150,150,.3)",
              background: "transparent",
              color: "inherit",
              outline: "none",
            }}
            autoFocus
          />
        </div>

        <div className="w-[180px]">
          <label className="block text-xs font-medium mb-1 opacity-60">Magazine</label>
          <select
            value={magazine}
            onChange={(e) => setMagazine(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg border text-sm"
            style={{
              border: "1px solid rgba(150,150,150,.3)",
              background: "transparent",
              color: "inherit",
              outline: "none",
            }}
          >
            <option value="all">All magazines</option>
            {MAGAZINES_LIST.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-lg text-sm font-medium text-white"
          style={{ background: "var(--accent,#3b82f6)" }}
        >
          {loading ? "Searching…" : "Search"}
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg mb-4 text-sm" style={{ background: "rgba(239,68,68,.15)", color: "#ef4444" }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="text-center py-12 opacity-60 text-sm">Searching…</div>
      )}

      {!loading && searched && results.length === 0 && !error && (
        <div className="text-center py-12 opacity-50">
          <div className="text-3xl mb-3">🔍</div>
          <p className="text-sm">No articles found for &ldquo;{q}&rdquo;</p>
          <p className="text-xs mt-1 opacity-60">Try different search terms or remove the magazine filter</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div>
          <p className="text-xs mb-4 opacity-50">
            {results.length} result{results.length !== 1 ? "s" : ""} for &ldquo;{q}&rdquo;
            {magazine !== "all" ? ` in ${MAGAZINES_LIST.find((m) => m.id === magazine)?.name || magazine}` : ""}
          </p>

          <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))" }}>
            {results.map((a) => (
              <Link
                key={a.id}
                href={`/articles/${a.id}`}
                className="block p-4 rounded-xl transition-all hover:scale-[1.02]"
                style={{
                  background: "rgba(150,150,150,.06)",
                  border: "1px solid rgba(150,150,150,.15)",
                  textDecoration: "none",
                  color: "inherit",
                }}
              >
                <div className="flex items-start gap-2 mb-2">
                  {a.magazine && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded"
                      style={{ background: "rgba(59,130,246,.15)", color: "var(--accent,#3b82f6)" }}
                    >
                      {a.magazine.name}
                    </span>
                  )}
                  {a.subcategory && (
                    <span className="text-[10px] opacity-50">{a.subcategory}</span>
                  )}
                </div>
                <h3 className="text-sm font-semibold leading-snug mb-1">{a.title}</h3>
                {a.summary && (
                  <p className="text-xs opacity-65 line-clamp-2 leading-relaxed">
                    {a.summary.replace(/<[^>]*>/g, "").slice(0, 200)}
                  </p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[11px] opacity-40">
                  {a.publishedAt && (
                    <span>{new Date(a.publishedAt).toLocaleDateString()}</span>
                  )}
                  {a.sourceUrl && (
                    <span className="truncate">{new URL(a.sourceUrl).hostname.replace(/^www\./, "")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {!searched && (
        <div className="text-center py-16 opacity-40">
          <div className="text-4xl mb-4">🔎</div>
          <p className="text-sm">Type a search query and press Enter or click Search</p>
          <p className="text-xs mt-2">Full-text search across all {MAGAZINES_LIST.length} magazines</p>
        </div>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="text-center py-16 opacity-40">
        <div className="text-4xl mb-4">🔎</div>
        <p className="text-sm">Loading search…</p>
      </div>
    }>
      <SearchPageInner />
    </Suspense>
  );
}