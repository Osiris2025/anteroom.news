import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/lib/db";
import * as schema from "@/drizzle/schema";

const authUrl = process.env.AUTH_URL || "http://localhost:3001";
// If serving over plain HTTP (Tailscale/local dev), don't emit __Secure- cookies
// (browsers refuse to store them on http:). Over https they become Secure automatically.
const isHttps = authUrl.startsWith("https:");

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET || process.env.AUTH_SECRET || "dev-only-change-me",
  baseURL: authUrl,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
      passkey: schema.passkey,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false, // never settable from client sign-up
      },
      tier: {
        type: "string",
        required: false,
        defaultValue: "free",
        input: false,
      },
      status: {
        type: "string",
        required: false,
        defaultValue: "active",
        input: false,
      },
    },
  },
  session: {
    // Cookie cache disabled: it copies the whole user record (including the
    // profile photo, stored as a ~40 KB data URL) into the browser cookie, which
    // exceeds cookie size limits and made the site render a blank page for
    // anyone with a profile picture. The session is now looked up in the DB.
    cookieCache: { enabled: false },
  },
  advanced: {
    useSecureCookies: isHttps,
  },
  plugins: [
    passkey({
      rpName: "Anteroom",
      rpID: new URL(authUrl).hostname,
      origin: authUrl,
    }),
    customSession(async ({ user, session }) => {
      return {
        user: {
          ...user,
          role: (user as any).role || "user",
        },
        session,
      };
    }),
  ],
  trustedOrigins: [authUrl, "https://nexus.osiris2025.com", "http://localhost:3001", "http://100.65.69.37:3001"],
});

export type Session = typeof auth.$Infer.Session;