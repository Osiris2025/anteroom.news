'use client';

import { useState } from "react";
import Link from "next/link";

export default function SubscribePage() {
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<"daily" | "weekly">("daily");
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
        body: JSON.stringify({ email: email.trim(), frequency }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
        const label = frequency === "weekly" ? "weekly roundup" : "daily digest";
        setMessage(`You're subscribed to the ${label}! We'll send the best stories to your inbox.`);
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
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-2 p-1 rounded-lg" style={{ background: "var(--bg-primary)" }}>
                <button
                  type="button"
                  onClick={() => setFrequency("daily")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    frequency === "daily"
                      ? "shadow-sm"
                      : "opacity-60 hover:opacity-90"
                  }`}
                  style={{
                    background: frequency === "daily" ? "var(--accent)" : "transparent",
                    color: frequency === "daily" ? "#fff" : "var(--text-primary)",
                  }}
                >
                  Daily digest
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency("weekly")}
                  className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                    frequency === "weekly"
                      ? "shadow-sm"
                      : "opacity-60 hover:opacity-90"
                  }`}
                  style={{
                    background: frequency === "weekly" ? "var(--accent)" : "transparent",
                    color: frequency === "weekly" ? "#fff" : "var(--text-primary)",
                  }}
                >
                  Weekly highlights
                </button>
              </div>
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