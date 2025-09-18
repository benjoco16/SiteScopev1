// frontend/src/services/api.js
const API_URL = "http://localhost:4000";

export async function addSite(url) {
  const res = await fetch(`${API_URL}/ping`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return res.json();
}

export async function getStatus() {
  const res = await fetch(`${API_URL}/status`);
  return res.json();
}
