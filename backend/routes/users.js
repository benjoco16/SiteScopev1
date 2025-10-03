import express from "express";
import { q } from "../db.js";
import { requireAuth } from "../auth.js";

const router = express.Router();

// GET current alert emails
router.get("/alert-emails", requireAuth, async (req, res) => {
  const { rows } = await q("SELECT alert_emails FROM users WHERE id=$1", [req.user.id]);
  res.json({ ok: true, data: rows[0].alert_emails });
});

// UPDATE alert emails (max 2 extra)
router.put("/alert-emails", requireAuth, async (req, res) => {
  const { emails } = req.body;
  if (!Array.isArray(emails) || emails.length > 2) {
    return res.status(400).json({ ok: false, error: "Max 2 extra emails allowed" });
  }
  await q("UPDATE users SET alert_emails=$1 WHERE id=$2", [emails, req.user.id]);
  res.json({ ok: true });
});

export default router;
