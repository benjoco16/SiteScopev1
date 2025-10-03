// backend/routes/auth.js
import express from "express";
import bcrypt from "bcrypt";
import { q } from "../db.js";
import { signToken, verifyCredentials  } from "../auth.js";

const router = express.Router();

// --- Register ---
router.post("/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hash = await bcrypt.hash(password, 10);
    const { rows } = await q(
      "INSERT INTO users(email, password_hash) VALUES($1, $2) RETURNING id, email",
      [email, hash]
    );
    res.json({ ok: true, data: rows[0] });
  } catch (err) {
    res.status(400).json({ ok: false, error: "Register failed" });
  }
});

// --- Login ---
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await verifyCredentials(email, password); // <- use renamed function
    if (!user) return res.status(401).json({ ok: false, error: "Invalid email or password" });

    const token = signToken(user);
    res.json({ ok: true, data: { token } });
  } catch (err) {
    res.status(500).json({ ok: false, error: "Login failed" });
  }
});

export default router;
