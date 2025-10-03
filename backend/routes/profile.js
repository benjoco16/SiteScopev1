// backend/routes/profile.js
import express from "express";
import { q } from "../db.js";
import { authMiddleware } from "../auth.js";

const router = express.Router();

// --- Get current profile ---
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const { rows } = await q(
      "SELECT id, email, username, image_url, plan, contact_number FROM users WHERE id=$1",
      [req.user.id]
    );
    res.json({ ok: true, data: rows[0] });
  } catch {
    res.status(500).json({ ok: false, error: "Profile fetch failed" });
  }
});

// --- Update profile ---
router.put("/update", authMiddleware, async (req, res) => {
  const { username, image_url, contact_number, plan } = req.body;
  try {
    const { rows } = await q(
      `UPDATE users
       SET username=$1, image_url=$2, contact_number=$3, plan=$4
       WHERE id=$5
       RETURNING id, email, username, image_url, plan, contact_number`,
      [username, image_url, contact_number, plan, req.user.id]
    );
    res.json({ ok: true, data: rows[0] });
  } catch {
    res.status(500).json({ ok: false, error: "Update failed" });
  }
});

export default router;
