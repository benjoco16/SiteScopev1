// backend/server.js
import "dotenv/config";
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { handleStatusChange } from "./alerts.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let monitoredSites = []; // store added sites + status

// --- utils ---
function normalizeUrl(u) {
  try {
    const url = new URL(u.startsWith("http") ? u : `https://${u}`);
    url.hash = ""; // ignore fragments
    return url.toString();
  } catch {
    return null;
  }
}

// --- routes ---

// Add a site (normalized + no duplicates) and immediately check it
app.post("/add", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "URL required" });

  const normalized = normalizeUrl(url);
  if (!normalized) return res.status(400).json({ error: "Invalid URL" });

  if (monitoredSites.some((s) => s.url === normalized)) {
    return res.status(200).json({ message: "Site already monitored", url: normalized });
  }

  const newSite = { url: normalized, status: "UNKNOWN", last_checked: null };
  monitoredSites.push(newSite);

  await checkSite(newSite); // immediate check + possible email
  return res.json({ message: "Site added and checked", url: newSite.url, status: newSite.status });
});

// Get list of monitored sites
app.get("/status", (_req, res) => {
  res.json(monitoredSites);
});

// Force-send an alert (no ping) to test emails from the UI
app.post("/test-alert", async (req, res) => {
  const { url, status } = req.body || {};
  if (!url || !status) return res.status(400).json({ error: "url and status required" });
  try {
    await handleStatusChange(url, status, { force: true });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message });
  }
});

// Real-time check for a specific site (does a real fetch + may email on flip)
app.post("/check-now", async (req, res) => {
  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "url required" });

  const normalized = normalizeUrl(url) || url;
  const site = monitoredSites.find((s) => s.url === normalized);
  if (!site) return res.status(404).json({ error: "site not found" });

  try {
    await checkSite(site);
    res.json({ ok: true, url: site.url, status: site.status, last_checked: site.last_checked });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e?.message });
  }
});

// Simple health
app.get("/health", (_req, res) => res.json({ ok: true, sites: monitoredSites.length }));

// --- monitor ---

async function checkSite(site) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    // If you want lighter checks, switch to method: "HEAD"
    const response = await fetch(site.url, { signal: controller.signal /*, method: "HEAD" */ });
    const newStatus = response.ok ? "UP" : "DOWN";

    if (site.status === "UNKNOWN" || site.status !== newStatus) {
      await handleStatusChange(site.url, newStatus);
    }
    site.status = newStatus;
  } catch (err) {
    if (site.status === "UNKNOWN" || site.status !== "DOWN") {
      await handleStatusChange(site.url, "DOWN");
    }
    site.status = "DOWN";
  } finally {
    clearTimeout(timeout);
    site.last_checked = new Date().toISOString();
  }
}

// Sweep every 60s
setInterval(() => {
  monitoredSites.forEach(checkSite);
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
