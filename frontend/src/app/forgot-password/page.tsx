"use client";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import { authClient } from "@/lib/auth-client";
import { palette, authStyles } from "@/lib/authPalette";

export default function ForgotPasswordPage() {
  const { currentTheme } = useTheme();
  const [box, ink, body, accent] = palette(currentTheme && currentTheme.id);
  const s = authStyles(box, ink);
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: string; k: "ok" | "err" } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) { setMsg({ t: "Please enter a valid email address.", k: "err" }); return; }
    setBusy(true); setMsg(null);
    try {
      const r: any = await authClient.requestPasswordReset({ email: email.trim(), redirectTo: "/reset-password" });
      if (r?.error && r.error.status === 429) setMsg({ t: "Too many attempts. Please wait a minute and try again.", k: "err" });
      // Same message whether or not the account exists, so we don't reveal who has an account.
      else setMsg({ t: "If an account exists for that email, we've sent a link to reset your password. Check your inbox (and spam folder). The link expires in 1 hour.", k: "ok" });
    } catch {
      setMsg({ t: "Something went wrong. Please try again.", k: "err" });
    } finally { setBusy(false); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <Link href="/profile#signin" className="text-sm mb-6 inline-block" style={{ color: accent }}>&larr; Back to sign in</Link>
      <h1 className="text-4xl font-black mb-2" style={{ color: ink }}>Forgot Password</h1>
      <p className="mb-8" style={{ color: body }}>Enter the email you use for Anteroom and we&apos;ll send you a link to choose a new password.</p>
      <form onSubmit={submit} className="rounded-xl p-6 mb-6 border" style={s.card}>
        <input type="email" autoComplete="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg p-3 mb-3" style={s.input} />
        <button type="submit" disabled={busy} className="px-5 py-2 rounded-lg font-semibold text-white" style={{ background: accent }}>{busy ? "…" : "Send reset link"}</button>
        {msg && <p className="mt-3 text-sm" style={{ color: msg.k === "ok" ? "#22c55e" : "#ef4444" }}>{msg.t}</p>}
      </form>
    </div>
  );
}
