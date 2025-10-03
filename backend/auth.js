// backend/auth.js
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { q } from "./db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_secret_change_me";

/** issue a 7d JWT */
export function signToken(user) {
  const payload = { id: user.id, email: user.email };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

// --- Verify user ---
export async function verifyUser(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

// --- Middleware ---
export async function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ ok: false, error: "Missing token" });

  const token = auth.split(" ")[1];
  const decoded = await verifyUser(token);
  if (!decoded) return res.status(401).json({ ok: false, error: "Invalid token" });

  req.user = decoded;
  next();
}

/** Express middleware to require Bearer token */
export function requireAuth(req, res, next) {
  const hdr = req.headers.authorization || "";
  const [scheme, token] = hdr.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({ ok: false, data: null, error: "Missing Bearer token" });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email };
    next();
  } catch {
    return res.status(401).json({ ok: false, data: null, error: "Invalid/expired token" });
  }
}

/** create user in DB with hashed password */
export async function createUser(email, password) {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  const up = await q(
    `INSERT INTO users(email, password_hash)
       VALUES ($1, $2)
     ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
     RETURNING id, email`,
    [email, hash]
  );
  return up.rows[0];
}

/** verify env-admin OR DB user */
export async function verifyCredentials(email, password) {
  // Env admin (MVP backdoor)
  if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
    if (email === process.env.ADMIN_EMAIL && password === process.env.ADMIN_PASSWORD) {
      // ensure env-admin exists in DB (idempotent)
      const up = await q(
        `INSERT INTO users(email)
           VALUES ($1)
         ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email
         RETURNING id, email`,
        [email]
      );
      return up.rows[0];
    }
  }

  // DB user
  const { rows } = await q(`SELECT id, email, password_hash FROM users WHERE email=$1`, [email]);
  if (!rows.length) return null;
  const u = rows[0];
  const ok = await bcrypt.compare(password, u.password_hash || "");
  if (!ok) return null;
  return { id: u.id, email: u.email };
}

// Get current user profile
export async function getProfile(req, res) {
  try {
    const { rows } = await q(
      "SELECT id, email, username, image_url, plan, contact_number FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Profile fetch failed" });
  }
}
