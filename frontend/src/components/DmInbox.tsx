"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import NewDmDialog from "./NewDmDialog";

interface Conversation {
  id: string;
  peerUserId: string;
  peerUserName: string;
  peerUserEmail: string;
  peerUserImage: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  encryptedDisplayName: string | null;
  nonce: string | null;
}

export default function DmInbox() {
  const { data: session } = useSession();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);

  const fetchConversations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/dm/conversations");
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to load conversations (${res.status})`);
      }
      const data = await res.json();
      setConversations(data.conversations || []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load conversations");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const getInitial = (name: string) => {
    return name?.charAt(0)?.toUpperCase() || "?";
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return d.toLocaleDateString([], { weekday: "short" });
    }
    return d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchConversations}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <button
          onClick={() => setShowNewDialog(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Message
        </button>
      </div>

      {conversations.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-400">
          <svg className="w-16 h-16 mb-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <p className="text-lg font-medium mb-1">No conversations yet</p>
          <p className="text-sm mb-4">Start a private conversation with another user</p>
          <button
            onClick={() => setShowNewDialog(true)}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors"
          >
            Send your first message
          </button>
        </div>
      ) : (
        <div className="space-y-1">
          {conversations.map((conv) => (
            <Link
              key={conv.id}
              href={`/dms/${conv.id}`}
              className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors group"
            >
              {/* Avatar */}
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {getInitial(conv.peerUserName)}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-white font-medium truncate">
                    {conv.peerUserName}
                  </span>
                  <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                    {formatTime(conv.lastMessageAt)}
                  </span>
                </div>
                <p className="text-sm text-gray-400 truncate">
                  {conv.peerUserEmail}
                </p>
              </div>

              {/* Unread indicator placeholder */}
              <div className="flex-shrink-0 w-2 h-2 rounded-full bg-transparent" />
            </Link>
          ))}
        </div>
      )}

      {showNewDialog && (
        <NewDmDialog
          onClose={() => setShowNewDialog(false)}
          onConversationCreated={(convId: string) => {
            setShowNewDialog(false);
            fetchConversations();
            // Navigate to the new conversation
            window.location.href = `/dms/${convId}`;
          }}
        />
      )}
    </div>
  );
}