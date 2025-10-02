
const BASE = process.env.REACT_APP_API_BASE || "http://localhost:4000";
console.log("[api] BASE =", BASE);   // <- will print on page load


function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

// --- Auth ---
export async function register(email, password) {
  const res = await fetch(`${BASE}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) {
    throw new Error(body?.error || "register_failed");
  }
  return body; // { ok:true, data:{ token, user } }
}

// services/api.js
export async function login(email, password) {
  const res = await fetch(`${BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) {
    const msg = body?.error || "login_failed";
    throw new Error(msg);
  }
  return body; // { ok:true, data:{ token, user } }
}


// --- Sites (CRUD, all authed) ---
export async function getSites() {
  const res = await fetch(`${BASE}/sites`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("getSites failed");
  return res.json();
}

export async function addSite(url) {
  const res = await fetch(`${BASE}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) throw new Error("addSite failed");
  return res.json();
}

export async function deleteSite(id) {
  const res = await fetch(`${BASE}/sites/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  return res.json();
}

export async function checkNow(site_id) {
  const res = await fetch(`${BASE}/check-now`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ site_id }),
  });
  if (!res.ok) throw new Error("checkNow failed");
  return res.json();
}

// --- Logs per site ---
export async function getLogs(id, limit = 50) {
  const cleanId = String(id).replace(/^\/+/, ""); // strip any leading slash
  const res = await fetch(`${BASE}/sites/${cleanId}/logs?limit=${limit}`, {
    headers: { "Content-Type": "application/json", ...authHeaders() },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body?.ok === false) throw new Error("getLogs failed");
  return body;
}



export async function testAlert(url, status) {
  const res = await fetch(`${BASE}/test-alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ url, status }),
  });
  if (!res.ok) throw new Error("testAlert failed");
  return res.json();
}

export function logout() {
  localStorage.removeItem("token");
}

export async function forgotPassword(email) {
  const res = await fetch(`${BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json();
}

// ensure your api wrapper adds Authorization from localStorage
// Core fetch wrapper
export async function api(path, opts = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    method: opts.method || "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    ...(opts.body ? { body: opts.body } : {}),
  });

  // Throw on non-2xx so callers can catch
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(text || `HTTP ${res.status}`);
  }
  return await res.json().catch(() => ({}));
}
