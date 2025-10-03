import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { resetPassword } from "../services/api";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!token) {
      setMsg("Invalid or missing reset token.");
      return;
    }

    if (password !== confirmPassword) {
      setMsg("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await resetPassword(token, password);
      if (res.ok) {
        setSuccess(true);
        setMsg("Password updated successfully!");
      } else {
        setMsg(res.error || "Reset failed.");
      }
    } catch (error) {
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <Card className="text-center py-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
              <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Invalid Reset Link</h3>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired.
            </p>
            <Button as={Link} to="/forgot-password" variant="primary">
              Request New Reset Link
            </Button>
          </Card>
        </div>
      </div>
    );
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
            <Card.Title className="text-center">Set new password</Card.Title>
            <Card.Description className="text-center">
              Enter your new password below
            </Card.Description>
          </Card.Header>

          {success ? (
            <Card.Content>
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Password Updated</h3>
                <p className="text-gray-600 mb-6">
                  Your password has been successfully updated.
                </p>
                <Button as={Link} to="/login" variant="primary" className="w-full">
                  Sign In
                </Button>
              </div>
            </Card.Content>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  New Password
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
                    placeholder="Enter new password"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm New Password
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
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

              {msg && (
                <div className={`rounded-md p-4 ${
                  success ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className={`text-sm ${
                    success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {msg}
                  </div>
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
                  {loading ? "Updating..." : "Update Password"}
                </Button>
              </div>
            </form>
          )}

          <Card.Footer>
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-blue-600 hover:text-blue-500"
              >
                Back to Sign In
              </Link>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
