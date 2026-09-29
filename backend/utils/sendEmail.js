const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, html, text }) => {
  const { EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, EMAIL_FROM } =
    process.env;

  console.log("========== EMAIL DEBUG ==========");
  console.log("HOST:", EMAIL_HOST);
  console.log("PORT:", EMAIL_PORT);
  console.log("USER:", EMAIL_USER);
  console.log("PASS:", EMAIL_PASS ? "EXISTS" : "MISSING");
  console.log("TO:", to);

  if (!EMAIL_HOST || !EMAIL_USER || !EMAIL_PASS) {
    console.log("SMTP credentials are missing");
    return { delivered: false, dev: true };
  }

  const transporter = nodemailer.createTransport({
    host: EMAIL_HOST,
    port: Number(EMAIL_PORT) || 587,
    secure: Number(EMAIL_PORT) === 465,
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });

  console.log("1. Transporter created");
  console.log("2. Trying to send email...");

  try {
    const info = await transporter.sendMail({
      from: EMAIL_FROM || EMAIL_USER,
      to,
      subject,
      html,
      text,
    });

    console.log("3. EMAIL SENT");
    console.log("Message ID:", info.messageId);

    return { delivered: true, dev: false };
  } catch (error) {
    console.log("========== EMAIL ERROR ==========");
    console.error(error);
    throw error;
  }
};

module.exports = sendEmail;