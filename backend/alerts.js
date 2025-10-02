// backend/alerts.js
import nodemailer from "nodemailer";
import { fcm } from "./firebaseAdmin.js";

// ---- SMTP transport (your cPanel settings) ----
export const transporter = nodemailer.createTransport({
  host: "cp-wc35.syd02.ds.network",
  port: 465,
  secure: true,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  tls: { rejectUnauthorized: false },
});

// Optional sanity check at boot
transporter.verify()
  .then(() => console.log("SMTP OK"))
  .catch((err) => console.error("SMTP FAIL", err));

const lastStatus = new Map();       // url -> "UP"/"DOWN"/"UNKNOWN"
const lastNotifiedAt = new Map();   // url -> timestamp
const NOTIFY_COOLDOWN_MS = parseInt(process.env.NOTIFY_COOLDOWN_MS || "600000", 10);

// ---- email sender ----
async function sendEmailAlert(url, status) {
  const to = process.env.ALERT_TO || process.env.EMAIL_USER;

  const mailOptions = {
    from: `"SiteScope Alerts" <${process.env.EMAIL_USER}>`,
    to,
    subject: `SiteScope Alert: ${url} is ${status}`,
    text: `Website: ${url}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}`,
    // html: `<p><strong>${url}</strong> is <strong>${status}</strong></p><p>${new Date().toLocaleString()}</p>`
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent: ${info.messageId} → ${to} (${url} ${status})`);
}

// ---- main exported hook (called by server.js) ----
export async function handleStatusChange(url, currentStatus, opts = {}) {
  const { force = false } = opts;

  const prev = lastStatus.get(url);
  const now = Date.now();
  const last = lastNotifiedAt.get(url) || 0;
  const cooldownPassed = now - last > NOTIFY_COOLDOWN_MS;

  const isFirst = prev === undefined || prev === "UNKNOWN";
  const changed = prev !== currentStatus;

  if (force || isFirst || changed) {
    if (!force && !cooldownPassed) {
      console.log(`⏳ Cooldown active → skip email for ${url} (${prev || "NEW"} → ${currentStatus})`);
    } else {
      await sendEmailAlert(url, currentStatus);
      lastNotifiedAt.set(url, now);
    }
    lastStatus.set(url, currentStatus);
  }
}

export async function sendPushFCM(token, title, body) {
  try {
    await fcm.send({
      token,
      notification: { title, body },
    });
    console.log("Push sent:", title);
  } catch (err) {
    console.error("Push error:", err);
  }
}