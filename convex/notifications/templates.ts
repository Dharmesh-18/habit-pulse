// convex/notifications/templates.ts
import { NotificationPayload, RecipientInfo } from "./types";

interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function wrapInBrandedLayout(title: string, bodyContentHtml: string): string {
  const year = new Date().getFullYear();

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#eef2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#eef2f7;padding:36px 16px;">
    <tr>
      <td align="center">
        <!-- Main Elevated Card -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:540px;background-color:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 12px 32px rgba(15,23,42,0.08);border:1px solid #e2e8f0;">
          
          <!-- Branded Top Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 32px;text-align:left;">
              <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td style="background-color:rgba(255,255,255,0.18);width:42px;height:42px;border-radius:12px;text-align:center;vertical-align:middle;font-size:22px;">
                    🔥
                  </td>
                  <td style="padding-left:14px;">
                    <div style="font-size:20px;font-weight:800;color:#ffffff;letter-spacing:-0.4px;line-height:1.2;">
                      HabitPulse
                    </div>
                    <div style="font-size:11px;font-weight:500;color:rgba(255,255,255,0.82);letter-spacing:0.6px;text-transform:uppercase;margin-top:2px;">
                      Consistency &bull; Discipline &bull; Flow
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Dynamic Body Content -->
          <tr>
            <td style="padding:32px;">
              ${bodyContentHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 32px;border-top:1px solid #edf2f7;text-align:center;">
              <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                You are receiving this automated update from <strong>HabitPulse</strong>.
              </p>
              <p style="margin:6px 0 0 0;font-size:11px;color:#94a3b8;">
                &copy; ${year} HabitPulse &bull; Built for daily excellence.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export function buildEmailTemplate(
  recipient: RecipientInfo,
  payload: NotificationPayload
): RenderedEmail {
  const userName = recipient.name || "Champion";

  if (payload.eventType === "HABIT_CREATED") {
    const subject = `🔥 New Habit Locked In: "${payload.habitTitle}"`;

    const reminderBadge = payload.reminderTime
      ? `<span style="display:inline-block;background-color:#eef2ff;color:#4f46e5;font-weight:600;font-size:12px;padding:6px 12px;border-radius:8px;border:1px solid #e0e7ff;">⏰ Daily Reminder: ${payload.reminderTime}</span>`
      : `<span style="display:inline-block;background-color:#f1f5f9;color:#64748b;font-weight:500;font-size:12px;padding:6px 12px;border-radius:8px;">No daily reminder set</span>`;

    const bodyHtml = `
      <h1 style="margin:0 0 10px 0;font-size:21px;font-weight:700;color:#0f172a;">
        Great move, ${userName}! 🎯
      </h1>
      <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.6;">
        You have committed to a new daily ritual. Small, consistent actions compound into massive long-term results.
      </p>

      <!-- Habit Summary Card -->
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;padding:20px;margin-bottom:24px;">
        <tr>
          <td>
            <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#6366f1;margin-bottom:6px;">
              ${payload.category}
            </div>
            <div style="font-size:18px;font-weight:700;color:#0f172a;margin-bottom:14px;">
              ${payload.habitTitle}
            </div>
            <div>
              ${reminderBadge}
            </div>
          </td>
        </tr>
      </table>

      <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
        💡 <strong>Pro Tip:</strong> Open your HabitPulse matrix today and check off Day 1 right away to ignite your streak!
      </p>
    `;

    return {
      subject,
      html: wrapInBrandedLayout(subject, bodyHtml),
      text: `Hi ${userName}, your new habit "${payload.habitTitle}" (${payload.category}) has been created in HabitPulse!`,
    };
  }

  // DAILY_REMINDER template
  const subject = `⏰ Time for "${payload.habitTitle}" — Keep Your Streak Alive!`;

  const bodyHtml = `
    <h1 style="margin:0 0 10px 0;font-size:21px;font-weight:700;color:#0f172a;">
      Time to execute, ${userName} ⚡
    </h1>
    <p style="margin:0 0 24px 0;font-size:14px;color:#475569;line-height:1.6;">
      This is your scheduled nudge for <strong>${payload.reminderTime}</strong>. You still haven&apos;t checked off this habit today—don&apos;t let the chain break!
    </p>

    <!-- Habit Highlight Box -->
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color:#fefce8;border:1px solid #fde047;border-radius:16px;padding:20px;margin-bottom:24px;">
      <tr>
        <td>
          <div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.8px;color:#ca8a04;margin-bottom:6px;">
            Pending Today &bull; ${payload.category}
          </div>
          <div style="font-size:19px;font-weight:800;color:#0f172a;margin-bottom:6px;">
            ${payload.habitTitle}
          </div>
          <div style="font-size:12px;color:#854d0e;">
            Scheduled for ${payload.reminderTime}
          </div>
        </td>
      </tr>
    </table>

    <p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">
      Once completed, head over to your <strong>HabitPulse Matrix</strong> and mark today&apos;s cell green.
    </p>
  `;

  return {
    subject,
    html: wrapInBrandedLayout(subject, bodyHtml),
    text: `Reminder (${payload.reminderTime}): "${payload.habitTitle}" is still pending for today. Complete it now to keep your streak alive!`,
  };
}