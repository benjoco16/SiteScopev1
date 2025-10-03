// backend/alerts.js
import nodemailer from "nodemailer";
import { fcm, sendPushNotification } from "./firebaseAdmin.js";
import { q } from "./db.js";

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
  .then(() => console.log("✅ SMTP connection verified - Email notifications ready"))
  .catch((err) => console.error("❌ SMTP connection failed:", err));

const lastStatus = new Map();       // url -> "UP"/"DOWN"/"UNKNOWN"
const lastNotifiedAt = new Map();   // url -> timestamp
const NOTIFY_COOLDOWN_MS = parseInt(process.env.NOTIFY_COOLDOWN_MS || "600000", 10);

// ---- email sender (multi-recipient from DB) ----
async function sendEmailAlert(userId, url, status) {
  // Get user's primary email and site-specific alert emails
  const { rows: userRows } = await q("SELECT email, alert_emails FROM users WHERE id=$1", [userId]);
  if (!userRows[0]) return;

  const { rows: siteRows } = await q("SELECT alert_emails FROM sites WHERE user_id=$1 AND url=$2", [userId, url]);
  
  const primaryEmail = userRows[0].email;
  const userAlertEmails = userRows[0].alert_emails || [];
  const siteAlertEmails = siteRows[0]?.alert_emails || [];
  
  // Parse JSONB alert_emails if they're stored as JSON
  const parsedUserEmails = Array.isArray(userAlertEmails) ? userAlertEmails : 
    (typeof userAlertEmails === 'string' ? JSON.parse(userAlertEmails) : []);
  
  // Combine primary email with user and site-specific alert emails
  const allEmails = [primaryEmail, ...parsedUserEmails, ...siteAlertEmails];
  const uniqueEmails = [...new Set(allEmails)]; // Remove duplicates
  const recipients = uniqueEmails.slice(0, 5); // max 5 emails per site

  console.log(`📧 Sending alerts to ${recipients.length} recipients for ${url}:`, recipients);

  for (let to of recipients) {
    if (!to || !to.trim()) continue; // Skip empty emails
    
    try {
      const mailOptions = {
        from: `"SiteScope Alerts" <${process.env.EMAIL_USER}>`,
        to: to.trim(),
        subject: `SiteScope Alert: ${url} is ${status}`,
        text: `Website: ${url}\nStatus: ${status}\nTime: ${new Date().toLocaleString()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: ${status === 'UP' ? '#28a745' : '#dc3545'};">
              SiteScope Alert: ${url} is ${status}
            </h2>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
              <p><strong>Website:</strong> ${url}</p>
              <p><strong>Status:</strong> <span style="color: ${status === 'UP' ? '#28a745' : '#dc3545'}; font-weight: bold;">${status}</span></p>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p style="color: #6c757d; font-size: 12px; margin-top: 20px;">
              This alert was sent by SiteScope monitoring service.
            </p>
          </div>
        `,
      };

      const info = await transporter.sendMail(mailOptions);
      console.log(`📧 Email sent: ${info.messageId} → ${to} (${url} ${status})`);
    } catch (error) {
      console.error(`❌ Failed to send email to ${to}:`, error.message);
    }
  }
}



// ---- main exported hook (called by server.js) ----
export async function handleStatusChange(userId, url, currentStatus, opts = {}) {
  const { force = false } = opts;
  const key = `${userId}:${url}`;

  const prev = lastStatus.get(key);
  const now = Date.now();
  const last = lastNotifiedAt.get(key) || 0;
  const cooldownPassed = now - last > NOTIFY_COOLDOWN_MS;

  const isFirst = prev === undefined || prev === "UNKNOWN";
  const changed = prev !== currentStatus;

  // Only send alerts on actual status changes (not on every check)
  if (force || isFirst || changed) {
    if (!force && !cooldownPassed) {
      console.log(`⏳ Cooldown active → skip alert for ${url} (${Math.round((NOTIFY_COOLDOWN_MS - (now - last)) / 1000)}s remaining)`);
      return;
    }

    // Log the status change
    if (changed) {
      console.log(`🔄 Status change detected: ${url} ${prev} → ${currentStatus}`);
    } else if (isFirst) {
      console.log(`🆕 First check: ${url} is ${currentStatus}`);
    } else if (force) {
      console.log(`🧪 Test alert: ${url} is ${currentStatus}`);
    }

    try {
      // Send email alerts
      await sendEmailAlert(userId, url, currentStatus);

          // Send push notifications
          const { rows: tokenRows } = await q("SELECT token FROM user_tokens WHERE user_id=$1", [userId]);
          for (const row of tokenRows) {
            try {
              const result = await sendPushNotification(
                row.token,
                `SiteScope: ${url} is ${currentStatus}`,
                `Website ${url} is currently ${currentStatus}`,
                {
                  url: url,
                  status: currentStatus,
                  type: 'website_status_change'
                }
              );
              
              if (result.success) {
                console.log(`🔔 Push notification sent for ${url} (${currentStatus})`);
              } else if (result.shouldRemove) {
                // Remove invalid token from database
                await q("DELETE FROM user_tokens WHERE token=$1", [row.token]);
                console.log(`🗑️ Removed invalid token from database`);
              } else {
                console.error(`❌ Push notification failed for ${url}:`, result.error);
              }
            } catch (err) {
              console.error(`❌ Push notification error for ${url}:`, err.message);
            }
          }

      lastNotifiedAt.set(key, now);
      console.log(`✅ Alerts sent successfully for ${url}`);
    } catch (error) {
      console.error(`❌ Failed to send alerts for ${url}:`, error.message);
    }
  } else {
    // Status unchanged - no alert needed
    console.log(`📊 Status unchanged: ${url} remains ${currentStatus}`);
  }

  // Always update the last known status
  lastStatus.set(key, currentStatus);
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