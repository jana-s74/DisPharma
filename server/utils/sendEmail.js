const nodemailer = require('nodemailer');

/**
 * Sends an email using Gmail SMTP.
 * - Tries port 465 (SSL) first, then 587 (STARTTLS) as fallback.
 * - In development, if both Gmail ports fail, falls back to Ethereal.
 * - Registration always succeeds regardless of email delivery status.
 */

// Warn on startup if email credentials are missing
if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
  console.warn('⚠️  WARNING: EMAIL_USER or EMAIL_PASS is not set in .env');
}

const sendEmail = async (options) => {
  // Strip ALL whitespace from Gmail App Password (Google shows it with spaces)
  const emailUser = (process.env.EMAIL_USER || '').trim();
  const emailPass = (process.env.EMAIL_PASS || '').replace(/\s+/g, '');

  const mailOptions = {
    from: `"DisPharma Network" <${emailUser}>`,
    to: options.email,
    subject: options.subject,
    html: options.html,
  };

  if (emailUser && emailPass) {
    // --- Attempt 1: Gmail port 465 (SSL) ---
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
      });

      await transporter.verify();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent via Gmail (port 465): ${info.messageId}`);
      return;
    } catch (err465) {
      console.warn(`⚠️  Gmail port 465 failed: ${err465.message}`);
    }

    // --- Attempt 2: Gmail port 587 (STARTTLS) ---
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: emailUser, pass: emailPass },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
      });

      await transporter.verify();
      const info = await transporter.sendMail(mailOptions);
      console.log(`✅ Email sent via Gmail (port 587): ${info.messageId}`);
      return;
    } catch (err587) {
      console.warn(`⚠️  Gmail port 587 failed: ${err587.message}`);
    }
  }

  // --- Fallback: Ethereal test account (dev only) ---
  if (process.env.NODE_ENV !== 'production') {
    try {
      console.log('📧 Trying Ethereal fallback...');
      const testAccount = await nodemailer.createTestAccount();

      const transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: { user: testAccount.user, pass: testAccount.pass },
        connectionTimeout: 30000,
        socketTimeout: 30000,
      });

      const info = await transporter.sendMail({
        from: `"DisPharma Network" <${testAccount.user}>`,
        to: options.email,
        subject: options.subject,
        html: options.html,
      });

      console.log('\n📧 ─────────────────────────────────────────────────────');
      console.log('   DEV EMAIL via Ethereal (Gmail SMTP unavailable)');
      console.log(`   To:      ${options.email}`);
      console.log(`   Subject: ${options.subject}`);
      console.log(`   Preview: ${nodemailer.getTestMessageUrl(info)}`);
      console.log('   👆 Open the URL above in your browser to view the email!');
      console.log('📧 ─────────────────────────────────────────────────────\n');
      return;
    } catch (ethErr) {
      console.error(`❌ Ethereal fallback also failed: ${ethErr.message}`);
    }
  }

  // All attempts failed
  throw new Error('All email delivery methods failed. Check network/SMTP settings.');
};

module.exports = sendEmail;
