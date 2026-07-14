import nodemailer from 'nodemailer';
import { InvitationEmailPayload } from '../types/invitation.js';

// ── Transporter Singleton ─────────────────────────────────────────────────────
//
// Reads SMTP credentials from environment variables.
// Supports any SMTP provider (Gmail, SendGrid, Mailgun, etc.).
//
// Required env vars:
//   EMAIL_HOST     — SMTP host (e.g. smtp.gmail.com)
//   EMAIL_PORT     — SMTP port (e.g. 587 for STARTTLS, 465 for SSL)
//   EMAIL_USER     — SMTP username / email address
//   EMAIL_PASS     — SMTP password or app-specific password
//   EMAIL_FROM     — "From" display name + address (e.g. PetSitterPro <noreply@petsitterpro.com>)
//   APP_BASE_URL   — Frontend base URL for building invite links (e.g. http://localhost:3000)

/**
 * Creates a nodemailer transporter using SMTP credentials from environment variables.
 * If any required env vars are missing, returns null (development fallback).
 * @returns A nodemailer transporter or null if SMTP is not configured
 */
const createTransporter = () => {
    const host = process.env.EMAIL_HOST;
    const port = parseInt(process.env.EMAIL_PORT ?? '587', 10);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!host || !user || !pass) {
        // In development, fall back to console logging — handled in sendInvitationEmail
        return null;
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465, // true for SSL (465), false for STARTTLS (587)
        auth: { user, pass },
    });
};

const transporter = createTransporter();

// ── HTML Template ─────────────────────────────────────────────────────────────

/**
 * Builds the HTML content for the invitation email.
 * @param payload - The invitation email payload
 * @returns The HTML string for the email
 */
const buildInvitationHtml = ({
    businessName,
    role,
    token,
    expiresAt,
}: Omit<InvitationEmailPayload, 'toEmail'>): string => {
    const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
    const acceptUrl = `${baseUrl}/accept-invitation?token=${token}`;
    const formattedRole = role.charAt(0) + role.slice(1).toLowerCase(); // e.g. Manager
    const formattedExpiry = expiresAt.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>You've been invited to join ${businessName}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:40px 48px;text-align:center;">
              <p style="margin:0 0 8px;color:rgba(255,255,255,0.85);font-size:13px;letter-spacing:2px;text-transform:uppercase;">PetSitterPro</p>
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;line-height:1.2;">
                You're Invited! 🐾
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:48px;">
              <p style="margin:0 0 16px;color:#374151;font-size:16px;line-height:1.6;">
                You've been invited to join <strong>${businessName}</strong> as a <strong>${formattedRole}</strong> on PetSitterPro.
              </p>
              <p style="margin:0 0 32px;color:#6b7280;font-size:15px;line-height:1.6;">
                Click the button below to create your account and get started. This invitation expires on <strong>${formattedExpiry}</strong>.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 32px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:8px;">
                    <a href="${acceptUrl}"
                       style="display:inline-block;padding:16px 40px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;border-radius:8px;letter-spacing:0.5px;">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Divider -->
              <hr style="border:none;border-top:1px solid #e5e7eb;margin:32px 0;" />

              <!-- Fallback link -->
              <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin:0;word-break:break-all;">
                <a href="${acceptUrl}" style="color:#4f46e5;font-size:13px;">${acceptUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:24px 48px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.5;">
                If you didn't expect this invitation, you can safely ignore this email.<br />
                &copy; ${new Date().getFullYear()} PetSitterPro. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Sends an invitation email to a new manager or employee.
 *
 * In production: delivers via the configured SMTP transporter.
 * In development (no EMAIL_* env vars set): logs the token and acceptance
 * link to the console so you can test without a real SMTP server.
 *
 * @param payload - Recipient email, business name, role, token, and expiry
 * @returns A promise that resolves when the email is sent (or logged in dev)
 */
export const sendInvitationEmail = async (payload: InvitationEmailPayload): Promise<void> => {
    const { toEmail, businessName, role, token, expiresAt } = payload;

    // Development fallback — no SMTP configured
    if (!transporter) {
        console.log('\n📧  [DEV] Invitation email (SMTP not configured — token logged below)');
        console.log(`    To:       ${toEmail}`);
        console.log(`    Business: ${businessName}`);
        console.log(`    Role:     ${role}`);
        console.log(`    Token:    ${token}`);
        console.log(`    Expires:  ${expiresAt.toISOString()}`);
        console.log(`    Link:     ${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/accept-invitation?token=${token}\n`);
        return;
    }

    const from = process.env.EMAIL_FROM ?? 'PetSitterPro <noreply@petsitterpro.com>';
    const subject = `You've been invited to join ${businessName} on PetSitterPro`;

    await transporter.sendMail({
        from,
        to: toEmail,
        subject,
        html: buildInvitationHtml({ businessName, role, token, expiresAt }),
        // Plain-text fallback for email clients that don't render HTML
        text: [
            `You've been invited to join ${businessName} as a ${role} on PetSitterPro.`,
            '',
            'Accept your invitation here:',
            `${process.env.APP_BASE_URL ?? 'http://localhost:3000'}/accept-invitation?token=${token}`,
            '',
            `This invitation expires on ${expiresAt.toISOString()}.`,
            '',
            "If you didn't expect this, you can safely ignore this email.",
        ].join('\n'),
    });
};
