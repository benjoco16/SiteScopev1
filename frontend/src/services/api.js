// frontend/src/services/api.js
const BASE = "http://localhost:4000";

export async function addSite(url) {
  const res = await fetch(`${BASE}/add`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("add failed");
  return res.json(); // { message, url, status }
}

export async function getStatus() {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) throw new Error("getStatus failed");
  return res.json(); // array of sites
}

export async function checkNow(url) {
  const res = await fetch(`${BASE}/check-now`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("check-now failed");
  return res.json();
}

export async function testAlert(url, status) {
  const res = await fetch(`${BASE}/test-alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, status }),
  });
  if (!res.ok) throw new Error("test-alert failed");
  return res.json();
}
