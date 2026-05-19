const nodemailer = require('nodemailer');
const dns = require('dns').promises;

const sendEmail = async ({ to, subject, html }) => {
  try {
    const isEthereal = !process.env.EMAIL_HOST;
    const originalHost = process.env.EMAIL_HOST || 'smtp.ethereal.email';
    
    // Resolve host to IPv4 specifically to prevent ENETUNREACH errors on Render
    let resolvedHost = originalHost;
    if (!isEthereal) {
      try {
        const lookup = await dns.lookup(originalHost, { family: 4 });
        resolvedHost = lookup.address;
        console.log(`[SMTP DNS] Resolved ${originalHost} to IPv4: ${resolvedHost}`);
      } catch (dnsErr) {
        console.error(`[SMTP DNS] Lookup failed for ${originalHost}, falling back to original:`, dnsErr);
      }
    }

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: isEthereal ? 587 : (parseInt(process.env.EMAIL_PORT) || 465),
      secure: isEthereal ? false : (process.env.EMAIL_PORT === '465' || true),
      auth: {
        user: process.env.EMAIL_USER || 'leola.steuber@ethereal.email', // Fallback ethereal credentials
        pass: process.env.EMAIL_PASS || 'T8Tch7F3cGBNpxVq7U',
      },
      tls: {
        rejectUnauthorized: false,
        servername: originalHost // Critical for TLS verification to succeed against the original hostname
      },
      connectionTimeout: 6000, // 6 seconds timeout
      greetingTimeout: 6000,
      socketTimeout: 6000
    });

    const mailOptions = {
      from: `"Wedding Expense Tracker" <${process.env.EMAIL_USER || 'noreply@weddingexpense.com'}>`,
      to,
      subject,
      html,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully dispatched: ${info.messageId}`);
    // If using ethereal.email, log preview URL
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`Ethereal Email Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return info;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    throw error;
  }
};

module.exports = sendEmail;

