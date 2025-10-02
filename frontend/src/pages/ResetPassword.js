import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../services/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await resetPassword(token, password);
    if (res.ok) setMsg("Password updated. You can now login.");
    else setMsg(res.error || "Reset failed.");
  };

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl mb-4">Reset Password</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="New password"
          className="border p-2 w-full"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
          Reset
        </button>
      </form>

      {msg && (
        <p className="mt-3">
          {msg}{" "}
          {msg.startsWith("Password updated") && (
            <Link to="/login" className="text-blue-600 underline ml-1">
              Go to Login
            </Link>
          )}
        </p>
      )}
    </div>
  );
}
