// backend/server.js
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { handleStatusChange, transporter } from "./alerts.js";
import { fcm, sendPushNotification } from "./firebaseAdmin.js";
import crypto from "crypto";
import { q } from "./db.js";
import bcrypt from "bcrypt";
import { requireAuth, signToken, verifyUser, createUser } from "./auth.js";
import authRoutes from "./routes/auth.js";
import profileRoutes from "./routes/profile.js";
import userRoutes from "./routes/users.js";

// Environment validation - CRITICAL SECURITY
const requiredEnvVars = [
  'JWT_SECRET',
  'DB_HOST', 
  'DB_NAME',
  'DB_USER',
  'DB_PASS',
  'EMAIL_USER',
  'EMAIL_PASS'
];

const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
if (missingVars.length > 0) {
  console.error('❌ CRITICAL: Missing required environment variables:');
  missingVars.forEach(envVar => console.error(`   - ${envVar}`));
  console.error('\n💡 Create a .env file with these variables before starting the server.');
  process.exit(1);
}

// Validate JWT_SECRET is not the default
if (process.env.JWT_SECRET === 'dev_secret_change_me') {
  console.error('❌ CRITICAL: JWT_SECRET is still using the default value!');
  console.error('💡 Set a strong, unique JWT_SECRET in your .env file.');
  process.exit(1);
}

console.log('✅ Environment validation passed');

const app = express();
const PORT = process.env.PORT || 4000;

// Security middleware - CRITICAL
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
}));

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    ok: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
app.use(limiter);

// CORS configuration - restricted origins
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL] // Will be set to your production domain
    : ['http://localhost:3000'], // Development only
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' })); // Limit request size

// Route groups
app.use("/auth", authRoutes);
app.use("/auth", profileRoutes); // keep profile under /auth
app.use("/users", userRoutes);

/* ----------------------- response helpers ----------------------- */
const apiOk  = (data) => ({ ok: true,  data, error: null });
const apiErr = (msg)   => ({ ok: false, data: null, error: msg });

/* ----------------------- helpers ----------------------- */
function normalizeUrl(u) {
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    url.hash = "";
    // lower host, strip trailing slash path
    url.hostname = url.hostname.toLowerCase();
    url.pathname = url.pathname.replace(/\/+$/, "");
    return url.toString();
  } catch {
    return null;
  }
}

async function getAllSites() {
  const { rows } = await q("SELECT * FROM sites ORDER BY id ASC");
  return rows;
}

async function getSitesByUser(userId) {
  const { rows } = await q(
    `SELECT s.*
       FROM sites s
      WHERE s.user_id = $1
      ORDER BY s.id ASC`,
    [userId]
  );
  return rows;
}

async function getSiteByIdForUser(userId, id) {
  const { rows } = await q(
    `SELECT * FROM sites WHERE id=$1 AND user_id=$2`,
    [id, userId]
  );
  return rows[0] || null;
}

async function getSiteByUrlForUser(userId, url) {
  const { rows } = await q(
    `SELECT * FROM sites WHERE user_id=$1 AND url=$2`,
    [userId, url]
  );
  return rows[0] || null;
}

async function addSite({ url, user_id, alert_emails = [] }) {
  const { rows } = await q(
    `INSERT INTO sites (user_id, url, status, alert_emails)
       VALUES ($1, $2, 'UNKNOWN', $3)
     ON CONFLICT (user_id, url) DO UPDATE SET alert_emails = EXCLUDED.alert_emails
     RETURNING *`,
    [user_id, url, alert_emails]
  );
  if (!rows.length) {
    const existing = await getSiteByUrlForUser(user_id, url);
    return existing;
  }
  return rows[0];
}

async function persistStatus(siteId, newStatus) {
  // site may have been deleted between fetch and persist — ignore if so
  const exists = await q("SELECT 1 FROM sites WHERE id=$1", [siteId]);
  if (exists.rowCount === 0) return;

  await q(
    `UPDATE sites
       SET status=$1,
           last_checked=NOW()
     WHERE id=$2`,
    [newStatus, siteId]
  );

  await q(
    `INSERT INTO site_logs (site_id, status, checked_at)
     VALUES ($1, $2, NOW())`,
    [siteId, newStatus]
  );
}



async function checkSite(site) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let newStatus = "DOWN";
  let httpCode = 0;

  try {
    const resp = await fetch(site.url, { signal: controller.signal });
    httpCode = resp.status;
    newStatus = resp.ok ? "UP" : "DOWN";
  } catch {
    newStatus = "DOWN";
    httpCode = 0;
  } finally {
    clearTimeout(timeout);
  }

  if (site.status === "UNKNOWN" || site.status !== newStatus) {
    try { await handleStatusChange(site.user_id, site.url, newStatus); }    
    catch (e) { console.error("alert error:", e); }
  }

  await persistStatus(site.id, newStatus);
  return { status: newStatus, http_code: httpCode };
}


/* ----------------------- AUTH ROUTES ----------------------- */
// (Signup route optional; keeping minimal per your ask)

app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json(apiErr("email & password required"));

    const user = await verifyUser(email, password);
    if (!user) return res.status(401).json(apiErr("invalid credentials"));

    const token = signToken(user);
    // also expose .token at root for your jq script
    return res.json({ ...apiOk({ token, user }), token });
  } catch (e) {
    console.error("login error", e);
    return res.status(500).json(apiErr("login failed"));
  }
});

// Logout
app.post("/auth/logout", requireAuth, (req, res) => {
  res.json({ ok: true, data: "Logged out successfully" });
});


// Forgot password (send reset link)
app.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json(apiErr("Email required"));

  const { rows } = await q("SELECT * FROM users WHERE email=$1", [email]);
  if (!rows.length) return res.json(apiErr("Email not found"));

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 30);
  await q("INSERT INTO password_resets(user_id, token, expires_at) VALUES($1,$2,$3)",
    [rows[0].id, token, expiresAt]);

  const resetLink = `http://localhost:3000/reset-password?token=${token}`;

  try {
    await transporter.sendMail({
      from: `"SiteScope" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "SiteScope Reset Password",
      text: `Click to reset your password: ${resetLink}`,
      html: `<p>Click below to reset your password:</p>
            <a href="${resetLink}">${resetLink}</a>`,
    });

    return res.json(apiOk(true));
  } catch (err) {
    console.error("Email send failed:", err);
    return res.json(apiErr("Failed to send email"));
  }
});


// Reset password (apply new password)
app.post("/auth/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) return res.json(apiErr("Invalid"));

  const { rows } = await q(
    "SELECT * FROM password_resets WHERE token=$1 AND expires_at > NOW()",
    [token]
  );
  if (!rows.length) return res.json(apiErr("Expired/Invalid token"));

  const hash = await bcrypt.hash(newPassword, 10);

  await q("UPDATE users SET password_hash=$1 WHERE id=$2", [
    hash,
    rows[0].user_id,
  ]);
  await q("DELETE FROM password_resets WHERE token=$1", [token]);

  return res.json(apiOk(true));
});

/* ----------------------- USER-SCOPED ROUTES ----------------------- */
// Legacy kept but now auth-required + user-scoped

// Add a site (normalized + dedupe) and immediately check it
app.post("/add", requireAuth, async (req, res) => {
  try {
    const { url } = req.body || {};
    if (!url) return res.status(400).json(apiErr("URL required"));

    const normalized = normalizeUrl(url);
    if (!normalized) return res.status(400).json(apiErr("Invalid URL"));

    const site = await addSite({ url: normalized, user_id: req.user.id });

    // run first check; checkSite will persist status + log
    const result = await checkSite(site);

    return res.json(apiOk({
      id: site.id,
      url: site.url,
      status: result.status,
      last_checked: new Date().toISOString()
    }));
  } catch (e) {
    console.error("ADD error:", e);
    return res.status(500).json(apiErr("add failed"));
  }
});


// List your sites
app.get("/status", requireAuth, async (req, res) => {
  try {
    const rows = await getSitesByUser(req.user.id);
    return res.json(apiOk(rows));
  } catch (e) {
    console.error("STATUS error:", e);
    return res.status(500).json(apiErr("getStatus failed"));
  }
});

// Real-time check for a specific site you own
app.post("/check-now", requireAuth, async (req, res) => {
  try {
    const { url, site_id } = req.body || {};
    if (!url && !site_id) return res.status(400).json(apiErr("url or site_id required"));

    let site = null;

    if (site_id) {
      const { rows } = await q(
        `SELECT * FROM sites WHERE id=$1 AND user_id=$2`,
        [Number(site_id), req.user.id]
      );
      site = rows[0] || null;
    } else {
      const normalized = normalizeUrl(url) || url;
      site = await getSiteByUrlForUser(req.user.id, normalized);
    }

    if (!site) return res.status(404).json(apiErr("site not found"));

    const result = await checkSite(site);
    return res.json(apiOk({ url: site.url, ...result }));
  } catch (e) {
    console.error("CHECK-NOW error:", e);
    return res.status(500).json(apiErr(e?.message || "check-now failed"));
  }
});


/* ----------------------- NEW: /sites CRUD ----------------------- */
// GET /sites → list my sites (same as /status)
app.get("/sites", requireAuth, async (req, res) => {
  try {
    const rows = await getSitesByUser(req.user.id);
    return res.json(apiOk(rows));
  } catch (e) {
    return res.status(500).json(apiErr("load sites failed"));
  }
});

// POST /sites → add a site (same as /add)
app.post("/sites", requireAuth, async (req, res) => {
  try {
    const { url, alert_emails = [] } = req.body || {};
    const normalized = normalizeUrl(url);
    if (!normalized) return res.status(400).json(apiErr("Invalid URL"));
    
    // Validate alert emails
    const validEmails = Array.isArray(alert_emails) 
      ? alert_emails.filter(email => email && email.trim() && email.includes('@'))
      : [];
    
    const site = await addSite({ 
      url: normalized, 
      user_id: req.user.id, 
      alert_emails: validEmails 
    });
    return res.json(apiOk(site));
  } catch (e) {
    return res.status(500).json(apiErr("create failed"));
  }
});

// PUT /sites/:id → update URL and alert emails
app.put("/sites/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url, alert_emails = [] } = req.body || {};
    
    let updateFields = [];
    let updateValues = [];
    let paramCount = 1;

    // Handle URL update
    if (url) {
      const normalized = normalizeUrl(url);
      if (!normalized) return res.status(400).json(apiErr("Invalid URL"));

      // Check for duplicate URL
      const dupe = await getSiteByUrlForUser(req.user.id, normalized);
      if (dupe && String(dupe.id) !== String(id)) {
        return res.status(409).json(apiErr("Duplicate URL for this user"));
      }

      updateFields.push(`url = $${paramCount}`);
      updateValues.push(normalized);
      paramCount++;
    }

    // Handle alert emails update
    if (alert_emails !== undefined) {
      const validEmails = Array.isArray(alert_emails) 
        ? alert_emails.filter(email => email && email.trim() && email.includes('@'))
        : [];
      
      updateFields.push(`alert_emails = $${paramCount}`);
      updateValues.push(validEmails);
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json(apiErr("No fields to update"));
    }

    // Add WHERE clause parameters
    updateValues.push(id, req.user.id);

    const upd = await q(
      `UPDATE sites SET ${updateFields.join(', ')} WHERE id=$${paramCount} AND user_id=$${paramCount + 1} RETURNING *`,
      updateValues
    );
    
    if (!upd.rows.length) return res.status(404).json(apiErr("Not found"));
    return res.json(apiOk(upd.rows[0]));
  } catch (e) {
    return res.status(500).json(apiErr("update failed"));
  }
});

// Delete site by ID (must belong to user)
app.delete("/sites/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await q(
      "DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ ok: false, error: "Not found" });
    }

    res.json({ ok: true, data: result.rows[0] });
  } catch (err) {
    console.error("Delete site failed:", err);
    res.status(500).json({ ok: false, error: "Server error" });
  }
});

/* ----------------------- test-alert (optional) ----------------------- */
// You can keep it open or require auth; here we keep it open for your UI button.
app.post("/test-alert", requireAuth, async (req, res) => {
  const { url, status } = req.body || {};
  if (!url || !status) return res.status(400).json(apiErr("url and status required"));
  try {
    await handleStatusChange(req.user.id, url, status, { force: true });
    return res.json(apiOk(true));
  } catch (e) {
    console.error("TEST-ALERT error:", e);
    return res.status(500).json(apiErr(e?.message || "test-alert failed"));
  }
});

// Test notification endpoint
app.post("/test-notification", requireAuth, async (req, res) => {
  try {
    const { type = "email" } = req.body || {};
    
    if (type === "email") {
      // Send test email
      await handleStatusChange(req.user.id, "https://example.com", "DOWN", { force: true });
      return res.json(apiOk({ message: "Test email notification sent" }));
    } else if (type === "push") {
      // Send test push notification
      const { rows: tokenRows } = await q("SELECT token FROM user_tokens WHERE user_id=$1", [req.user.id]);
      if (tokenRows.length === 0) {
        return res.status(400).json(apiErr("No push notification tokens found"));
      }
      
      for (const row of tokenRows) {
        try {
          const result = await sendPushNotification(
            row.token,
            "SiteScope Test Notification",
            "This is a test notification from SiteScope",
            {
              type: 'test_notification',
              timestamp: Date.now().toString()
            }
          );
          
          if (result.success) {
            console.log(`✅ Test push notification sent successfully`);
          } else if (result.shouldRemove) {
            // Remove invalid token
            await q("DELETE FROM user_tokens WHERE token=$1", [row.token]);
            console.log(`🗑️ Removed invalid token during test`);
          } else {
            console.error(`❌ Test push notification failed:`, result.error);
          }
        } catch (err) {
          console.error("Push test error:", err);
        }
      }
      
      return res.json(apiOk({ message: "Test push notification sent" }));
    }
    
    return res.status(400).json(apiErr("Invalid notification type"));
  } catch (e) {
    console.error("TEST-NOTIFICATION error:", e);
    return res.status(500).json(apiErr(e?.message || "test-notification failed"));
  }
});

// Save FCM token endpoint
app.post("/save-token", requireAuth, async (req, res) => {
  try {
    const { token } = req.body || {};
    const userId = req.user.id;

    if (!token) {
      return res.status(400).json(apiErr("Token is required"));
    }

    // Insert or update the token
    await q(
      `INSERT INTO user_tokens (user_id, token) 
       VALUES ($1, $2) 
       ON CONFLICT (token) DO UPDATE SET user_id = EXCLUDED.user_id`,
      [userId, token]
    );

    console.log(`✅ FCM token saved for user ${userId}`);
    return res.json(apiOk({ message: "Token saved successfully" }));
  } catch (e) {
    console.error("Save token error:", e);
    return res.status(500).json(apiErr("Failed to save token"));
  }
});

// Profile update endpoint
app.put("/auth/update", requireAuth, async (req, res) => {
  try {
    const { username, image_url, contact_number, plan, alert_emails } = req.body || {};
    const userId = req.user.id;

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    if (username !== undefined) {
      updateFields.push(`username = $${paramCount}`);
      updateValues.push(username);
      paramCount++;
    }

    if (image_url !== undefined) {
      updateFields.push(`image_url = $${paramCount}`);
      updateValues.push(image_url);
      paramCount++;
    }

    if (contact_number !== undefined) {
      updateFields.push(`contact_number = $${paramCount}`);
      updateValues.push(contact_number);
      paramCount++;
    }

    if (plan !== undefined) {
      updateFields.push(`plan = $${paramCount}`);
      updateValues.push(plan);
      paramCount++;
    }

    if (alert_emails !== undefined) {
      // Validate alert emails
      const validEmails = Array.isArray(alert_emails)
        ? alert_emails.filter(email => email && email.trim() && email.includes('@'))
        : [];

      updateFields.push(`alert_emails = $${paramCount}::jsonb`);
      updateValues.push(JSON.stringify(validEmails));
      paramCount++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json(apiErr("No fields to update"));
    }

    // Add WHERE clause parameter
    updateValues.push(userId);

    const result = await q(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      updateValues
    );

    if (!result.rows.length) {
      return res.status(404).json(apiErr("User not found"));
    }

    return res.json(apiOk(result.rows[0]));
  } catch (e) {
    console.error("Profile update error:", e);
    return res.status(500).json(apiErr("Profile update failed"));
  }
});


/* ----------------------- monitoring loop ----------------------- */
// Improved monitoring with parallel processing and error handling
async function runMonitoringCycle() {
  try {
    const sites = await getAllSites();
    if (sites.length === 0) {
      console.log("📊 No sites to monitor");
      return;
    }

    console.log(`🔄 Starting monitoring cycle for ${sites.length} sites`);
    const startTime = Date.now();

    // Process all sites in parallel with individual error handling
    const results = await Promise.allSettled(
      sites.map(async (site) => {
        try {
          const result = await checkSite(site);
          return { site: site.url, status: result.status, success: true };
        } catch (error) {
          console.error(`❌ Failed to check ${site.url}:`, error.message);
          return { site: site.url, error: error.message, success: false };
        }
      })
    );

    // Log summary
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    const duration = Date.now() - startTime;

    console.log(`✅ Monitoring cycle complete: ${successful} successful, ${failed} failed (${duration}ms)`);
    
    // Log any failures for debugging
    results.forEach(result => {
      if (result.status === 'rejected') {
        console.error(`❌ Promise rejected:`, result.reason);
      } else if (result.value && !result.value.success) {
        console.error(`❌ Site check failed:`, result.value);
      }
    });

  } catch (error) {
    console.error("💥 Critical monitoring error:", error);
  }
}

// Run monitoring every 2 minutes (120,000ms)
setInterval(runMonitoringCycle, 120_000);

// Run initial cycle after 5 seconds to let server start up
setTimeout(runMonitoringCycle, 5000);

/* ----------------------- start ----------------------- */
app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});

app.post("/auth/register", async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "email_and_password_required" });
    }
    const user = await createUser(email, password); // always returns a row
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ ok: true, data: { token, user: { id: user.id, email: user.email } } });
  } catch (e) {
    console.error("register_failed", e);
    return res.status(500).json({ ok: false, error: "register_failed" });
  }
});

// REPLACE the whole handler with this
app.get("/sites/:id/logs", requireAuth, async (req, res) => {
  try {
    const siteId = Number(req.params.id || 0);
    if (!Number.isInteger(siteId) || siteId <= 0) {
      return res.status(400).json(apiErr("invalid_site_id"));
    }
    const limit = Math.max(1, Math.min(200, Number(req.query.limit || 50)));

    const { rows: srows } = await q(
      "SELECT id FROM sites WHERE id=$1 AND user_id=$2",
      [siteId, req.user.id]
    );
    if (!srows.length) return res.status(404).json(apiErr("site_not_found"));

    const { rows } = await q(
      `
      SELECT status, checked_at
      FROM site_logs
      WHERE site_id=$1
      ORDER BY checked_at DESC
      LIMIT ${limit};
      `,
      [siteId]
    );
    res.json(apiOk(rows));
  } catch (e) {
    console.error("LOGS error:", e);
    res.status(500).json(apiErr("logs_fetch_failed"));
  }
});


//Firebase Admin SDK for FCM
app.post("/save-token", requireAuth, async (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(400).json({ ok: false, error: "No token" });

  await q(
    "INSERT INTO user_tokens (user_id, token) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [req.user.id, token]
  );

  res.json({ ok: true });
});
