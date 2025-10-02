// testStatus.js
import fetch from "node-fetch"; // no require since you’re in ESM

async function checkStatus() {
  try {
    const res = await fetch("http://localhost:4000/status");
    const data = await res.json();
    console.clear();
    console.log("📡 SiteScope Status:", new Date().toLocaleTimeString());
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("❌ Error fetching status:", err.message);
  }
}

// Run every 10s
setInterval(checkStatus, 10000);

// Run immediately
checkStatus();
