import nodemailer from "nodemailer";

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpSecure = process.env.SMTP_SECURE === "true";

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: smtpPort,
      secure: smtpSecure,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || "20000", 10),
      greetingTimeout: parseInt(process.env.SMTP_GREETING_TIMEOUT_MS || "20000", 10),
      socketTimeout: parseInt(process.env.SMTP_SOCKET_TIMEOUT_MS || "60000", 10),
      ...(process.env.SMTP_FORCE_IPV4 === "true" || process.env.SMTP_FORCE_IPV4 === "1"
        ? { family: 4 as const }
        : {}),
    })
  : null;

if (transporter) {
  console.log("[email-service] SMTP transport ready", {
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpSecure,
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    connectionTimeoutMs: parseInt(process.env.SMTP_CONNECTION_TIMEOUT_MS || "20000", 10),
    forceIpv4: process.env.SMTP_FORCE_IPV4 === "true" || process.env.SMTP_FORCE_IPV4 === "1",
  });
} else {
  console.warn("[email-service] SMTP not configured (set SMTP_HOST, SMTP_USER, SMTP_PASS)");
}

/** Safe diagnostics for nodemailer / Node network errors (no secrets). */
const logSmtpFailure = (context: string, err: unknown, durationMs: number, meta?: Record<string, unknown>) => {
  const e = err as NodeJS.ErrnoException & {
    response?: string;
    responseCode?: number;
    command?: string;
    code?: string;
    syscall?: string;
    address?: string;
    port?: number;
  };
  console.error(`[email-service] ${context} failed`, {
    durationMs,
    ...meta,
    message: e?.message,
    code: e?.code,
    errno: e?.errno,
    syscall: e?.syscall,
    address: e?.address,
    port: e?.port,
    command: e?.command,
    responseCode: e?.responseCode,
    response: e?.response,
  });
};

const renderAuthEmail = ({
  title,
  subtitle,
  body,
  buttonText,
  link,
  note,
}: {
  title: string;
  subtitle: string;
  body: string;
  buttonText: string;
  link: string;
  note: string;
}) => `
  <!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${title}</title>
    </head>
    <body style="margin:0; padding:0; background:#f5f5f5; font-family:Arial, Helvetica, sans-serif; color:#1f2937;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f5f5f5; padding:40px 12px;">
        <tr>
          <td align="center">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:480px; background:#ffffff; border-radius:12px; box-shadow:0 10px 30px rgba(15,23,42,.16); overflow:hidden;">
              <tr>
                <td style="padding:34px 34px 12px; text-align:center;">
                  <div style="font-size:22px; font-weight:700; color:#111827; margin-bottom:6px;">
                    Connect Wheels
                  </div>
                  <div style="font-size:14px; color:#6b7280; line-height:1.6;">
                    ${subtitle}
                  </div>
                </td>
              </tr>
              <tr>
                <td style="padding:18px 34px 34px; text-align:left;">
                  <h1 style="margin:0 0 12px; font-size:22px; line-height:1.3; color:#111827; font-weight:700; text-align:center;">
                    ${title}
                  </h1>
                  <p style="margin:0 0 24px; color:#4b5563; font-size:15px; line-height:1.7; text-align:center;">
                    ${body}
                  </p>
                  <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
                    <tr>
                      <td style="border-radius:6px; background:#1976d2;">
                        <a href="${link}" style="display:inline-block; padding:12px 22px; color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; border-radius:6px;">
                          ${buttonText}
                        </a>
                      </td>
                    </tr>
                  </table>
                  <div style="padding:14px; border-radius:8px; background:#f9fafb; border:1px solid #e5e7eb;">
                    <p style="margin:0 0 8px; color:#6b7280; font-size:13px; line-height:1.5;">
                      Button not working? Copy and paste this link into your browser:
                    </p>
                    <a href="${link}" style="color:#1976d2; font-size:13px; line-height:1.5; word-break:break-all; text-decoration:none;">
                      ${link}
                    </a>
                  </div>
                  <p style="margin:20px 0 0; color:#6b7280; font-size:12px; line-height:1.6; text-align:center;">
                    ${note}
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
  </html>
`;

export const sendVerificationEmail = async (to: string, verifyLink: string) => {
  if (!transporter) {
    console.log("[email-service] SMTP not configured; skipping send. Link:", verifyLink);
    return;
  }
  const started = Date.now();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@connectwheels.com";
  const subject = "Verify your email – Connect Wheels";
  const text = [
    "Welcome to Connect Wheels.",
    "",
    "Verify your email to unlock your garage, feed, cars, and messages.",
    "",
    `Verify your email: ${verifyLink}`,
    "",
    "This link expires in 1 hour.",
    "If you did not create a Connect Wheels account, you can ignore this email.",
  ].join("\n");
  const html = renderAuthEmail({
    title: "Verify your email",
    subtitle: "Create your account and start your journey",
    body: "Confirm your email to start building your garage, sharing cars, and connecting with other enthusiasts. This link expires in 1 hour.",
    buttonText: "Verify my email",
    link: verifyLink,
    note: "If you did not create a Connect Wheels account, you can safely ignore this email.",
  });
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log("[email-service] Verification email sent", {
      durationMs: Date.now() - started,
      to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    logSmtpFailure("sendVerificationEmail", err, Date.now() - started, {
      to,
      host: process.env.SMTP_HOST,
      smtpPort,
    });
    throw err;
  }
};

export const sendPasswordResetEmail = async (to: string, resetLink: string) => {
  if (!transporter) {
    console.log("[email-service] SMTP not configured; skipping password reset send. Link:", resetLink);
    return;
  }
  const started = Date.now();
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@connectwheels.com";
  const subject = "Reset your password - Connect Wheels";
  const text = [
    "Reset your Connect Wheels password.",
    "",
    "We received a request to reset your password.",
    "",
    `Reset password: ${resetLink}`,
    "",
    "This link expires in 15 minutes.",
    "If you did not request this, you can ignore this email.",
  ].join("\n");
  const html = renderAuthEmail({
    title: "Reset your password",
    subtitle: "Secure your account with a new password",
    body: "We received a request to reset your Connect Wheels password. This secure link expires in 15 minutes.",
    buttonText: "Reset password",
    link: resetLink,
    note: "If you did not request a password reset, you can ignore this email and your password will stay unchanged.",
  });
  try {
    const info = await transporter.sendMail({ from, to, subject, text, html });
    console.log("[email-service] Password reset email sent", {
      durationMs: Date.now() - started,
      to,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
    });
  } catch (err) {
    logSmtpFailure("sendPasswordResetEmail", err, Date.now() - started, {
      to,
      host: process.env.SMTP_HOST,
      smtpPort,
    });
    throw err;
  }
};

export default { sendVerificationEmail, sendPasswordResetEmail };
