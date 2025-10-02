// backend/db.js
import dotenv from "dotenv";
import pkg from "pg";
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  max: 10,
  idleTimeoutMillis: 30_000,
});

export async function query(text, params) {
  const start = Date.now();
  const res = await pool.query(text, params);
  const ms = Date.now() - start;
  if (ms > 200) console.log(`SQL slow (${ms} ms): ${text}`);
  return res;
}

// optional friendly alias used below
export const q = query;
