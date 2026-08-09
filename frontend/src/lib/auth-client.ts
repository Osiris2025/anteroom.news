"use client";
import { createAuthClient } from "better-auth/react";
import { passkeyClient } from "@better-auth/passkey/client";

// Auto-detect base URL from the browser so it works on any origin
// (Tailscale IP, localhost, and the future HTTPS domain).
const baseURL =
  process.env.NEXT_PUBLIC_AUTH_URL ||
  (typeof window !== "undefined" ? window.location.origin : "http://localhost:3001");

export const authClient = createAuthClient({
  baseURL,
  plugins: [passkeyClient()],
});

export const { useSession, signIn, signUp, signOut } = authClient;