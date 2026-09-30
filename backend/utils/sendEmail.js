const nodemailer = require("nodemailer");

/**
 * Sends an email via SMTP using EMAIL_* env vars.
 *
 * If SMTP isn't configured (no EMAIL_HOST/EMAIL_USER/EMAIL_PASS), this falls
 * back to printing the email to the server console instead of throwing. That
 * keeps "forgot password" fully working in local development without
 * requiring a real mail provider — you just copy the reset link out of the
 * terminal. Configure real SMTP credentials before deploying anywhere real.
 *
 * The transporter is created ONCE and reused (with `pool: true`) rather than
 * opened fresh on every call. Providers like Gmail throttle or reject rapid
 * repeated new SMTP connections from the same sender — opening a brand-new
 * connection per email is a common reason "the first email works but the
 * second doesn't."
 */
let cachedTransporter = null;

const getTransporter = () => {
  if (cachedTransporter) return cachedTransporter;

  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS } = process.env;

  cachedTransporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: { user: EMAIL_USER, pass: EMAIL_PASS },
    pool: true,
    maxConnections: 3,
    maxMessages: 50,
  });

  return cachedTransporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const { EMAIL_HOST, EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log("\n[sendEmail] No SMTP configured — printing email instead of sending:");
    console.log(`  To:      ${to}`);
    console.log(`  Subject: ${subject}`);
    console.log(`  Body:\n${text || html}\n`);
    return { delivered: false, dev: true };
  }

  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || EMAIL_USER,
    to,
    subject,
    html,
    text,
  });

  return { delivered: true, dev: false };
};

module.exports = sendEmail;

