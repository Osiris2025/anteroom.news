"use client";
import { useState, useEffect } from "react";

type ThreadPost = {
  postNumber: number;
  totalPosts: number;
  content: string;
  label: string;
  charCount: number;
};

type ThreadData = {
  articleTitle: string;
  magazineName: string;
  agentName: string;
  articleUrl: string;
  thread: ThreadPost[];
  xIntentUrl: string;
  perPostXUrls: { postNumber: number; url: string }[];
  totalPosts: number;
};

type C = { box: string; border: string; ink: string; body: string; accent: string; img: string };

export default function ThreadModal({
  articleId,
  palette: C,
  onClose,
}: {
  articleId: string;
  palette: C;
  onClose: () => void;
}) {
  const [data, setData] = useState<ThreadData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    fetch(`/api/thread?articleId=${articleId}`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to load thread");
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [articleId]);

  const copyPost = (text: string, index: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  const copyAll = () => {
    if (!data) return;
    const all = data.thread.map((p) => `${p.label} ${p.content}`).join("\n\n");
    navigator.clipboard.writeText(all).then(() => {
      setCopiedIndex(-1);
      setTimeout(() => setCopiedIndex(null), 2000);
    });
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 9999,
        background: "rgba(0,0,0,0.6)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: C.box,
          border: `1px solid ${C.border}`,
          borderRadius: 16,
          maxWidth: 600,
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
          padding: 24,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: C.ink }}>
              Share as Thread
            </h2>
            <div style={{ fontSize: 12, color: C.body, marginTop: 4 }}>
              {data ? `${data.totalPosts} post${data.totalPosts !== 1 ? "s" : ""}` : "Loading..."}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent", border: "none", cursor: "pointer",
              color: C.body, fontSize: 20, lineHeight: 1, padding: "0 4px",
            }}
          >
            &times;
          </button>
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: C.body, fontSize: 14 }}>
            Generating thread...
          </div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: 20, color: "#ef4444", fontSize: 14 }}>
            {error}
          </div>
        )}

        {data && (
          <>
            {/* Agent attribution */}
            <div style={{ fontSize: 12, color: C.body, marginBottom: 16, fontStyle: "italic" }}>
              Commentary by {data.agentName} &middot; {data.magazineName}
            </div>

            {/* Thread posts */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {data.thread.map((post, i) => (
                <div
                  key={i}
                  style={{
                    background: C.img,
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                    padding: "12px 14px",
                    position: "relative",
                  }}
                >
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.accent, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                    {post.label}
                  </div>
                  <div style={{ fontSize: 14, lineHeight: 1.5, color: C.ink, whiteSpace: "pre-wrap" }}>
                    {post.content}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: C.body, opacity: 0.6 }}>
                      {post.charCount} chars
                    </span>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        onClick={() => copyPost(`${post.label} ${post.content}`, i)}
                        style={{
                          background: "transparent", border: `1px solid ${C.border}`,
                          color: C.body, fontSize: 11, padding: "4px 10px",
                          borderRadius: 6, cursor: "pointer", fontFamily: "inherit",
                        }}
                      >
                        {copiedIndex === i ? "Copied!" : "Copy"}
                      </button>
                      <a
                        href={data.perPostXUrls[i]?.url || "#"}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          background: C.accent, color: "#000", fontSize: 11,
                          fontWeight: 700, padding: "4px 10px", borderRadius: 6,
                          textDecoration: "none", display: "inline-block",
                        }}
                      >
                        Post to X
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Action bar */}
            <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
              <button
                onClick={copyAll}
                style={{
                  background: "transparent", border: `1px solid ${C.border}`,
                  color: C.body, padding: "10px 18px", borderRadius: 10,
                  fontSize: 13, cursor: "pointer", fontFamily: "inherit",
                  fontWeight: 600, flex: 1, minWidth: 140,
                }}
              >
                {copiedIndex === -1 ? "Copied all!" : "Copy all posts"}
              </button>
              <a
                href={data.xIntentUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  background: C.accent, color: "#000", padding: "10px 18px",
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  textDecoration: "none", display: "inline-flex",
                  alignItems: "center", justifyContent: "center",
                  gap: 6, flex: 1, minWidth: 140,
                }}
              >
                Share on X &nearr;
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}