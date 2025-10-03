import { useState } from "react";
import { testNotification } from "../services/api";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function NotificationTest() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const testEmailNotification = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await testNotification("email");
      if (res.ok) {
        setMessage("✅ Test email notification sent! Check your inbox.");
      } else {
        setMessage("❌ Failed to send test email: " + res.error);
      }
    } catch (error) {
      setMessage("❌ Failed to send test email: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testPushNotification = async () => {
    setLoading(true);
    setMessage("");
    try {
      const res = await testNotification("push");
      if (res.ok) {
        setMessage("✅ Test push notification sent!");
      } else {
        setMessage("❌ Failed to send test push: " + res.error);
      }
    } catch (error) {
      setMessage("❌ Failed to send test push: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const testBrowserNotification = () => {
    if (Notification.permission === "granted") {
      new Notification("SiteScope Test", {
        body: "This is a test notification from SiteScope",
        icon: "/logo192.png"
      });
      setMessage("✅ Test browser notification sent!");
    } else {
      setMessage("❌ Browser notifications not enabled. Please enable them in your browser settings.");
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>Test Notifications</Card.Title>
        <Card.Description>
          Test your notification settings to ensure they're working properly
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email Test */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h4 className="font-medium text-gray-900">Email</h4>
            <p className="text-sm text-gray-600">Test email notifications</p>
            <Button
              variant="primary"
              size="sm"
              onClick={testEmailNotification}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Test Email"}
            </Button>
          </div>

          {/* Browser Test */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6zM4 5h6V1H4v4zM15 5h5V1h-5v4z"></path>
              </svg>
            </div>
            <h4 className="font-medium text-gray-900">Browser</h4>
            <p className="text-sm text-gray-600">Test browser notifications</p>
            <Button
              variant="success"
              size="sm"
              onClick={testBrowserNotification}
              className="w-full"
            >
              Test Browser
            </Button>
          </div>

          {/* Push Test */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
              </svg>
            </div>
            <h4 className="font-medium text-gray-900">Mobile Push</h4>
            <p className="text-sm text-gray-600">Test mobile push notifications</p>
            <Button
              variant="warning"
              size="sm"
              onClick={testPushNotification}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Sending..." : "Test Push"}
            </Button>
          </div>
        </div>

        {message && (
          <div className={`rounded-md p-3 ${
            message.includes("✅") ? 'bg-green-50' : 'bg-red-50'
          }`}>
            <div className={`text-sm ${
              message.includes("✅") ? 'text-green-700' : 'text-red-700'
            }`}>
              {message}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Email notifications are sent to your account email and any additional emails you configure</p>
          <p>• Browser notifications require permission and work on desktop and mobile browsers</p>
          <p>• Mobile push notifications require the SiteScope mobile app to be installed</p>
        </div>
      </Card.Content>
    </Card>
  );
}
