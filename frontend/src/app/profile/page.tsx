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

  // ---- Profile picture + display name (2026-09-06) ----
  const [displayName, setDisplayName] = useState(user?.name || "");
  const [avatarMsg, setAvatarMsg] = useState<{ t: string; k: "ok" | "err" } | null>(null);
  const [avatarBusy, setAvatarBusy] = useState(false);

  const pickAvatar = (file: File | null) => {
    if (!file) return;
    setAvatarMsg(null);
    if (!file.type.startsWith("image/")) { setAvatarMsg({ t: "Pick an image file.", k: "err" }); return; }
    if (file.size > 8 * 1024 * 1024) { setAvatarMsg({ t: "Image too large (max 8 MB).", k: "err" }); return; }
    setAvatarBusy(true);
    const img = new Image();
    const reader = new FileReader();
    reader.onload = () => {
      img.onload = async () => {
        try {
          // Downscale to max 256x256, JPEG quality 0.85 -> compact data URL
          const max = 256;
          const scale = Math.min(1, max / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas unavailable");
          ctx.drawImage(img, 0, 0, w, h);
          const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
          const r: any = await authClient.updateUser({ image: dataUrl });
          if (r?.error) setAvatarMsg({ t: r.error.message || "Could not save picture.", k: "err" });
          else setAvatarMsg({ t: "Profile picture saved.", k: "ok" });
        } catch (e: any) {
          setAvatarMsg({ t: e?.message || "Could not process image.", k: "err" });
        } finally { setAvatarBusy(false); }
      };
      img.src = String(reader.result);
    };
    reader.onerror = () => { setAvatarMsg({ t: "Could not read file.", k: "err" }); setAvatarBusy(false); };
    reader.readAsDataURL(file);
  };

  const saveName = async () => {
    setAvatarBusy(true); setAvatarMsg(null);
    try {
      const r: any = await authClient.updateUser({ name: displayName.trim() });
      if (r?.error) setAvatarMsg({ t: r.error.message || "Could not save name.", k: "err" });
      else setAvatarMsg({ t: "Display name saved.", k: "ok" });
    } catch (e: any) { setAvatarMsg({ t: e?.message || "Error", k: "err" }); }
    finally { setAvatarBusy(false); }
  };

  return (
    <>
      <section className="rounded-xl p-6 mb-6 border" style={s.card}>
        <h2 className="text-xl font-bold mb-2" style={{ color: ink }}>Account</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          {user?.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" width={64} height={64} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", border: `1px solid ${accent}55` }} />
          ) : (
            <span style={{ width: 64, height: 64, borderRadius: "50%", display: "inline-flex", alignItems: "center", justifyContent: "center", background: "rgba(127,127,127,.18)", border: `1px solid ${accent}55`, fontSize: 22, fontWeight: 800, color: body }}>
              {(user?.name || "?").split(/\s+/).slice(0, 2).map((w: string) => w.charAt(0).toUpperCase()).join("")}
            </span>
          )}
          <div>
            <div style={{ fontWeight: 700, color: ink }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: body }}>{user?.email}</div>
            <label style={{ display: "inline-block", marginTop: 6, fontSize: 12.5, cursor: "pointer", color: accent }}>
              {avatarBusy ? "Saving…" : "Change picture…"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => pickAvatar(e.target.files?.[0] || null)} />
            </label>
            {user?.image && (
              <button onClick={async () => { setAvatarBusy(true); try { await authClient.updateUser({ image: null }); setAvatarMsg({ t: "Picture removed.", k: "ok" }); } finally { setAvatarBusy(false); } }} style={{ display: "block", marginTop: 4, fontSize: 12, background: "none", border: "none", color: "#ff6b6b", cursor: "pointer", padding: 0 }}>
                Remove picture
              </button>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" style={{ ...s.input, maxWidth: 260 }} />
          <button onClick={saveName} disabled={avatarBusy} className="px-4 py-2 rounded-lg font-semibold" style={{ border: `1px solid ${accent}`, color: accent, background: "transparent", cursor: "pointer" }}>{avatarBusy ? "…" : "Save name"}</button>
        </div>
        <p className="text-sm" style={{ color: body, marginTop: 8, opacity: 0.7 }}>ID: {user?.id}</p>
        {avatarMsg && <p className="text-sm mt-2" style={{ color: avatarMsg.k === "ok" ? "#22c55e" : "#ef4444" }}>{avatarMsg.t}</p>}
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