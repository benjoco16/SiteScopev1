import { useState, useEffect } from "react";
import { requestPermissionAndToken, onForegroundMessage } from "../firebase";
import { api, testNotification } from "../services/api";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function NotificationSettings() {
  const [permission, setPermission] = useState(Notification.permission);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Check current permission status
    setPermission(Notification.permission);
    
    // Listen for foreground messages
    onForegroundMessage((payload) => {
      console.log("Foreground notification received:", payload);
      if (Notification.permission === "granted") {
        new Notification(payload.notification.title, {
          body: payload.notification.body,
          icon: "/logo192.png"
        });
      }
    });
  }, []);

  const requestNotificationPermission = async () => {
    setLoading(true);
    setMessage("");

    try {
      if (!("Notification" in window)) {
        setMessage("This browser does not support notifications");
        setLoading(false);
        return;
      }

      let permission = Notification.permission;
      
      if (permission === "default") {
        permission = await Notification.requestPermission();
      }

      setPermission(permission);

      if (permission === "granted") {
        // Get FCM token
        const fcmToken = await requestPermissionAndToken();
        
        if (fcmToken) {
          // Save token to backend
          await api("/save-token", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: fcmToken }),
          });
          
          setToken(fcmToken);
          setMessage("✅ Notifications enabled successfully!");
          localStorage.setItem("push_registered_v1", "1");
        } else {
          setMessage("❌ Failed to get notification token");
        }
      } else if (permission === "denied") {
        setMessage("❌ Notifications blocked. Please enable them in your browser settings.");
      }
    } catch (error) {
      console.error("Notification setup error:", error);
      setMessage("❌ Failed to setup notifications: " + error.message);
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
      setMessage("❌ Notifications not enabled");
    }
  };

  const testEmailNotification = async () => {
    setLoading(true);
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

  const getPermissionStatus = () => {
    switch (permission) {
      case "granted":
        return { variant: "success", text: "Enabled" };
      case "denied":
        return { variant: "danger", text: "Blocked" };
      default:
        return { variant: "warning", text: "Not Set" };
    }
  };

  const status = getPermissionStatus();

  return (
    <Card>
      <Card.Header>
        <Card.Title>Notification Settings</Card.Title>
        <Card.Description>
          Configure how you receive website downtime alerts
        </Card.Description>
      </Card.Header>

      <Card.Content className="space-y-6">
        {/* Browser Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Browser Notifications</h4>
              <p className="text-sm text-gray-600">
                Receive popup notifications in your browser
              </p>
            </div>
            <Badge variant={status.variant}>{status.text}</Badge>
          </div>

          {permission === "granted" ? (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={testBrowserNotification}
              >
                Test Browser Notification
              </Button>
            </div>
          ) : (
            <Button
              variant="primary"
              size="sm"
              onClick={requestNotificationPermission}
              disabled={loading}
            >
              {loading ? "Setting up..." : "Enable Notifications"}
            </Button>
          )}
        </div>

        {/* Email Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">
                Always enabled for your account email and any additional emails you configure
              </p>
            </div>
            <Badge variant="success">Enabled</Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={testEmailNotification}
            disabled={loading}
          >
            Test Email Notification
          </Button>
        </div>

        {/* Mobile Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Mobile Notifications</h4>
              <p className="text-sm text-gray-600">
                Push notifications on iOS and Android devices
              </p>
            </div>
            <Badge variant={token ? "success" : "warning"}>
              {token ? "Enabled" : "Not Configured"}
            </Badge>
          </div>
          {token && (
            <Button
              variant="outline"
              size="sm"
              onClick={testPushNotification}
              disabled={loading}
            >
              Test Push Notification
            </Button>
          )}
        </div>

        {message && (
          <div className={`rounded-md p-3 ${
            message.includes("✅") ? 'bg-green-50' : 
            message.includes("❌") ? 'bg-red-50' : 'bg-blue-50'
          }`}>
            <div className={`text-sm ${
              message.includes("✅") ? 'text-green-700' : 
              message.includes("❌") ? 'text-red-700' : 'text-blue-700'
            }`}>
              {message}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>• Browser notifications work on desktop and mobile browsers</p>
          <p>• Email notifications are sent to your account email and any additional emails you add</p>
          <p>• Mobile push notifications require the SiteScope mobile app</p>
        </div>
      </Card.Content>
    </Card>
  );
}
