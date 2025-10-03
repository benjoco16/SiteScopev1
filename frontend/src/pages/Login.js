import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { requestPermissionAndToken } from "../firebase";
import { api } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Login() {
  const nav = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function registerAfterLogin() {
    const token = await requestPermissionAndToken();
    if (token) {
      await api("/save-token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      localStorage.setItem("push_registered_v1", "1");
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");
    
    try {
      await login(email, password);
      await registerAfterLogin();
      nav("/");
    } catch (e) {
      setErr(e?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SiteScope</h1>
          <p className="mt-2 text-sm text-gray-600">24/7 Website Monitoring</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="sm:px-10">
          <Card.Header>
            <Card.Title className="text-center">Sign in to your account</Card.Title>
            <Card.Description className="text-center">
              Monitor your websites around the clock
            </Card.Description>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>

            {err && (
              <div className="rounded-md bg-red-50 p-4">
                <div className="text-sm text-red-700">{err}</div>
              </div>
            )}

            <div>
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={loading}
                className="w-full"
              >
                {loading ? "Signing in..." : "Sign in"}
              </Button>
            </div>
          </form>

          <Card.Footer>
            <div className="flex flex-col space-y-3 sm:flex-row sm:justify-between sm:space-y-0">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-500 text-center sm:text-left"
              >
                Forgot your password?
              </Link>
              <Link
                to="/register"
                className="text-sm text-gray-600 hover:text-gray-500 text-center sm:text-right"
              >
                Don't have an account? Sign up
              </Link>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
