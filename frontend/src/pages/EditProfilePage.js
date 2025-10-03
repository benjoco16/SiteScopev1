import { useEffect, useState } from "react";
import { getProfile, updateProfile } from "../services/api";
import { useNavigate } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import DashboardLayout from "../components/layout/DashboardLayout";
import { useAuth } from "../context/AuthContext";

export default function EditProfilePage() {
  const [form, setForm] = useState({
    username: "",
    image_url: "",
    contact_number: "",
    plan: "free",
    alert_emails: []
  });
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    getProfile().then(res => {
      if (res.ok) {
        setForm({
          username: res.data.username || "",
          image_url: res.data.image_url || "",
          contact_number: res.data.contact_number || "",
          plan: res.data.plan || "free",
          alert_emails: res.data.alert_emails || []
        });
      }
      setLoadingProfile(false);
    }).catch(() => {
      setLoadingProfile(false);
    });
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("push_registered_v1");
    navigate("/login");
  };

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      const res = await updateProfile(form);
      if (res.ok) {
        setMsg("Profile updated successfully!");
        setTimeout(() => navigate("/profile"), 1500);
      } else {
        setMsg(res.error || "Update failed");
      }
    } catch (error) {
      setMsg("Update failed: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  const addAlertEmail = () => {
    setForm({
      ...form,
      alert_emails: [...form.alert_emails, ""]
    });
  };

  const updateAlertEmail = (index, value) => {
    const newEmails = [...form.alert_emails];
    newEmails[index] = value;
    setForm({ ...form, alert_emails: newEmails });
  };

  const removeAlertEmail = (index) => {
    const newEmails = form.alert_emails.filter((_, i) => i !== index);
    setForm({ ...form, alert_emails: newEmails });
  };

  if (loadingProfile) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
          <p className="text-gray-600">Update your account information and notification preferences</p>
        </div>

        <Card>
          <Card.Header>
            <Card.Title>Profile Information</Card.Title>
            <Card.Description>
              Update your personal details and contact information
            </Card.Description>
          </Card.Header>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  placeholder="Enter your username"
                />
              </div>

              <div>
                <label htmlFor="contact_number" className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <input
                  id="contact_number"
                  type="tel"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.contact_number}
                  onChange={e => setForm({ ...form, contact_number: e.target.value })}
                  placeholder="Enter your phone number"
                />
              </div>

              <div>
                <label htmlFor="image_url" className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Image URL
                </label>
                <input
                  id="image_url"
                  type="url"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://example.com/your-image.jpg"
                />
              </div>

              <div>
                <label htmlFor="plan" className="block text-sm font-medium text-gray-700 mb-1">
                  Plan
                </label>
                <select
                  id="plan"
                  className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={form.plan}
                  onChange={e => setForm({ ...form, plan: e.target.value })}
                >
                  <option value="free">Free</option>
                  <option value="pro">Pro</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Alert Email Addresses
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAlertEmail}
                >
                  Add Email
                </Button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Add additional email addresses to receive website downtime notifications
              </p>
              
              {form.alert_emails.map((email, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="email"
                    className="flex-1 border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={email}
                    onChange={e => updateAlertEmail(index, e.target.value)}
                    placeholder="Enter email address"
                  />
                  <Button
                    type="button"
                    variant="danger"
                    size="sm"
                    onClick={() => removeAlertEmail(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              {form.alert_emails.length === 0 && (
                <p className="text-sm text-gray-500 italic">No additional alert emails configured</p>
              )}
            </div>

            {msg && (
              <div className={`rounded-md p-4 ${
                msg.includes("successfully") ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className={`text-sm ${
                  msg.includes("successfully") ? 'text-green-700' : 'text-red-700'
                }`}>
                  {msg}
                </div>
              </div>
            )}

            <Card.Footer>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                <Button
                  type="submit"
                  variant="primary"
                  disabled={loading}
                >
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/profile")}
                >
                  Cancel
                </Button>
              </div>
            </Card.Footer>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
