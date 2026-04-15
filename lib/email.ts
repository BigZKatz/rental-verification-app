import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "VerifyRent <noreply@verifyrent.com>";

/**
 * Notify staff that a landlord has submitted their verification form.
 * Recipient is controlled by NOTIFY_EMAIL env var.
 */
export async function sendStaffNotificationEmail({
  applicantFirstName,
  applicantLastName,
  addressLine1,
  city,
  state,
  responderName,
  applicantUrl,
}: {
  applicantFirstName: string;
  applicantLastName: string;
  addressLine1: string;
  city: string;
  state: string;
  responderName: string;
  applicantUrl: string;
}): Promise<void> {
  const notifyEmail = process.env.NOTIFY_EMAIL;
  if (!process.env.RESEND_API_KEY || !notifyEmail) return;

  try {
    await resend.emails.send({
      from: FROM,
      to: notifyEmail,
      subject: `Landlord verification returned — ${applicantFirstName} ${applicantLastName}`,
      html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">
        <tr>
          <td style="background:#0f172a;padding:20px 28px;">
            <span style="color:#f1f5f9;font-size:15px;font-weight:600;">VerifyRent</span>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Verification returned</p>
            <h1 style="margin:0 0 14px;font-size:18px;font-weight:700;color:#0f172a;">
              ${applicantFirstName} ${applicantLastName}
            </h1>
            <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#475569;">
              <strong>${responderName}</strong> has completed a landlord verification for
              <strong>${addressLine1}, ${city}, ${state}</strong>.
              Review the response in VerifyRent.
            </p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:#2563eb;border-radius:10px;">
                  <a href="${applicantUrl}"
                     style="display:inline-block;padding:12px 24px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                    View applicant &rarr;
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 28px;border-top:1px solid #f1f5f9;">
            <p style="margin:0;font-size:12px;color:#94a3b8;">
              You received this because you are set as the notification contact for VerifyRent.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    // Notification failure is non-fatal — do not block the landlord's submission
    console.error("[email] sendStaffNotificationEmail failed:", err);
  }
}

export async function sendLandlordVerificationEmail({
  to,
  addressLine1,
  city,
  state,
  applicantFirstName,
  verificationUrl,
}: {
  to: string;
  addressLine1: string;
  city: string;
  state: string;
  applicantFirstName: string;
  verificationUrl: string;
}): Promise<boolean> {
  if (!process.env.RESEND_API_KEY) return false;

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `Rental verification request — ${addressLine1}, ${city}, ${state}`,
      html: buildHtml({ addressLine1, city, state, applicantFirstName, verificationUrl }),
    });
    return true;
  } catch (err) {
    console.error("[email] sendLandlordVerificationEmail failed:", err);
    return false;
  }
}

function buildHtml({
  addressLine1,
  city,
  state,
  applicantFirstName,
  verificationUrl,
}: {
  addressLine1: string;
  city: string;
  state: string;
  applicantFirstName: string;
  verificationUrl: string;
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rental Verification Request</title>
</head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e2e8f0;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:24px 32px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#3b82f6;border-radius:8px;width:28px;height:28px;text-align:center;vertical-align:middle;padding:0 6px;">
                    <span style="color:#fff;font-size:14px;font-weight:700;">V</span>
                  </td>
                  <td style="padding-left:10px;color:#f1f5f9;font-size:15px;font-weight:600;">VerifyRent</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#94a3b8;">Rental Verification</p>
              <h1 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#0f172a;">${addressLine1}, ${city}, ${state}</h1>
              <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#475569;">
                You have been asked to verify a tenancy for <strong>${applicantFirstName}</strong>
                at the property above. This takes about 2 minutes to complete.
              </p>

              <!-- CTA Button -->
              <table cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
                <tr>
                  <td style="background:#2563eb;border-radius:10px;">
                    <a href="${verificationUrl}"
                       style="display:inline-block;padding:14px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">
                      Complete Verification &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 8px;font-size:13px;color:#94a3b8;">Or copy this link into your browser:</p>
              <p style="margin:0;font-size:12px;color:#64748b;word-break:break-all;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:10px 12px;">
                ${verificationUrl}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px;border-top:1px solid #f1f5f9;">
              <p style="margin:0;font-size:12px;color:#94a3b8;line-height:1.5;">
                If you did not expect this email, you can safely ignore it.
                Your response is confidential and used only for tenant verification.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
