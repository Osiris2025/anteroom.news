"use client";
import { useEffect, useState } from "react";

type Acct = {
  id: string; platform: string; handle: string | null; displayName: string | null;
  enabled: boolean; utmSource: string | null; hasSecret: boolean; createdAt: string;
};

const PLATFORMS = [
  { id: "x", label: "𝕏 Twitter / X" },
  { id: "bluesky", label: "Bluesky" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "instagram", label: "Instagram" },
  { id: "mastodon", label: "Mastodon" },
];

const FIELD_HELP: Record<string, string> = {
  x: "API Bearer/oAuth token (from xurl auth). Posting cost ~$0.20/linked post.",
  bluesky: "Bluesky app password (App Passwords → Generate). Free.",
  linkedin: "LinkedIn OAuth access token. Free.",
  threads: "Threads API token (Meta).",
  instagram: "Instagram Graph API long-lived token.",
  mastodon: "Mastodon access token (Settings → Development).",
};

function card(bg: string, border: string, fg: string) { return { background: bg, border: `1px solid ${border}`, color: fg, borderRadius: 10, padding: 12 }; }
function input(bg: string, fg: string, border: string) { return { background: bg, border: `1px solid ${border}`, color: fg, borderRadius: 6, padding: "6px 8px", fontSize: 14, width: "100%", boxSizing: "border-box" as const }; }

export default function AdminSocial() {
  const [accts, setAccts] = useState<Acct[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  // add/edit form
  const [editing, setEditing] = useState<Acct | null>(null);
  const [platform, setPlatform] = useState("x");
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [utm, setUtm] = useState("");
  const [secret, setSecret] = useState("");

  const load = async () => {
    const r = await fetch("/api/admin/social").then((x) => x.json()).catch(() => null);
    setAccts(r?.accounts || []);
  };
  useEffect(() => { load(); }, []);

  const reset = () => {
    setEditing(null); setPlatform("x"); setHandle(""); setDisplayName(""); setEnabled(false); setUtm(""); setSecret("");
  };

  const save = async () => {
    setBusy(true); setMsg("");
    if (!handle.trim()) { setMsg("⚠ A handle / username is required"); setBusy(false); return; }
    let accountJson = editing?.hasSecret ? undefined : "{}";
    if (secret.trim()) accountJson = JSON.stringify({ token: secret.trim() });
    const body: Record<string, unknown> = {
      ...(editing ? { id: editing.id } : {}),
      platform, handle, displayName,
      enabled,
      utmSource: utm,
      accountJson: accountJson || "{}",
    };
    const r = await fetch("/api/admin/social", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    }).then((x) => x.json());
    if (r.error) setMsg(`⚠ ${r.error}`);
    else { setMsg("✔ Saved"); reset(); }
    await load(); setBusy(false);
  };

  const del = async (id: string) => {
    if (!confirm("Remove this social account?")) return;
    await fetch(`/api/admin/social?id=${id}`, { method: "DELETE" });
    await load();
  };

  const lang = { label: "#f1f5f9", muted: "#9aa6b2", line: "rgba(255,255,255,.08)", input: "#0f1217", inputLine: "rgba(255,255,255,.18)", cardBg: "#0d1015", field: "#1a1f27" };

  const label = PLATFORMS.find((p) => p.id === platform)?.label || platform;

  return (
    <div style={{ padding: 16, color: lang.label }}>
      <h2 style={{ margin: "0 0 4px", fontSize: 20 }}>🌐 Social Accounts</h2>
      <p style={{ margin: "0 0 18px", color: lang.muted, fontSize: 13 }}>
        Enter the publishing accounts so Anteroom can auto-post approved articles.
        Tokens/credentials are stored per account (masked after entry).
      </p>

      {/* stored list */}
      <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))", marginBottom: 24 }}>
        {accts.length === 0 && (
          <div style={{ ...card(lang.cardBg, lang.line, lang.muted), gridColumn: "1 / -1" }}>No accounts yet — add your first below.</div>
        )}
        {accts.map((a) => (
          <div key={a.id} style={{ ...card(lang.cardBg, lang.line, lang.label), position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <b>{PLATFORMS.find((p) => p.id === a.platform)?.label || a.platform}</b>
              <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 10, background: a.enabled ? "#0f5132" : "#3a3a3a", color: a.enabled ? "#7eefb0" : "#aaa" }}>{a.enabled ? "● Enabled" : "○ Off"}</span>
            </div>
            <div style={{ fontSize: 14, margin: "6px 0" }}>@{a.handle}</div>
            <div style={{ fontSize: 12, color: lang.muted }}>{a.displayName || ""}</div>
            <div style={{ fontSize: 11, color: lang.muted, marginTop: 4 }}>
              {a.hasSecret ? "✔ token set" : "✗ no token"} {a.utmSource ? `· utm ${a.utmSource}` : ""}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
              <button onClick={() => { setEditing(a); setPlatform(a.platform); setHandle(a.handle || ""); setDisplayName(a.displayName || ""); setEnabled(a.enabled); setUtm(a.utmSource || ""); setSecret(""); const f = document.getElementById("social-form"); if (f) f.scrollIntoView({ behavior: "smooth" }); }} style={{ ...{ flex: 1 }, background: "#1a1f27", border: "1px solid rgba(255,255,255,.15)", color: lang.label, borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 13 }}>Edit</button>
              <button onClick={() => del(a.id)} style={{ ...{ flex: 1 }, background: "#2a1515", border: "1px solid rgba(248,113,113,.3)", color: "#f87171", borderRadius: 6, padding: "5px 0", cursor: "pointer", fontSize: 13 }}>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {/* add / edit form */}
      <div id="social-form" style={{ ...card(lang.field, lang.line, lang.label), maxWidth: 620 }}>
        <h3 style={{ margin: "0 0 14px", fontSize: 16 }}>{editing ? `Edit ${label}` : "Add social account"}</h3>
        <div style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))" }}>
          <label style={{ fontSize: 12, color: lang.muted }}>Platform
            <select value={platform} onChange={(e) => setPlatform(e.target.value)} style={{ ...input(lang.input, lang.label, lang.inputLine), marginTop: 4 }}>
              {PLATFORMS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>
          <label style={{ fontSize: 12, color: lang.muted }}>Handle / username (e.g. @nexusnews)
            <input value={handle} onChange={(e) => setHandle(e.target.value)} style={{ ...input(lang.input, lang.label, lang.inputLine), marginTop: 4 }} placeholder="@nexusnews" />
          </label>
          <label style={{ fontSize: 12, color: lang.muted }}>Display name (optional)
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} style={{ ...input(lang.input, lang.label, lang.inputLine), marginTop: 4 }} placeholder="News Nexus" />
          </label>
          <label style={{ fontSize: 12, color: lang.muted }}>UTM source (attribution tag)
            <input value={utm} onChange={(e) => setUtm(e.target.value)} style={{ ...input(lang.input, lang.label, lang.inputLine), marginTop: 4 }} placeholder="x" />
          </label>
          <label style={{ fontSize: 12, color: lang.muted }}>Token / credential {editing?.hasSecret ? "(hidden — leave blank to keep)" : ""}
            <input type="password" value={secret} onChange={(e) => setSecret(e.target.value)} style={{ ...input(lang.input, lang.label, lang.inputLine), marginTop: 4 }} placeholder="••••••••" />
          </label>
        </div>
        <div style={{ fontSize: 12, color: lang.muted, marginTop: 8 }}>💡 {FIELD_HELP[platform]}</div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, margin: "14px 0", fontSize: 14, cursor: "pointer" }}>
          <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} style={{ width: 16, height: 16 }} />
          Enabled (include in auto-publish)
        </label>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button onClick={save} disabled={busy} style={{ background: "#1d4ed8", border: "none", color: "#fff", borderRadius: 6, padding: "8px 18px", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>{busy ? "Saving…" : "Save account"}</button>
          {editing && <button onClick={reset} style={{ background: "transparent", border: "1px solid rgba(255,255,255,.2)", color: lang.label, borderRadius: 6, padding: "8px 14px", cursor: "pointer", fontSize: 13 }}>Cancel</button>}
          {msg && <span style={{ fontSize: 13 }}>{msg}</span>}
        </div>
      </div>
    </div>
  );
}