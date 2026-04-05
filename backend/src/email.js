const { Resend } = require('resend');

function getClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

function isConfigured() {
  return !!process.env.RESEND_API_KEY;
}

async function sendPasswordResetEmail(toEmail, resetUrl) {
  if (!isConfigured()) {
    console.warn('[email] Resend not configured — Reset URL:', resetUrl);
    return;
  }
  const { error } = await getClient().emails.send({
    from: process.env.SMTP_FROM || process.env.RESEND_FROM,
    to: [toEmail],
    template: { id: process.env.RESEND_TEMPLATE_PASSWORD_RESET, variables: { reset_url: resetUrl } },
  });
  if (error) console.error('[email] Failed to send reset email:', error);
}

async function sendVerificationEmail(toEmail, verifyUrl) {
  if (!isConfigured()) {
    console.warn('[email] Resend not configured — Verify URL:', verifyUrl);
    return;
  }
  const { error } = await getClient().emails.send({
    from: process.env.SMTP_FROM || process.env.RESEND_FROM,
    to: [toEmail],
    template: { id: process.env.RESEND_TEMPLATE_VERIFY_EMAIL, variables: { verifyUrl } },
  });
  if (error) console.error('[email] Failed to send verification email:', error);
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
