"use client";
import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";

type Cmt = {
  id: string;
  body: string;
  parentId: string | null;
  upvotes: number;
  deleted: boolean;
  createdAt: string;
  userName: string | null;
  userEmail: string | null;
  userId: string | null;
};
type CPal = { box: string; border: string; ink: string; body: string; accent: string };

const AV_COLORS = ["#fbbf24", "#60a5fa", "#a78bfa", "#34d399", "#f87171", "#38bdf8", "#c084fc", "#fb923c"];

function initials(name: string) {
  const p = (name || "?").trim().split(/\s+/);
  return ((p[0]?.[0] || "?") + (p[1]?.[0] || "")).toUpperCase();
}
function hashAv(n: string) { let h = 0; for (const c of n) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }
function timeAgo(iso: string) {
  const s = (Date.now() - new Date(iso).getTime()) / 1000;
  if (s < 60) return "now";
  if (s < 3600) return Math.floor(s / 60) + "m";
  if (s < 86400) return Math.floor(s / 3600) + "h";
  return Math.floor(s / 86400) + "d";
}

export default function ArticleComments({ articleId, palette }: { articleId: string; palette: CPal }) {
  const { data: session, isPending } = useSession();
  const [comments, setComments] = useState<Cmt[]>([]);
  const [body, setBody] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const [posting, setPosting] = useState(false);

  const me = session?.user as any;
  const meName = me?.name || me?.email || "you";
  const meId = me?.id || null;

  const load = () => {
    fetch(`/api/articles/${articleId}/comments`).then((r) => r.json())
      .then((j) => { if (Array.isArray(j.comments)) setComments(j.comments); })
      .catch(() => {});
  };
  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [articleId]);

  const submit = async () => {
    const text = body.trim();
    if (!text || !meId) return;
    setPosting(true); setErr("");
    const r = await fetch(`/api/articles/${articleId}/comments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: text, parentId: replyTo || undefined }),
    });
    const j = await r.json();
    setPosting(false);
    if (j.error) { setErr(j.error); return; }
    setBody(""); setReplyTo(null); load();
  };

  const upvote = async (cid: string) => {
    await fetch(`/api/articles/${articleId}/comments/${cid}/upvote`, { method: "POST" }).catch(() => {});
    load();
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const replies = (pid: string) => comments.filter((c) => c.parentId === pid);

  const Row = ({ c, indent }: { c: Cmt; indent: number }) => (
    <div style={{ paddingLeft: indent * 18 }}>
      <div style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: `1px solid ${palette.border}` }}>
        <div style={{ width: 36, height: 36, borderRadius: "50%", background: AV_COLORS[hashAv(c.userName || "?") % AV_COLORS.length], flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000" }}>{initials(c.userName || "?")}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            <b style={{ color: palette.ink, fontSize: 14 }}>{c.deleted ? "deleted" : (c.userName || "Guest")}</b>
            <span style={{ color: palette.body, fontSize: 12 }}>· {timeAgo(c.createdAt)}</span>
          </div>
          <div style={{ color: palette.ink, fontSize: 14, lineHeight: 1.45, marginTop: 2 }}>{c.deleted ? "[removed]" : c.body}</div>
          <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 12 }}>
            <button onClick={() => upvote(c.id)} style={{ cursor: "pointer", background: "none", border: "none", color: palette.body, padding: 0 }}>▲ {c.upvotes > 0 ? c.upvotes : ""}</button>
            {meId && <button onClick={() => setReplyTo(replyTo === c.id ? null : c.id)} style={{ cursor: "pointer", background: "none", border: "none", color: palette.accent, padding: 0, fontWeight: 700 }}>↩ Reply</button>}
          </div>
        </div>
      </div>
      {replies(c.id).map((rc) => <Row key={rc.id} c={rc} indent={indent + 1} />)}
    </div>
  );

  return (
    <div style={{ border: `1px solid ${palette.border}`, borderRadius: 12, padding: 18 }}>
      <h2 style={{ fontSize: 17, fontWeight: 800, color: palette.ink, margin: "0 0 12px" }}>💬 Discussion</h2>

      {/* composer */}
      {meId ? (
        <div style={{ display: "flex", gap: 10, marginBottom: 18 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: AV_COLORS[hashAv(meName) % AV_COLORS.length], flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, color: "#000" }}>{initials(meName)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            {replyTo && (
              <div style={{ fontSize: 12, color: palette.body, marginBottom: 6 }}>
                Replying to {comments.find((x) => x.id === replyTo)?.userName || "comment"}
                <button onClick={() => setReplyTo(null)} style={{ marginLeft: 8, cursor: "pointer", background: "none", border: "none", color: palette.accent, fontSize: 11 }}>cancel</button>
              </div>
            )}
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={2} placeholder="Share your take…" maxLength={2000}
              style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 10, border: `1px solid ${palette.border}`, background: palette.box, color: palette.ink, fontSize: 14, fontFamily: "inherit", resize: "vertical" }} />
            {err && <div style={{ color: "#f87171", fontSize: 12, marginTop: 6 }}>{err}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={submit} disabled={posting || !body.trim()} style={{ background: palette.accent, color: "#000", border: "none", borderRadius: 999, padding: "8px 18px", fontWeight: 800, fontSize: 13, cursor: "pointer", opacity: posting || !body.trim() ? 0.5 : 1 }}>{posting ? "Posting…" : "Reply"}</button>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ background: palette.box, border: `1px dashed ${palette.border}`, borderRadius: 10, padding: 12, textAlign: "center", fontSize: 13, color: palette.body, marginBottom: 18 }}>
          <Link href="/profile#signin" style={{ color: palette.accent, fontWeight: 700 }}>Sign in</Link> to join the discussion.
        </div>
      )}

      {/* thread */}
      {topLevel.length === 0 ? (
        <div style={{ textAlign: "center", color: palette.body, fontSize: 13, padding: "18px 0" }}>Be the first to comment on this story.</div>
      ) : (
        topLevel.map((c) => <Row key={c.id} c={c} indent={0} />)
      )}

      {isPending && <div style={{ color: palette.body, fontSize: 12 }}>Loading…</div>}
    </div>
  );
}