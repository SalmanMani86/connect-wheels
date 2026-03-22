import nodemailer from "nodemailer";

const isSmtpConfigured = () =>
  Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

const transporter = isSmtpConfigured()
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587", 10),
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

export const sendVerificationEmail = async (to: string, verifyLink: string) => {
  if (!transporter) {
    console.log("[email-service] SMTP not configured; skipping send. Link:", verifyLink);
    return;
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER || "noreply@connectwheels.com";
  const subject = "Verify your email – Connect Wheels";
  const html = `
    <p>Thanks for signing up. Please verify your email by clicking the link below.</p>
    <p><a href="${verifyLink}" style="color:#1976d2;">Verify my email</a></p>
    <p>Or copy this link: ${verifyLink}</p>
    <p>This link expires in 1 hour.</p>
  `;
  await transporter.sendMail({ from, to, subject, html });
};

export default { sendVerificationEmail };
