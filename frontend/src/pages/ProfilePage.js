import { useEffect, useState } from "react";
import { getProfile } from "../services/api";
import { Link } from "react-router-dom";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";
import DashboardLayout from "../components/layout/DashboardLayout";
import NotificationSettings from "../components/NotificationSettings";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    getProfile().then(res => {
      if (res.ok) setProfile(res.data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleLogout = () => {
    logout();
    localStorage.removeItem("push_registered_v1");
    navigate("/login");
  };

  if (loading) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Loading profile...</span>
        </div>
      </DashboardLayout>
    );
  }

  if (!profile) {
    return (
      <DashboardLayout onLogout={handleLogout}>
        <Card className="text-center py-8">
          <p className="text-gray-600">Failed to load profile</p>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout onLogout={handleLogout}>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
          <p className="text-gray-600">Manage your account settings and preferences</p>
        </div>

        <Card>
          <Card.Header>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-2xl text-blue-600">
                  {profile.username ? profile.username.charAt(0).toUpperCase() : profile.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <Card.Title>{profile.username || "No username set"}</Card.Title>
                <Card.Description>{profile.email}</Card.Description>
              </div>
            </div>
          </Card.Header>

          <Card.Content>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Plan
                </label>
                <Badge variant="info">
                  {profile.plan || "Free"}
                </Badge>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number
                </label>
                <p className="text-gray-900">
                  {profile.contact_number || "Not provided"}
                </p>
              </div>

              {profile.alert_emails && profile.alert_emails.length > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Alert Emails
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {profile.alert_emails.map((email, index) => (
                      <Badge key={index} variant="info" size="sm">
                        {email}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card.Content>

          <Card.Footer>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
              <Button as={Link} to="/edit-profile" variant="primary">
                Edit Profile
              </Button>
              <Button variant="outline" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </Card.Footer>
        </Card>

        {/* Notification Settings */}
        <NotificationSettings />
      </div>
    </DashboardLayout>
  );
}
