"use client";
import { useEffect, useState } from "react";

type AdminUser = {
  id: string; name: string; email: string; role: string; tier: string; status: string; createdAt: string;
};

const ROLE_COLORS: Record<string, string> = {
  superadmin: "#ffd700", admin: "#ff8c00", user: "#4ade80", guest: "#94a3b8",
};
const TIER_COLORS: Record<string, string> = { guest: "#94a3b8", free: "#4ade80", plus: "#58a6ff", member: "#c084fc" };
const STATUS_COLORS: Record<string, string> = { active: "#34d399", disabled: "#f87171" };

export default function AdminUsers() {
  const [data, setData] = useState<{ users: AdminUser[]; roles: string[]; tiers: string[]; statuses: string[] } | null>(null);
  const [err, setErr] = useState("");

  const load = () => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((j) => { if (j.error) setErr(j.error); else setData(j); })
      .catch((e) => setErr(e.message));
  };
  useEffect(load, []);

  const patch = async (id: string, body: any) => {
    const r = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const j = await r.json();
    if (j.error) setErr(j.error); else load();
  };

  return (
    <div>
      {err && <div style={{ background: "#3a0a0a", color: "#f87171", padding: 10, borderRadius: 6, marginBottom: 14 }}>{err}</div>}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(420px,1fr))" }}>
        {data?.users.map((u) => (
          <div key={u.id} style={{ border: "1px solid rgba(150,150,150,.15)", borderRadius: 10, padding: 14, background: "var(--card-bg, rgba(255,255,255,.03))" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: "linear-gradient(135deg,#7c3aed,#2563eb)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "#fff", fontSize: 14 }}>{(u.name||"?").trim()[0]?.toUpperCase()}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700 }}>{u.name}</div>
                <div style={{ fontSize: 12, opacity: 0.65 }}>{u.email}</div>
              </div>
              <span style={{ fontSize: 10, opacity: 0.5 }}>{new Date(u.createdAt).toLocaleDateString()}</span>
            </div>
            <div style={{ display: "flex", gap: 8, flexDirection: "column", marginTop: 8 }}>
              <label style={{ fontSize: 11, opacity: 0.7 }}>Role
                <select value={u.role} onChange={(e) => patch(u.id, { role: e.target.value })} style={sel}>
                  {data.roles.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11, opacity: 0.7 }}>Tier (content access)
                <select value={u.tier} onChange={(e) => patch(u.id, { tier: e.target.value })} style={sel}>
                  {data.tiers.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </label>
              <label style={{ fontSize: 11, opacity: 0.7 }}>Status
                <select value={u.status} onChange={(e) => patch(u.id, { status: e.target.value })} style={sel}>
                  {data.statuses.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, fontSize: 10 }}>
              <span style={{ color: ROLE_COLORS[u.role] || "#ccc" }}>● {u.role}</span>
              <span style={{ color: TIER_COLORS[u.tier] || "#ccc" }}>◆ {u.tier}</span>
              <span style={{ color: STATUS_COLORS[u.status] || "#ccc" }}>■ {u.status}</span>
            </div>
          </div>
        ))}
      </div>
      {data && data.users.length === 0 && <div style={{ padding: 40, textAlign: "center", opacity: 0.5 }}>No users yet.</div>}
    </div>
  );
}

const sel: React.CSSProperties = { width: "100%", marginTop: 4, padding: "7px 9px", borderRadius: 6, border: "1px solid rgba(150,150,150,.3)", background: "#111", color: "#e6e6e6", fontSize: 13, cursor: "pointer" };