import { useState } from "react";
import { forgotPassword } from "../services/api";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
        setSuccess(true);
        setMsg("Check your email for a reset link.");
      } else {
        setMsg(res.error || "Email not found.");
      }
    } catch (err) {
      console.error(err);
      setMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
            <Card.Title className="text-center">Reset your password</Card.Title>
            <Card.Description className="text-center">
              Enter your email address and we'll send you a reset link
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
                <h3 className="text-lg font-medium text-gray-900 mb-2">Check your email</h3>
                <p className="text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{email}</strong>
                </p>
                <Button as={Link} to="/login" variant="primary" className="w-full">
                  Back to Sign In
                </Button>
              </div>
            </Card.Content>
          ) : (
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
                  {loading ? "Sending..." : "Send Reset Link"}
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
                Remember your password? Sign in
              </Link>
            </div>
          </Card.Footer>
        </Card>
      </div>
    </div>
  );
}
