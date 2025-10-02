import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// 🔹 In-memory sites store
let sites = {};  // { url: { status: "UP"/"DOWN", code: number, last_checked: string } }

// 🔹 Ping endpoint
app.post("/ping", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ status: "error", message: "URL required" });
  }

  try {
    const response = await fetch(url, { method: "GET" });
    sites[url] = {
      status: response.ok ? "UP" : "DOWN",
      code: response.status,
      last_checked: new Date().toISOString(),
    };
    return res.json(sites[url]);
  } catch (err) {
    sites[url] = {
      status: "DOWN",
      error: err.message,
      last_checked: new Date().toISOString(),
    };
    return res.json(sites[url]);
  }
});

// 🔹 Status endpoint
app.get("/status", (req, res) => {
  res.json(sites);
});

// 🔹 Auto-monitor loop (every 60s)
setInterval(async () => {
  for (const url of Object.keys(sites)) {
    try {
      const response = await fetch(url);
      sites[url] = {
        status: response.ok ? "UP" : "DOWN",
        code: response.status,
        last_checked: new Date().toISOString(),
      };
    } catch (err) {
      sites[url] = {
        status: "DOWN",
        error: err.message,
        last_checked: new Date().toISOString(),
      };
    }
  }
  if (Object.keys(sites).length > 0) {
    console.log("🔄 Auto-monitoring cycle complete:", new Date().toLocaleTimeString());
  }
}, 60000);

// Start server
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
