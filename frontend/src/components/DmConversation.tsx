"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import {
  generateKeyPair,
  exportPublicKeyPem,
  exportPrivateKeyPem,
  deriveSharedSecret,
  deriveAesKey,
  encryptMessage,
  decryptMessage,
  importPrivateKeyPem,
} from "@/lib/dm-crypto";
import { saveKeyPair, loadKeyPair } from "@/lib/dm-key-store";

interface Message {
  id: string;
  senderId: string;
  ciphertext: string;
  iv: string;
  ephemeralPubkey: string;
  createdAt: string;
  senderName: string | null;
  senderEmail: string | null;
}

interface ConversationInfo {
  id: string;
  participantA: string;
  participantB: string;
  peerUserId: string;
  peerUserName: string;
  peerUserEmail: string;
  peerPubkey: string;
  encryptedDisplayName: string | null;
  nonce: string | null;
}

export default function DmConversation({ conversationId }: { conversationId: string }) {
  const { data: session } = useSession();
  const uid = session?.user?.id;
  const [messages, setMessages] = useState<Message[]>([]);
  const [decryptedMessages, setDecryptedMessages] = useState<Map<string, string>>(new Map());
  const [decryptErrors, setDecryptErrors] = useState<Set<string>>(new Set());
  const [conv, setConv] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [decrypting, setDecrypting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Fetch conversation info + messages
  const fetchData = useCallback(async () => {
    if (!uid) return;
    try {
      setLoading(true);
      setError(null);

      // Fetch conversation info
      const convRes = await fetch("/api/dm/conversations");
      if (!convRes.ok) throw new Error("Failed to load conversation");
      const convData = await convRes.json();
      const foundConv = (convData.conversations || []).find(
        (c: any) => c.id === conversationId
      );
      if (!foundConv) throw new Error("Conversation not found");
      setConv(foundConv);

      // Fetch messages
      const msgRes = await fetch(`/api/dm/messages/${conversationId}`);
      if (!msgRes.ok) throw new Error("Failed to load messages");
      const msgData = await msgRes.json();
      setMessages(msgData.messages || []);
    } catch (e: any) {
      setError(e.message || "Failed to load conversation");
    } finally {
      setLoading(false);
    }
  }, [conversationId, uid]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Decrypt messages when they arrive
  useEffect(() => {
    if (!conv || !uid || messages.length === 0) return;

    const decryptMessages = async () => {
      setDecrypting(true);

      // Load our key pair
      const stored = await loadKeyPair();
      if (!stored) {
        setDecrypting(false);
        return;
      }

      const privateKey = await importPrivateKeyPem(stored.privateKeyPem);

      for (const msg of messages) {
        if (decryptedMessages.has(msg.id)) continue;

        try {
          // Derive shared secret from our private key + message's ephemeral pubkey
          const sharedSecret = await deriveSharedSecret(privateKey, msg.ephemeralPubkey);

          // Derive AES key
          const aesKey = await deriveAesKey(
            sharedSecret,
            dmSalt,
            "nexus-dm-message-v1"
          );

          // Decrypt
          const plaintext = await decryptMessage(aesKey, msg.ciphertext, msg.iv);

          setDecryptedMessages((prev) => {
            const next = new Map(prev);
            next.set(msg.id, plaintext);
            return next;
          });
        } catch {
          setDecryptErrors((prev) => {
            const next = new Set(prev);
            next.add(msg.id);
            return next;
          });
        }
      }

      setDecrypting(false);
    };

    decryptMessages();
  }, [messages, conv, uid, conversationId, decryptedMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, decryptedMessages, scrollToBottom]);

  // Deterministic HKDF salt = sorted participant IDs joined by ":"
  const dmSalt = conv ? [conv.participantA, conv.participantB].sort().join(":") : conversationId;

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || !uid || !conv || sending) return;

    setSending(true);
    try {
      // Load or generate key pair
      let stored = await loadKeyPair();
      if (!stored) {
        const kp = await generateKeyPair();
        const publicKeyPem = await exportPublicKeyPem(kp);
        const privateKeyPem = await exportPrivateKeyPem(kp);
        stored = { privateKeyPem, publicKeyPem };
        await saveKeyPair(stored);

        // Register key with server
        await fetch("/api/dm/register-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKeyPem, signature: "" }),
        });
      }

      // Generate ephemeral key for this message (forward secrecy)
      const ephemeralKp = await generateKeyPair();
      const ephemeralPubkey = await exportPublicKeyPem(ephemeralKp);

      // Derive shared secret using EPHEMERAL private key + their long-term public key
      const sharedSecret = await deriveSharedSecret(ephemeralKp.privateKey, conv.peerPubkey);

      // Derive AES key
      const aesKey = await deriveAesKey(
        sharedSecret,
        dmSalt,
        "nexus-dm-message-v1"
      );

      // Encrypt
      const { ciphertext, iv } = await encryptMessage(aesKey, text);

      // Send
      const res = await fetch(`/api/dm/messages/${conversationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ciphertext,
          iv,
          ephemeralPubkey,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message");
      }

      setInputText("");
      // Refresh messages
      const msgRes = await fetch(`/api/dm/messages/${conversationId}`);
      if (msgRes.ok) {
        const msgData = await msgRes.json();
        setMessages(msgData.messages || []);
      }
    } catch (e: any) {
      setError(e.message || "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
      </div>
    );
  }

  if (error && !conv) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <p className="text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-w-2xl mx-auto">
      {/* Header */}
      {conv && (
        <div className="flex items-center gap-3 p-4 border-b border-gray-700">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
            {getInitial(conv.peerUserName)}
          </div>
          <div>
            <h2 className="text-white font-medium">{conv.peerUserName}</h2>
            <p className="text-xs text-gray-400">{conv.peerUserEmail}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-12 h-12 mb-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Send a message to start the conversation</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.senderId === uid;
            const plaintext = decryptedMessages.get(msg.id);
            const hasError = decryptErrors.has(msg.id);

            return (
              <div
                key={msg.id}
                className={`flex ${isMine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    isMine
                      ? "bg-indigo-600 text-white rounded-br-md"
                      : "bg-gray-700 text-gray-100 rounded-bl-md"
                  }`}
                >
                  {!isMine && (
                    <p className="text-xs text-gray-400 mb-1 font-medium">
                      {msg.senderName || "Unknown"}
                    </p>
                  )}
                  {hasError ? (
                    <p className="text-red-400 italic text-sm">Failed to decrypt message</p>
                  ) : plaintext !== undefined ? (
                    <p className="whitespace-pre-wrap break-words">{plaintext}</p>
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="animate-pulse h-4 w-24 bg-gray-500 rounded" />
                      <span className="text-xs text-gray-400">decrypting...</span>
                    </div>
                  )}
                  <p className={`text-xs mt-1 ${isMine ? "text-indigo-200" : "text-gray-400"}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {decrypting && messages.length > 0 && (
          <div className="flex justify-center">
            <div className="animate-pulse text-xs text-gray-500">Decrypting messages...</div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 bg-gray-800 text-white rounded-xl px-4 py-3 resize-none outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 text-sm"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim() || sending}
            className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-xl text-white transition-colors flex-shrink-0"
          >
            {sending ? (
              <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-xs mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}