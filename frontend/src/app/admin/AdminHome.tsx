"use client";
import { useState } from "react";
import { useTheme } from "@/lib/ThemeContext";
import AdminQueue from "./AdminQueue";
import AdminUsers from "./AdminUsers";
import AdminMagazines from "./AdminMagazines";
import AdminPins from "./AdminPins";
import AdminStalePinAlert from "./AdminStalePinAlert";
import AdminBatchCommentary from "./AdminBatchCommentary";
import AdminLinkDrop from "./AdminLinkDrop";
import AdminSources from "./AdminSources";
import AdminStats from "./AdminStats";
import AdminSocial from "./AdminSocial";
import AdminTraffic from "./AdminTraffic";

type TabId = "inbox" | "linkdrop" | "users" | "magazines" | "pins" | "sources" | "stats" | "social" | "traffic";

export default function AdminHome() {
  const { currentTheme } = useTheme();
  const [tab, setTab] = useState<TabId>("inbox");

  const tabs: { id: TabId; label: string }[] = [
    { id: "inbox", label: "🗞️ Inbox" },
    { id: "linkdrop", label: "🔗 Link Drop" },
    { id: "users", label: "👤 Users" },
    { id: "magazines", label: "📰 Magazines" },
    { id: "sources", label: "📡 Sources" },
    { id: "stats", label: "📊 Stats" },
    { id: "traffic", label: "🚦 Traffic" },
    { id: "social", label: "🌐 Social" },
    { id: "pins", label: "📌 Pins" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "var(--page-bg, #0b0e11)", color: "var(--fg, #e6e6e6)" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 20px 80px" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 6, borderBottom: "2px solid var(--accent, #ffd700)", paddingBottom: 12 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--accent, #ffd700)", textTransform: "uppercase" }}>Dispatch Desk</div>
            <h1 style={{ margin: "2px 0 0", fontSize: 28, lineHeight: 1.05, fontWeight: 800 }}>Admin</h1>
          </div>
        </header>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                padding: "8px 18px", borderRadius: 8, border: tab === t.id ? "1px solid var(--accent,#ffd700)" : "1px solid rgba(150,150,150,.25)",
                background: tab === t.id ? "rgba(255,215,0,.12)" : "#13161a", color: tab === t.id ? "var(--accent,#ffd700)" : "#aaa",
                fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, fontSize: 12, cursor: "pointer",
              }}
            >{t.label}</button>
          ))}
        </div>

        {tab === "inbox" ? <AdminQueue /> : tab === "linkdrop" ? <AdminLinkDrop /> : tab === "users" ? <AdminUsers /> : tab === "magazines" ? <AdminMagazines /> : tab === "sources" ? <AdminSources /> : tab === "stats" ? <AdminStats /> : tab === "traffic" ? <AdminTraffic /> : tab === "social" ? <AdminSocial /> : <AdminPins />}
      </div>
    </main>
  );
}