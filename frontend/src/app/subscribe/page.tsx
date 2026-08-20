'use client';

import { useState } from "react";
import Link from "next/link";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("loading");
    setMessage("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), frequency: "daily" }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        setMessage("You're subscribed! We'll send the best stories to your inbox.");
      } else {
        setStatus("error");
        setMessage(data.error || "Something went wrong. Try again.");
      }
    } catch {
      setStatus("error");
      setMessage("Network error. Please try again.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <Link href="/" className="text-sm mb-6 inline-block" style={{ color: "var(--text-secondary)" }}>&larr; Home</Link>
      <h1 className="text-4xl font-black mb-6">Subscribe</h1>
      <div className="rounded-xl p-8" style={{ background: "var(--bg-secondary)" }}>
        {status === "success" ? (
          <div>
            <p className="text-lg font-semibold mb-1">You're in! 🎉</p>
            <p className="text-green-500">{message}</p>
          </div>
        ) : (
          <>
            <p className="text-lg font-semibold mb-1">Never miss a story</p>
            <p className="mb-5" style={{ color: "var(--text-secondary)" }}>
              Get the best of all 14 magazines delivered to your inbox.
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-lg p-3"
                style={{ background: "var(--bg-primary)", border: "1px solid var(--bg-secondary)", color: "var(--text-primary)" }}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full px-6 py-3 rounded-lg font-semibold disabled:opacity-50"
                style={{ background: "var(--accent)", color: "#fff" }}
              >
                {status === "loading" ? "Subscribing..." : "Subscribe"}
              </button>
            </form>
            {status === "error" && (
              <p className="mt-3 text-red-400 text-sm">{message}</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
