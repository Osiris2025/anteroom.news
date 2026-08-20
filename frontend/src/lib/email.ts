/**
 * Email sending module for AI News Nexus digests.
 * Uses nodemailer with SMTP config from environment variables.
 * Falls back gracefully (logs/reports) if SMTP is not configured.
 */

import nodemailer from "nodemailer";

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

const smtpHost = process.env.SMTP_HOST || "";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "";
const smtpPass = process.env.SMTP_PASS || "";
const smtpFrom = process.env.SMTP_FROM || "digests@nexus.osiris2025.com";

const isConfigured = !!(smtpHost && smtpUser && smtpPass);

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (!isConfigured) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });
  }
  return transporter;
}

/**
 * Send an email. Returns { sent: true } on success or
 * { sent: false, reason: string } if SMTP is not configured or send fails.
 */
export async function sendEmail(
  opts: SendEmailOptions
): Promise<{ sent: boolean; reason?: string }> {
  const t = getTransporter();
  if (!t) {
    return { sent: false, reason: "SMTP not configured (set SMTP_HOST/SMTP_USER/SMTP_PASS)" };
  }

  try {
    const info = await t.sendMail({
      from: smtpFrom,
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
    });
    return { sent: true };
  } catch (err: any) {
    return { sent: false, reason: err?.message || "Unknown SMTP error" };
  }
}

export type { SendEmailOptions };
