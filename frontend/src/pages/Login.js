import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await login(email, password);
      nav("/");
    } catch (e) {
      setErr(e?.message || "Login failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-xl mb-3">Login</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input
          className="border w-full p-2 rounded"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          className="border w-full p-2 rounded"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="bg-blue-600 text-white px-3 py-2 rounded w-full">
          Login
        </button>
      </form>

      <div className="text-sm mt-3 flex justify-between">
        <Link to="/register" className="underline">
          No account? Register
        </Link>
        <Link to="/forgot-password" className="underline text-blue-600">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
