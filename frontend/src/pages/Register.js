import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function Register() {
  const nav = useNavigate();
  const { register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setErr("");

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setErr("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await register(email, password);
      nav("/");
    } catch (error) {
      setErr(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">SiteScope</h1>
          <p className="mt-2 text-sm text-gray-600">Monitor your websites 24/7</p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="sm:px-10">
          <Card.Header>
            <Card.Title className="text-center">Create your account</Card.Title>
            <Card.Description className="text-center">
              Start monitoring your websites with instant alerts
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
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="mt-1">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
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
                {loading ? "Creating account..." : "Create account"}
              </Button>
            </div>
          </form>

          <Card.Footer>
            <div className="text-center">
              <span className="text-sm text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 hover:text-blue-500">
                  Sign in
                </Link>
              </span>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
