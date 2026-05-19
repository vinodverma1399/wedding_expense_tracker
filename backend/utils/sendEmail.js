const nodemailer = require('nodemailer');
const dns = require('dns').promises;
const axios = require('axios');

const sendEmail = async ({ to, subject, html }) => {
  // 1. Resend HTTP Driver
  if (process.env.RESEND_API_KEY) {
    try {
      console.log('[Email] Sending via Resend HTTP API...');
      const response = await axios.post('https://api.resend.com/emails', {
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to: [to],
        subject,
        html
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[Email] Resend HTTP Success:`, response.data);
      return response.data;
    } catch (err) {
      console.error('[Email] Resend HTTP Error:', err.response?.data || err.message);
      throw err;
    }
  }

  // 2. Brevo HTTP Driver
  if (process.env.BREVO_API_KEY) {
    try {
      console.log('[Email] Sending via Brevo HTTP API...');
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: {
          name: process.env.EMAIL_FROM_NAME || 'Wedding Expense Tracker',
          email: process.env.EMAIL_USER || 'noreply@weddingexpense.com'
        },
        to: [{ email: to }],
        subject,
        htmlContent: html
      }, {
        headers: {
          'api-key': process.env.BREVO_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[Email] Brevo HTTP Success:`, response.data);
      return response.data;
    } catch (err) {
      console.error('[Email] Brevo HTTP Error:', err.response?.data || err.message);
      throw err;
    }
  }

  // 3. Fallback Standard SMTP (Nodemailer)
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
        console.error(`[SMTP DNS] Lookup failed for ${originalHost}, falling back:`, dnsErr);
      }
    }

    const transporter = nodemailer.createTransport({
      host: resolvedHost,
      port: isEthereal ? 587 : (parseInt(process.env.EMAIL_PORT) || 465),
      secure: isEthereal ? false : (process.env.EMAIL_PORT === '465' || true),
      auth: {
        user: process.env.EMAIL_USER || 'leola.steuber@ethereal.email',
        pass: process.env.EMAIL_PASS || 'T8Tch7F3cGBNpxVq7U',
      },
      tls: {
        rejectUnauthorized: false,
        servername: originalHost
      },
      connectionTimeout: 6000,
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
    console.log(`[SMTP] Email successfully dispatched: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[SMTP] Failed to send email notification:', error);
    throw error;
  }
};

module.exports = sendEmail;
