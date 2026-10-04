"use client";

import { useEffect, useState } from "react";

type Opt = { id: string; name: string };

/** Dropdown to pick the default magazine from the magazines the reader follows. */
export default function DefaultMagazineSelect({ ink, body, accent }: { ink: string; body: string; accent: string }) {
  const [opts, setOpts] = useState<Opt[]>([]);
  const [value, setValue] = useState("");
  const [ready, setReady] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [f, p] = await Promise.all([fetch("/api/follows").then((r) => r.json()), fetch("/api/preferences").then((r) => r.json())]);
        const list: Opt[] = (f.follows || []).map((x: any) => ({ id: x.magazineId, name: x.magazineName }));
        if (p.defaultMagazineId && !list.some((o) => o.id === p.defaultMagazineId)) {
          list.push({ id: p.defaultMagazineId, name: p.defaultMagazineName || p.defaultMagazineId });
        }
        list.sort((a, b) => a.name.localeCompare(b.name));
        setOpts(list);
        setValue(p.defaultMagazineId || "");
      } catch {}
      setReady(true);
    })();
  }, []);

  const change = async (v: string) => {
    setValue(v); setMsg(null);
    try {
      const r = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaultMagazineId: v || null }),
      });
      setMsg(r.ok ? "Saved ✓" : "Could not save.");
    } catch { setMsg("Could not save."); }
  };

  if (!ready) return null;
  return (
    <div style={{ marginTop: 14 }}>
      <label style={{ display: "block", fontWeight: 700, color: ink, marginBottom: 4 }}>Default magazine</label>
      <select
        value={value}
        onChange={(e) => change(e.target.value)}
        style={{ padding: "8px 10px", borderRadius: 8, border: `1px solid ${accent}`, background: "transparent", color: ink, minWidth: 240 }}
      >
        <option value="">Home page (choose each time)</option>
        {opts.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      {msg && <span style={{ marginLeft: 10, fontSize: 13, color: body }}>{msg}</span>}
      <p style={{ fontSize: 12.5, color: body, opacity: 0.75, marginTop: 4 }}>
        {opts.length === 0 ? "Follow a magazine, or use “Make this my default magazine” on its page, and it will show up here." : "This is where you land after you sign in."}
      </p>
    </div>
  );
}
