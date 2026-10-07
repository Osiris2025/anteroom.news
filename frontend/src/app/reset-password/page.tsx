"use client";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import { authClient } from "@/lib/auth-client";
import { palette, authStyles } from "@/lib/authPalette";

function ResetPasswordForm() {
  const { currentTheme } = useTheme();
  const [box, ink, body, accent] = palette(currentTheme && currentTheme.id);
  const s = authStyles(box, ink);
  const params = useSearchParams();
  const token = params.get("token") || "";
  const linkError = params.get("error");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const badLink = !token || !!linkError;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    if (pw.length < 8) { setMsg("Password must be at least 8 characters."); return; }
    if (pw !== confirm) { setMsg("Passwords don't match."); return; }
    setBusy(true);
    try {
      const r: any = await authClient.resetPassword({ newPassword: pw, token });
      if (r?.error) {
        const m = (r.error.message || "").toLowerCase();
        setMsg(m.includes("token") ? "This reset link is invalid or has expired. Please request a new one." : r.error.message || "Could not reset password.");
      } else { setDone(true); setPw(""); setConfirm(""); }
    } catch { setMsg("Something went wrong. Please try again."); }
    finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/profile#signin" className="text-sm mb-6 inline-block" style={{ color: accent }}>&larr; Back to sign in</Link>
      <h1 className="text-4xl font-black mb-2" style={{ color: ink }}>Reset Password</h1>
      <section className="rounded-xl p-6 mb-6 border" style={s.card}>
        {done ? (
          <>
            <p className="mb-4" style={{ color: "#22c55e" }}>Your password has been changed ✓ You&apos;ve been signed out of other devices.</p>
            <Link href="/profile#signin" className="px-5 py-2 rounded-lg font-semibold text-white inline-block" style={{ background: accent }}>Sign in</Link>
          </>
        ) : badLink ? (
          <>
            <p className="mb-4" style={{ color: body }}>This reset link is invalid or has expired. Links work once and last 1 hour.</p>
            <Link href="/forgot-password" className="px-5 py-2 rounded-lg font-semibold text-white inline-block" style={{ background: accent }}>Request a new link</Link>
          </>
        ) : (
          <form onSubmit={submit}>
            <p className="mb-4 text-sm" style={{ color: body }}>Choose a new password (at least 8 characters).</p>
            <input type="password" autoComplete="new-password" placeholder="new password" value={pw} onChange={(e) => setPw(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
            <input type="password" autoComplete="new-password" placeholder="confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
            <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg font-semibold text-white" style={{ background: accent }}>{busy ? "…" : "Set new password"}</button>
            {msg && <p className="mt-3 text-sm" style={{ color: "#ef4444" }}>{msg}</p>}
          </form>
        )}
      </section>
    </div>
  );
}

export default function ResetPasswordPage() {
  return <Suspense fallback={null}><ResetPasswordForm /></Suspense>;
}
