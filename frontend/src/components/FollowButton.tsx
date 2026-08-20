"use client";

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

type FollowEntry = {
  id: string;
  magazineId: string;
};

export default function FollowButton({ magazineId, magazineName }: { magazineId: string; magazineName: string }) {
  const { data: session } = useSession();
  const uid = (session?.user as any)?.id;
  const [followId, setFollowId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Check if already following on mount / when uid changes
  useEffect(() => {
    if (!uid) { setFollowId(null); return; }
    (async () => {
      try {
        const r = await fetch("/api/follows");
        const j = await r.json();
        const found = (j.follows || []).find((f: FollowEntry) => f.magazineId === magazineId);
        setFollowId(found?.id || null);
      } catch {}
    })();
  }, [uid, magazineId]);

  const toggle = async () => {
    if (!uid) return;
    setLoading(true);
    try {
      if (followId) {
        await fetch(`/api/follows/${followId}`, { method: "DELETE" });
        setFollowId(null);
      } else {
        const r = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ magazineId }),
        });
        const j = await r.json();
        if (j.id) setFollowId(j.id);
      }
    } catch (e) { console.error("Follow toggle failed", e); }
    setLoading(false);
  };

  if (!uid) {
    return (
      <Link href="/profile#signin" style={{
        fontSize: 12, color: "#999", textDecoration: "none",
        border: "1px solid #ddd", borderRadius: 6, padding: "3px 8px",
        display: "inline-flex", alignItems: "center", gap: 4,
      }}>
        ☆ Follow
      </Link>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        fontSize: 12, fontWeight: 600,
        border: followId ? "1px solid #0072f5" : "1px solid #ddd",
        borderRadius: 6, padding: "3px 8px", cursor: loading ? "wait" : "pointer",
        background: followId ? "#e8f4fd" : "transparent",
        color: followId ? "#0072f5" : "#666",
        display: "inline-flex", alignItems: "center", gap: 3,
        whiteSpace: "nowrap", transition: "all 0.15s",
      }}
      title={followId ? `Unfollow ${magazineName}` : `Follow ${magazineName}`}
    >
      {loading ? "..." : followId ? "★ Following" : "☆ Follow"}
    </button>
  );
}
