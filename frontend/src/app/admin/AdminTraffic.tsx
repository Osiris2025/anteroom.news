"use client";
import { useEffect, useState } from "react";

type TrafficData = {
  totalViews: number;
  todayViews: number;
  weekViews: number;
  topPages: { path: string; views: number }[];
  topReferrers: { referrer: string; views: number }[];
  utmSources: { source: string; views: number }[];
  utmCampaigns: { campaign: string; views: number }[];
  dailyViews: { date: string; views: number }[];
};

const card: React.CSSProperties = {
  background: "#121519",
  border: "1px solid rgba(150,150,150,.18)",
  borderRadius: 12,
  padding: 16,
};

const barStyle = (pct: number): React.CSSProperties => ({
  height: 6,
  borderRadius: 3,
  background: `linear-gradient(90deg, var(--accent,#ffd700) ${pct}%, rgba(150,150,150,.15) ${pct}%)`,
  marginTop: 4,
});

export default function AdminTraffic() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    fetch("/api/admin/traffic")
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setErr(j.error);
        else setData(j);
      })
      .catch(() => setErr("Failed to load traffic data"));
  }, []);

  if (err) return <div style={{ color: "#f87171", fontSize: 13 }}>{err}</div>;
  if (!data) return <div style={{ opacity: 0.6 }}>Loading traffic analytics...</div>;

  const maxViews = Math.max(...data.topReferrers.map((r) => r.views), 1);
  const maxPageViews = Math.max(...data.topPages.map((p) => p.views), 1);
  const maxUtmViews = Math.max(...data.utmSources.map((u) => u.views), 1);
  const maxDaily = Math.max(...data.dailyViews.map((d) => d.views), 1);

  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Summary stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 12 }}>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>Total Views</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4 }}>{data.totalViews.toLocaleString()}</div>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>Last 24h</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: "#34d399" }}>{data.todayViews.toLocaleString()}</div>
        </div>
        <div style={{ ...card, textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: 1, textTransform: "uppercase", opacity: 0.6 }}>This Week</div>
          <div style={{ fontSize: 32, fontWeight: 800, marginTop: 4, color: "#58a6ff" }}>{data.weekViews.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(360px,1fr))", gap: 18 }}>
        {/* Daily views chart */}
        <div style={card}>
          <h3 style={{ margin: "0 0 12px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
            Daily Views (14 days)
          </h3>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
            {data.dailyViews.map((d) => (
              <div key={d.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "100%",
                    background: "var(--accent,#ffd700)",
                    borderRadius: "3px 3px 0 0",
                    height: `${Math.max(3, (d.views / maxDaily) * 80)}px`,
                    opacity: 0.8,
                    minHeight: 3,
                  }}
                  title={`${d.date}: ${d.views} views`}
                />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9, marginTop: 4, opacity: 0.5 }}>
            <span>{data.dailyViews[0]?.date?.slice(5) || ""}</span>
            <span>{data.dailyViews[data.dailyViews.length - 1]?.date?.slice(5) || ""}</span>
          </div>
        </div>

        {/* Top pages */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>Top Pages</h3>
          {data.topPages.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No data yet.</div>}
          {data.topPages.map((p) => (
            <div key={p.path} style={{ padding: "4px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "75%" }}>{p.path}</span>
                <b style={{ color: "#58a6ff" }}>{p.views}</b>
              </div>
              <div style={barStyle((p.views / maxPageViews) * 100)} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        {/* Top referrers */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
            Referrer Sources
          </h3>
          {data.topReferrers.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No data yet.</div>}
          {data.topReferrers.map((r) => (
            <div key={r.referrer} style={{ padding: "4px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "72%" }}>{r.referrer}</span>
                <b style={{ color: "#34d399" }}>{r.views}</b>
              </div>
              <div style={barStyle((r.views / maxViews) * 100)} />
            </div>
          ))}
        </div>

        {/* UTM sources */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
            UTM Sources
          </h3>
          {data.utmSources.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No data yet.</div>}
          {data.utmSources.map((u) => (
            <div key={u.source} style={{ padding: "4px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{u.source === "(none)" ? <span style={{ opacity: 0.4 }}>direct/organic</span> : u.source}</span>
                <b style={{ color: "#fbbf24" }}>{u.views}</b>
              </div>
              <div style={barStyle((u.views / maxUtmViews) * 100)} />
            </div>
          ))}
        </div>

        {/* UTM campaigns */}
        <div style={card}>
          <h3 style={{ margin: "0 0 10px", fontSize: 15, letterSpacing: 1, textTransform: "uppercase" }}>
            UTM Campaigns
          </h3>
          {data.utmCampaigns.length === 0 && <div style={{ opacity: 0.6, fontSize: 13 }}>No data yet.</div>}
          {data.utmCampaigns.map((c) => (
            <div key={c.campaign} style={{ padding: "4px 0", borderBottom: "1px solid rgba(150,150,150,.08)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                <span>{c.campaign === "(none)" ? <span style={{ opacity: 0.4 }}>no campaign</span> : c.campaign}</span>
                <b style={{ color: "#a78bfa" }}>{c.views}</b>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11, opacity: 0.4, textAlign: "center", marginTop: 8 }}>
        Data collected via client-side page view tracking with UTM parameter capture.
      </div>
    </div>
  );
}