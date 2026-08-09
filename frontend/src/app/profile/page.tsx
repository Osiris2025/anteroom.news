"use client";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { authClient, useSession } from "@/lib/auth-client";

/** Resolve readable colors for the active theme (dark/light aware). */
function palette(themeId: string | undefined) {
  const dark = ["linear", "terminal", "crt", "glass", "dashboard", "crawler", "ticker", "board", "audio", "social", "map", "deco"];
  if (themeId && dark.includes(themeId)) {
    const p: Record<string, [string, string, string, string]> = {
      linear:   ["#0f1011", "#f7f8f8", "#aab6c8", "#7170ff"],
      dashboard:["#111826", "#e8edf5", "#aab6c8", "#38bdf8"],
      terminal: ["#001100", "#00ff00", "#00aa00", "#00ff00"],
      glass:    ["rgba(255,255,255,0.08)", "#fff", "#a5b4fc", "#818cf8"],
      audio:    ["#161b22", "#c9d1d9", "#a5b0bd", "#58a6ff"],
    };
    return p[themeId] || ["#1c1e26", "#e7e9ea", "#aab", "#7aa2f7"];
  }
  const l: Record<string, [string, string, string, string]> = {
    tabloid: ["#fbf5e9", "#2a2216", "#6b5b47", "#8B4513"],
  };
  return l[themeId || ""] || ["#f5f5f7", "#1a1a1a", "#666", "#0072f5"];
}

export default function ProfilePage() {
  const { currentTheme } = useTheme();
  const [box, ink, body, accent] = palette(currentTheme && currentTheme.id);
  const { data: session, isPending, refetch } = useSession();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [msg, setMsg] = useState<{ t: string; k: "ok" | "err" } | null>(null);
  const [busy, setBusy] = useState(false);

  const go = async (fn: () => Promise<{ error?: { message?: string } }> | unknown, opts?: { skipRefresh?: boolean }) => {
    setBusy(true); setMsg(null);
    const friendly = (m?: string): string => {
      if (!m) return "Error";
      const lower = m.toLowerCase();
      if (lower.includes("invalid origin") || lower.includes("unknown origin") || (typeof window !== "undefined" && !window.isSecureContext))
        return "🔒 This needs HTTPS — use the https:// URL (e.g. https://nexus.osiris2025.com).";
      if (lower.includes("invalid email or password")) return "Invalid email or password.";
      return m;
    };
    try {
      const r: any = await fn();
      if (r?.error) { setMsg({ t: friendly(r.error.message), k: "err" }); }
      else {
        setMsg({ t: r?.data?.session?.user?.email ? `Signed in — welcome! Redirecting…` : "Done ✔", k: "ok" });
        if (!opts?.skipRefresh) { try { refetch(); } catch {} }
        if (r?.data?.session?.user) { setTimeout(() => { window.location.href = "/profile"; }, 600); }
      }
    }
    catch (e: any) { setMsg({ t: friendly(e?.message), k: "err" }); }
    finally { setBusy(false); }
  };

  const s = styles(box, ink, body, accent);

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/" className="text-sm mb-6 inline-block" style={{ color: accent }}>&larr; Home</Link>
      <h1 className="text-4xl font-black mb-2" style={{ color: ink }}>Profile</h1>
      <p className="mb-8" style={{ color: body }}>{session?.user ? `Signed in as ${session.user.email}${(session.user as any).role ? ` · ${(session.user as any).role}` : ""}` : "Sign in or create an account."}</p>

      {isPending ? <p style={{ color: body }}>Loading…</p> : session?.user ? <SignedInView theme={{ box, ink, body, accent }} onSignOut={() => go(() => authClient.signOut(), { skipRefresh: true })} /> : (
        <>
          {/* Sign-in / sign-up */}
          <section className="rounded-xl p-6 mb-6 border" style={s.card}>
            <h2 id="signin" className="text-xl font-bold mb-4" style={{ color: ink }}>Sign In</h2>
            <input placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
            <input type="password" placeholder="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
            <input placeholder="your name (for sign up)" value={name} onChange={(e) => setName(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
            <div className="flex flex-wrap gap-3">
              <button disabled={busy} onClick={() => go(() => authClient.signIn.email({ email, password }))} className="px-5 py-2 rounded-lg font-semibold text-white" style={{ background: accent }}>{busy ? "…" : "Sign In"}</button>
              <button disabled={busy} onClick={() => go(() => authClient.signUp.email({ email, password, name: name || email }))} className="px-5 py-2 rounded-lg font-semibold" style={{ border: `1px solid ${accent}`, color: accent }}>{busy ? "…" : "Create Account"}</button>
              <button disabled={busy} onClick={() => go(() => authClient.signIn.passkey())} className="px-5 py-2 rounded-lg font-semibold" style={{ border: `1px solid ${accent}`, color: accent }}>
                <span style={{ marginRight: 4 }}>&#128272;</span> {busy ? "…" : "Sign in with Passkey"}
              </button>
            </div>
            {msg && <p className="mt-3 text-sm" style={{ color: msg.k === "ok" ? "#22c55e" : "#ef4444" }}>{msg.t}</p>}
          </section>

          <section className="rounded-xl p-6 mb-6 border" style={s.card}>
            <h2 id="passkey-setup" className="text-xl font-bold mb-2" style={{ color: ink }}>Passkeys</h2>
            <p className="text-sm" style={{ color: body }}>Passkeys require an HTTPS origin (secure context) to activate in the browser. On this Tailscale URL you can sign in with email; once the site is served over HTTPS, you can register a passkey from your signed-in account.</p>
          </section>

          <section className="rounded-xl p-6 border" style={s.card}>
            <h2 id="notifications" className="text-xl font-bold mb-2" style={{ color: ink }}>Notifications</h2>
            <p className="text-sm" style={{ color: body }}>Control which magazines can push alerts. Coming soon.</p>
          </section>
        </>
      )}
    </div>
  );
}

function SignedInView({ theme, onSignOut }: { theme: { box: string; ink: string; body: string; accent: string }; onSignOut: () => void }) {
  const { box, ink, body, accent } = theme;
  const s = styles(box, ink, body, accent);
  const { data } = useSession();
  const user = data?.user;

  // Change-password form state
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [cpMsg, setCpMsg] = useState<{ t: string; k: "ok" | "err" } | null>(null);
  const [cpBusy, setCpBusy] = useState(false);

  const changePassword = async () => {
    setCpBusy(true); setCpMsg(null);
    if (next !== confirm) { setCpMsg({ t: "New passwords don't match.", k: "err" }); setCpBusy(false); return; }
    if (next.length < 8) { setCpMsg({ t: "New password must be at least 8 characters.", k: "err" }); setCpBusy(false); return; }
    try {
      const r: any = await authClient.changePassword({ currentPassword: current, newPassword: next, revokeOtherSessions: true });
      if (r?.error) setCpMsg({ t: r.error.message || "Could not change password.", k: "err" });
      else { setCpMsg({ t: "Password changed ✓", k: "ok" }); setCurrent(""); setNext(""); setConfirm(""); }
    } catch (e: any) { setCpMsg({ t: e?.message || "Error", k: "err" }); }
    finally { setCpBusy(false); }
  };

  return (
    <>
      <section className="rounded-xl p-6 mb-6 border" style={s.card}>
        <h2 className="text-xl font-bold mb-2" style={{ color: ink }}>Account</h2>
        <p className="text-sm" style={{ color: body }}><b>{user?.name}</b><br />{user?.email}<br />ID: {user?.id}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <button onClick={onSignOut} className="px-5 py-2 rounded-lg font-semibold text-white" style={{ background: "#ef4444" }}>Sign Out</button>
          <button onClick={async () => { const r: any = await authClient.passkey.addPasskey({ name: "Primary" }); alert(r?.error?.message || "Passkey registered ✓ (HTTPS required to actually prompt)"); }} className="px-5 py-2 rounded-lg font-semibold" style={{ border: `1px solid ${accent}`, color: accent }}>&#128272; Register a Passkey</button>
        </div>
      </section>

      <section className="rounded-xl p-6 mb-6 border" style={s.card}>
        <h2 id="password" className="text-xl font-bold mb-3" style={{ color: ink }}>Change Password</h2>
        <input type="password" placeholder="current password" value={current} onChange={(e) => setCurrent(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
        <input type="password" placeholder="new password" value={next} onChange={(e) => setNext(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
        <input type="password" placeholder="confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
        <button onClick={changePassword} disabled={cpBusy} className="px-5 py-2 rounded-lg font-semibold text-white" style={{ background: accent }}>{cpBusy ? "…" : "Change Password"}</button>
        {cpMsg && <p className="mt-3 text-sm" style={{ color: cpMsg.k === "ok" ? "#22c55e" : "#ef4444" }}>{cpMsg.t}</p>}
      </section>

      <section className="rounded-xl p-6 border" style={s.card}>
        <h2 id="settings" className="text-xl font-bold mb-2" style={{ color: ink }}>Your Settings</h2>
        <p className="text-sm" style={{ color: body }}>Theme selection, notification prefs, and content choices.</p>
      </section>
    </>
  );
}

function styles(box: string, ink: string, body: string, accent: string) {
  return {
    card: { background: box, borderColor: "rgba(127,127,127,0.25)", color: ink },
    input: { background: "transparent", border: "1px solid rgba(127,127,127,0.35)", color: ink },
  };
}