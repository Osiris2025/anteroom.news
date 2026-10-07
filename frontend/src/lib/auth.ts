import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { customSession } from "better-auth/plugins";
import { passkey } from "@better-auth/passkey";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
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
    // "Forgot password": email a one-time link to /reset-password?token=...
    resetPasswordTokenExpiresIn: 60 * 60, // 1 hour
    revokeSessionsOnPasswordReset: true,
    sendResetPassword: async ({ user, url }) => {
      const name = (user.name || "").replace(/[<>&"]/g, "");
      const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#1a1a1a">
  <h2 style="margin:0 0 12px">Reset your Anteroom password</h2>
  <p>Hi${name ? " " + name : ""}, someone (hopefully you) asked to reset the password for your Anteroom account.</p>
  <p style="margin:24px 0"><a href="${url}" style="background:#0072f5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">Choose a new password</a></p>
  <p style="font-size:13px;color:#666">This link works once and expires in 1 hour. If you didn't ask for this, you can ignore this email and your password won't change.</p>
</div>`;
      const text = `Reset your Anteroom password:\n${url}\n\nThis link works once and expires in 1 hour. If you didn't ask for this, ignore this email.`;
      // Don't await: keeps response timing the same whether or not the email exists.
      void sendEmail({ to: user.email, subject: "Reset your Anteroom password", html, text }).then((r) => {
        if (!r.sent) console.error("[auth] password reset email not sent:", r.reason);
      });
    },
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