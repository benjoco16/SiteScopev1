// Pure route construction: importing this module starts no integrations or timers.
export function makeRegisterHandler({ createUser, signToken }) {
  return async (req, res) => {
    const { email, password } = req.body || {};
    if (typeof email !== "string" || !email.trim() ||
        typeof password !== "string" || !password) {
      return res.status(400).json({ ok: false, error: "email_and_password_required" });
    }
    try {
      const user = await createUser(email, password);
      const token = signToken({ id: user.id, email: user.email });
      return res.json({ ok: true, data: { token, user: { id: user.id, email: user.email } } });
    } catch (error) {
      if (error?.code === "REGISTRATION_CONFLICT") {
        return res.status(409).json({ ok: false, error: "registration_unavailable" });
      }
      // Do not log database errors that may contain submitted credentials.
      return res.status(500).json({ ok: false, error: "register_failed" });
    }
  };
}
