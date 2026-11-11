const nodemailer = require('nodemailer');
const env = require('../config/env');
const AppError = require('../utils/AppError');

let testMailSink = null;

const setTestMailSink = (sinkArray) => {
  testMailSink = sinkArray;
};

const escapeHtml = (value = '') =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const createTransporter = () => {
  if (!env.smtpUser || !env.smtpPass) {
    throw new AppError(
      'Email service is not configured. Please set SMTP_USER and SMTP_PASS in server/.env.',
      503
    );
  }

  return nodemailer.createTransport({
    host: env.smtpHost,
    port: env.smtpPort,
    secure: env.smtpPort === 465,
    auth: {
      user: env.smtpUser,
      pass: env.smtpPass,
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  if (Array.isArray(testMailSink)) {
    testMailSink.push({ to, subject, text, html });
    return { mocked: true };
  }

  const transporter = createTransporter();
  return transporter.sendMail({
    from: env.emailFrom || env.smtpUser,
    to,
    subject,
    text,
    html,
  });
};

const sendVerificationOtpEmail = async ({ to, name, otp }) => {
  const safeName = escapeHtml(name);
  const safeOtp = escapeHtml(otp);

  const subject = `Atithi — Your Email Verification OTP (${otp})`;
  const text = [
    `Namaskaram ${name},`,
    '',
    `Welcome to Atithi (అతిథి)! Use the 6-digit verification code below to verify your email address:`,
    '',
    `OTP: ${otp}`,
    '',
    `This code expires in 10 minutes. Do not share it with anyone.`,
    '',
    `— Team Atithi`,
  ].join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF9F7; padding: 32px 16px; color: #1C1917;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; padding: 32px;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; background: #EA580C; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 6px 14px; border-radius: 10px;">
            Atithi · అతిథి
          </span>
        </div>
        <h2 style="margin: 0 0 10px; font-size: 20px; color: #1C1917;">Verify your email address</h2>
        <p style="margin: 0 0 20px; font-size: 14px; line-height: 1.6; color: #57534E;">
          Namaskaram <strong>${safeName}</strong>, thank you for registering with <strong>Atithi</strong>. Enter the 6-digit OTP below to verify your account:
        </p>
        <div style="background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 12px; padding: 18px; text-align: center; margin: 0 0 20px;">
          <span style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #EA580C; font-family: monospace;">
            ${safeOtp}
          </span>
        </div>
        <p style="margin: 0; font-size: 13px; color: #78716C;">
          This OTP is valid for <strong>10 minutes</strong>. If you did not request this verification, you can safely ignore this email.
        </p>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

const sendRegistrationLoginSuccessEmail = async ({ to, name }) => {
  const safeName = escapeHtml(name);
  const appUrl = env.clientUrl.split(',')[0].trim() || 'http://localhost:5173';

  const subject = 'Successfully logged into Atithi (అతిథి)';
  const text = [
    `Namaskaram ${name},`,
    '',
    `Your email is now verified and you have successfully logged into Atithi!`,
    `Discover top restaurants across Hyderabad, share ratings, and explore verified reviews at ${appUrl}.`,
    '',
    `— Team Atithi`,
  ].join('\n');

  const html = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #FAF9F7; padding: 32px 16px; color: #1C1917;">
      <div style="max-width: 520px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E7E5E4; border-radius: 16px; padding: 32px;">
        <div style="margin-bottom: 20px;">
          <span style="display: inline-block; background: #EA580C; color: #FFFFFF; font-weight: 700; font-size: 15px; padding: 6px 14px; border-radius: 10px;">
            Atithi · అతిథి
          </span>
        </div>
        <h2 style="margin: 0 0 10px; font-size: 20px; color: #1C1917;">Successfully logged into Atithi!</h2>
        <p style="margin: 0 0 18px; font-size: 14px; line-height: 1.6; color: #57534E;">
          Namaskaram <strong>${safeName}</strong>, your email address has been verified and you have successfully logged into your <strong>Atithi</strong> account.
        </p>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; color: #57534E;">
          You can now explore restaurants across Hyderabad, rate dishes, and share authentic dining reviews with our community.
        </p>
        <a href="${escapeHtml(appUrl)}" style="display: inline-block; background: #EA580C; color: #FFFFFF; text-decoration: none; font-weight: 600; font-size: 14px; padding: 12px 22px; border-radius: 10px;">
          Explore Atithi
        </a>
      </div>
    </div>
  `;

  return sendEmail({ to, subject, text, html });
};

module.exports = {
  setTestMailSink,
  sendVerificationOtpEmail,
  sendRegistrationLoginSuccessEmail,
};
