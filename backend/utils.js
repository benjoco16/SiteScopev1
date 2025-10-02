// backend/utils.js
import { URL } from "url";
import bcrypt from "bcryptjs";

export function normalizeUrl(input) {
  let s = (input || "").trim();
  if (!s) return null;
  if (!/^https?:\/\//i.test(s)) s = "https://" + s;
  let url;
  try { url = new URL(s); } catch { return null; }
  url.hash = "";
  // lower-case host, remove trailing slash
  const host = url.hostname.toLowerCase();
  const path = url.pathname.replace(/\/+$/, "");
  url.hostname = host;
  url.pathname = path || "";
  return url.toString();
}

export function apiOk(data)   { return { ok: true,  data, error: null }; }
export function apiErr(msg, code = 400) { 
  const e = { ok: false, data: null, error: msg };
  return { e, code };
}

export async function createUser(email, password) {
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await pool.query(
    `INSERT INTO users (email, password_hash)
     VALUES ($1, $2)
     ON CONFLICT (email)
     DO UPDATE SET password_hash = EXCLUDED.password_hash
     RETURNING id, email`,
    [email, hash]
  );
  return rows[0]; // always returns a row (insert or update)
}

