// convex/notifications/providers/emailProvider.ts
"use node";

import nodemailer from "nodemailer";
import { type ChannelProvider, type NotificationPayload, type RecipientInfo } from "../types";
import { buildEmailTemplate } from "../templates";


export class EmailNotificationProvider implements ChannelProvider {
  channel = "email" as const;

  async send(
    recipient: RecipientInfo,
    payload: NotificationPayload
  ): Promise<boolean> {
    if (!recipient.email) {
      console.warn("[EmailProvider] Skipping send: No recipient email provided.");
      return false;
    }

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const { subject, html, text } = buildEmailTemplate(recipient, payload);

    // Graceful Fallback if credentials aren't configured yet
    if (!smtpUser || !smtpPass) {
      console.log(
        `[EmailProvider - DRY RUN] Credentials (SMTP_USER / SMTP_PASS) not set in Convex env.\n` +
          `  To: ${recipient.email}\n` +
          `  Subject: ${subject}\n` +
          `  Text: ${text}`
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: `"HabitPulse 🔥" <${smtpUser}>`,
      to: recipient.email,
      subject,
      text,
      html,
    });

    console.log(`[EmailProvider] Successfully sent "${payload.eventType}" email to ${recipient.email}`);
    return true;
  }
}