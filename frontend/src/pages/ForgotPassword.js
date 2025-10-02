import { useState } from "react";
import { forgotPassword } from "../services/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // quick client-side validation
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setMsg("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await forgotPassword(email);
      if (res.ok) {
        setMsg("✅ Check your email for a reset link.");
      } else {
        setMsg(res.error || "❌ Email not found.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl mb-4">Forgot Password</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="border p-2 w-full rounded"
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-4 py-2 rounded w-full ${
            loading
              ? "bg-gray-400 text-white cursor-not-allowed"
              : "bg-blue-500 text-white hover:bg-blue-600"
          }`}
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>
      {msg && <p className="mt-3 text-sm">{msg}</p>}
    </div>
  );
}
