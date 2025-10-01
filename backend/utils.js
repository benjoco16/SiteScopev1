// backend/utils.js
import { URL } from "url";

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
