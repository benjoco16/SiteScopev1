import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      await register(email, password);
      nav("/");
    } catch {
      setErr("Registration failed");
    }
  }

  return (
    <div className="max-w-sm mx-auto p-4">
      <h1 className="text-xl mb-3">Create Account</h1>
      <form onSubmit={handleSubmit} className="space-y-2">
        <input className="border w-full p-2 rounded" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
        <input className="border w-full p-2 rounded" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" />
        {err && <div className="text-red-600 text-sm">{err}</div>}
        <button className="bg-blue-600 text-white px-3 py-2 rounded w-full">Create Account</button>
      </form>
      <div className="text-sm mt-3">
        Have an account? <Link to="/login" className="underline">Login</Link>
      </div>
    </div>
  );
}
