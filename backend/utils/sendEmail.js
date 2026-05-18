const nodemailer = require('nodemailer');

const sendEmail = async ({ to, subject, html }) => {
  try {
    // Configurable SMTP transporter with a fallback to Mailtrap / Ethereal or standard SMTP settings
    const isEthereal = !process.env.EMAIL_HOST;
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: isEthereal ? 587 : (parseInt(process.env.EMAIL_PORT) || 465),
      secure: isEthereal ? false : (process.env.EMAIL_PORT === '465' || true),
      auth: {
        user: process.env.EMAIL_USER || 'leola.steuber@ethereal.email', // Fallback ethereal credentials
        pass: process.env.EMAIL_PASS || 'T8Tch7F3cGBNpxVq7U',
      },
      tls: {
        rejectUnauthorized: false
      }
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
  }
};

module.exports = sendEmail;
