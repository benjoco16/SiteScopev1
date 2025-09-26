// backend/server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import { handleStatusChange } from "./alerts.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

let monitoredSites = []; // store added sites + status

// Add a site
app.post("/add", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "URL required" });

  monitoredSites.push({ url, status: "UNKNOWN" });
  res.json({ message: "Site added", url });
});

// Get list of monitored sites
app.get("/status", (req, res) => {
  res.json(monitoredSites);
});


// Check site
async function checkSite(site) {
  try {
    const response = await fetch(site.url);
    const newStatus = response.ok ? "UP" : "DOWN";

    if (site.status === "UNKNOWN" || site.status !== newStatus) {
      await handleStatusChange(site.url, newStatus); // 🔔 send email
    }

    site.status = newStatus;
    site.last_checked = new Date().toISOString();
  } catch (err) {
    if (site.status === "UNKNOWN" || site.status !== "DOWN") {
      await handleStatusChange(site.url, "DOWN"); // 🔔 send email
    }
    site.status = "DOWN";
    site.last_checked = new Date().toISOString();
  }
}


// Run check every 60s
setInterval(() => {
  monitoredSites.forEach(checkSite);
}, 60 * 1000);

app.listen(PORT, () => {
  console.log(`🚀 Backend running on http://localhost:${PORT}`);
});
