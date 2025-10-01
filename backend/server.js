// backend/server.js
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { handleStatusChange } from "./alerts.js";
import { q } from "./db.js";
import { requireAuth, signToken, verifyUser /*, createUser (optional)*/ } from "./auth.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

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

async function addSite({ url, user_id }) {
  const { rows } = await q(
    `INSERT INTO sites (user_id, url, status)
       VALUES ($1, $2, 'UNKNOWN')
     ON CONFLICT (user_id, url) DO NOTHING
     RETURNING *`,
    [user_id, url]
  );
  if (!rows.length) {
    const existing = await getSiteByUrlForUser(user_id, url);
    return existing;
  }
  return rows[0];
}

async function persistStatus(siteId, newStatus) {
  await q(`UPDATE sites SET status=$1, last_checked=NOW() WHERE id=$2`, [newStatus, siteId]);
  await q(`INSERT INTO site_logs (site_id, status, checked_at) VALUES ($1, $2, NOW())`, [siteId, newStatus]);
}

async function checkSite(site) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);

  let newStatus = "DOWN";
  let httpCode = 0;

  try {
    const resp = await fetch(site.url, { signal: controller.signal /*, method: "HEAD" */ });
    httpCode = resp.status;
    newStatus = resp.ok ? "UP" : "DOWN";
  } catch {
    newStatus = "DOWN";
    httpCode = 0;
  } finally {
    clearTimeout(timeout);
  }

  // fire alert on flip (including UNKNOWN -> *)
  if (site.status === "UNKNOWN" || site.status !== newStatus) {
    try {
      await handleStatusChange(site.url, newStatus);
    } catch (e) {
      console.error("alert error:", e);
    }
  }

  // persist status + log
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
    const result = await checkSite(site);
    return res.json(apiOk({ message: "Site added and checked", url: site.url, ...result }));
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
    const { url } = req.body || {};
    if (!url) return res.status(400).json(apiErr("url required"));

    const normalized = normalizeUrl(url) || url;
    const site = await getSiteByUrlForUser(req.user.id, normalized);
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
    const { url } = req.body || {};
    const normalized = normalizeUrl(url);
    if (!normalized) return res.status(400).json(apiErr("Invalid URL"));
    const site = await addSite({ url: normalized, user_id: req.user.id });
    return res.json(apiOk(site));
  } catch (e) {
    return res.status(500).json(apiErr("create failed"));
  }
});

// PUT /sites/:id → update URL (re-normalize, dedupe per user)
app.put("/sites/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { url } = req.body || {};
    const normalized = normalizeUrl(url);
    if (!normalized) return res.status(400).json(apiErr("Invalid URL"));

    // if another site with same URL exists for this user, block
    const dupe = await getSiteByUrlForUser(req.user.id, normalized);
    if (dupe && String(dupe.id) !== String(id)) {
      return res.status(409).json(apiErr("Duplicate URL for this user"));
    }

    const upd = await q(
      `UPDATE sites SET url=$1 WHERE id=$2 AND user_id=$3 RETURNING *`,
      [normalized, id, req.user.id]
    );
    if (!upd.rows.length) return res.status(404).json(apiErr("Not found"));
    return res.json(apiOk(upd.rows[0]));
  } catch (e) {
    return res.status(500).json(apiErr("update failed"));
  }
});

// DELETE /sites/:id → remove site + logs (cascade)
app.delete("/sites/:id", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const del = await q(`DELETE FROM sites WHERE id=$1 AND user_id=$2 RETURNING id`, [id, req.user.id]);
    if (!del.rows.length) return res.status(404).json(apiErr("Not found"));
    return res.json(apiOk({ id: Number(id), deleted: true }));
  } catch (e) {
    return res.status(500).json(apiErr("delete failed"));
  }
});

/* ----------------------- test-alert (optional) ----------------------- */
// You can keep it open or require auth; here we keep it open for your UI button.
app.post("/test-alert", async (req, res) => {
  const { url, status } = req.body || {};
  if (!url || !status) return res.status(400).json(apiErr("url and status required"));
  try {
    await handleStatusChange(url, status, { force: true });
    return res.json(apiOk(true));
  } catch (e) {
    console.error("TEST-ALERT error:", e);
    return res.status(500).json(apiErr(e?.message || "test-alert failed"));
  }
});

/* ----------------------- sweep loop ----------------------- */
setInterval(async () => {
  try {
    const sites = await getAllSites();
    for (const site of sites) {
      await checkSite(site);
    }
  } catch (e) {
    console.error("sweep error:", e);
  }
}, 60_000);

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
    const user = await createUser(email, password); // from utils.js
    if (!user) {
      return res.status(409).json({ ok: false, error: "email_exists" });
    }
    const token = signToken({ id: user.id, email: user.email });
    return res.json({ ok: true, data: { token, user: { id: user.id, email: user.email } } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "register_failed" });
  }
});

app.get("/sites/:id/logs", authMiddleware, async (req, res) => {
  try {
    const siteId = Number(req.params.id || 0);
    const limit = Math.min(Number(req.query.limit || 50), 200);
    if (!siteId) return res.status(400).json({ ok: false, error: "invalid_site_id" });

    // Ensure the site belongs to this user
    const { rows: srows } = await pool.query(
      `SELECT id FROM sites WHERE id=$1 AND user_id=$2`,
      [siteId, req.user.uid]
    );
    if (srows.length === 0) {
      return res.status(404).json({ ok: false, error: "site_not_found" });
    }

    const { rows } = await pool.query(
      `SELECT status, code, ms, checked_at
         FROM site_logs
        WHERE site_id=$1
        ORDER BY checked_at DESC
        LIMIT $2`,
      [siteId, limit]
    );
    return res.json({ ok: true, data: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ ok: false, error: "logs_fetch_failed" });
  }
});
