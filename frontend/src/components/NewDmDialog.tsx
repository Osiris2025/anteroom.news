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
} from "@/lib/dm-crypto";
import { saveKeyPair, loadKeyPair } from "@/lib/dm-key-store";

interface UserResult {
  id: string;
  name: string;
  email: string;
  image: string | null;
}

interface NewDmDialogProps {
  onClose: () => void;
  onConversationCreated: (conversationId: string) => void;
}

export default function NewDmDialog({ onClose, onConversationCreated }: NewDmDialogProps) {
  const { data: session } = useSession();
  const uid = session?.user?.id;
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"search" | "confirm" | "sending">("search");
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (query.length < 2) {
      setResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/dm/search-users?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data.users || []);
        }
      } catch {
        // silently fail
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  const handleStartConversation = useCallback(async () => {
    if (!selectedUser || !uid || starting) return;

    setStarting(true);
    setError(null);
    setStep("sending");

    try {
      // 1. Load or generate key pair
      let stored = await loadKeyPair();
      if (!stored) {
        const kp = await generateKeyPair();
        const publicKeyPem = await exportPublicKeyPem(kp);
        const privateKeyPem = await exportPrivateKeyPem(kp);
        stored = { privateKeyPem, publicKeyPem };
        await saveKeyPair(stored);

        // Register key with server
        const regRes = await fetch("/api/dm/register-key", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicKeyPem, signature: "" }),
        });
        if (!regRes.ok) {
          throw new Error("Failed to register encryption key");
        }
      }

      // 2. Fetch recipient's public key
      const pkRes = await fetch(`/api/dm/public-key/${selectedUser.id}`);
      if (!pkRes.ok) {
        throw new Error("Recipient has not registered a public key yet");
      }
      const pkData = await pkRes.json();
      const peerPublicKeyPem: string = pkData.publicKeyPem;

      // 3. Generate ephemeral key for the first message (forward secrecy)
      const ephemeralKp = await generateKeyPair();
      const ephemeralPubkey = await exportPublicKeyPem(ephemeralKp);

      // 4. Derive shared secret using EPHEMERAL private key + their long-term public key
      const sharedSecret = await deriveSharedSecret(ephemeralKp.privateKey, peerPublicKeyPem);

      // 5. For the conversation ID, we'll use a placeholder — the server will create it
      // We need to derive the AES key. We'll use the recipient's ID as the salt
      // and a placeholder conversation ID. The actual conversation ID comes from the server.
      const tempConvSalt = [uid, selectedUser.id].sort().join(":");
      const aesKey = await deriveAesKey(sharedSecret, tempConvSalt, "nexus-dm-message-v1");

      // 6. Encrypt the first message
      const firstMessage = "Hello! 👋";
      const { ciphertext, iv } = await encryptMessage(aesKey, firstMessage);

      // 7. Encrypt display names (placeholder — just encode the name)
      const sessionName = session?.user?.name || uid;
      const recipientName = selectedUser.name;

      const displayKey = await deriveAesKey(sharedSecret, "nexus-dm-display-v1", "display-name");
      const myEncrypted = await encryptMessage(displayKey, sessionName);
      const theirEncrypted = await encryptMessage(displayKey, recipientName);

      // 8. Create conversation on server
      const convRes = await fetch("/api/dm/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipientId: selectedUser.id,
          firstCiphertext: ciphertext,
          firstIv: iv,
          firstEphemeralPubkey: ephemeralPubkey,
          participantADisplayEnc: myEncrypted.ciphertext,
          participantBDisplayEnc: theirEncrypted.ciphertext,
          aNonce: myEncrypted.iv,
          bNonce: theirEncrypted.iv,
        }),
      });

      if (!convRes.ok) {
        const data = await convRes.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create conversation");
      }

      const convData = await convRes.json();
      onConversationCreated(convData.conversation.id);
    } catch (e: any) {
      setError(e.message || "Failed to start conversation");
      setStep("confirm");
    } finally {
      setStarting(false);
    }
  }, [selectedUser, uid, session, onConversationCreated, starting]);

  const getInitial = (name: string) => name?.charAt(0)?.toUpperCase() || "?";

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-lg font-semibold text-white">
            {step === "sending" ? "Starting conversation..." : "New Message"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {step === "sending" ? (
          <div className="p-8 flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500" />
            <p className="text-gray-400 text-sm">Setting up end-to-end encrypted conversation...</p>
          </div>
        ) : (
          <>
            {/* Search */}
            {!selectedUser && (
              <div className="p-4">
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search users by name or email..."
                  className="w-full bg-gray-800 text-white rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-500 text-sm"
                />
                {searching && (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full" />
                  </div>
                )}
                {!searching && results.length > 0 && (
                  <div className="mt-2 space-y-1 max-h-60 overflow-y-auto">
                    {results.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors text-left"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {getInitial(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-white font-medium truncate">{user.name}</p>
                          <p className="text-gray-400 text-sm truncate">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {!searching && query.length >= 2 && results.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">No users found</p>
                )}
                {!searching && query.length < 2 && (
                  <p className="text-gray-500 text-sm text-center py-4">Type at least 2 characters to search</p>
                )}
              </div>
            )}

            {/* Confirm */}
            {selectedUser && (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-gray-800">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {getInitial(selectedUser.name)}
                  </div>
                  <div>
                    <p className="text-white font-medium">{selectedUser.name}</p>
                    <p className="text-gray-400 text-sm">{selectedUser.email}</p>
                  </div>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="ml-auto text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {error && (
                  <p className="text-red-400 text-sm mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleStartConversation}
                    disabled={starting}
                    className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg text-white text-sm font-medium transition-colors"
                  >
                    {starting ? "Starting..." : "Start Conversation"}
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}