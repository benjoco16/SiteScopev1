// backend/alerts.js
import nodemailer from "nodemailer";

let lastStatus = {}; // track last status per URL

// 🔑 SMTP config (use cPanel details instead of Gmail)
const transporter = nodemailer.createTransport({
  host: "cp-wc35.sy0d2.ds.network",  // from cPanel
  port: 465,
  secure: true,                      // true = SSL (port 465), false = TLS (587)
  auth: {
    user: process.env.EMAIL_USER,    // ex: support@benjoco.com
    pass: process.env.EMAIL_PASS,    // password from cPanel
  },
  tls: {
    rejectUnauthorized: false,       // ✅ allow self-signed certs
  },
});

/**
 * Send alert email
 */
export async function sendAlert(url, status) {
  const recipient = process.env.ALERT_TO || process.env.EMAIL_USER; // fallback

  const mailOptions = {
    from: `"SiteScope Alerts" <${process.env.EMAIL_USER}>`,
    to: recipient,
    subject: `SiteScope Alert: ${url} is ${status}`,
    text: `Website: ${url}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${recipient}: ${url} is ${status}`);
  } catch (err) {
    console.error("❌ Error sending email:", err.message);
  }
}

/**
 * Check if status has changed before sending alert
 */
export async function handleStatusChange(url, currentStatus) {
  if (lastStatus[url] !== currentStatus) {
    console.log(`🔔 Status changed for ${url}: ${lastStatus[url] || "UNKNOWN"} → ${currentStatus}`);
    await sendAlert(url, currentStatus); // ✅ ensures email is sent
    lastStatus[url] = currentStatus;
  }
}
