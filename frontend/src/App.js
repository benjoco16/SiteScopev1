import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { requestPermissionAndToken, onForegroundMessage } from "./firebase";
import { api } from "./services/api";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import ProfilePage from "./pages/ProfilePage";      // ✅ added
import EditProfilePage from "./pages/EditProfilePage"; 
import MonitorForm from "./components/MonitorForm";
import MonitorList from "./components/MonitorList";
import NotificationTest from "./components/NotificationTest";
import DashboardLayout from "./components/layout/DashboardLayout";
import { useEffect, useState } from "react";
import { logout } from "./services/api";

async function registerPushTokenOnce() {
  const already = localStorage.getItem("push_registered_v1");
  const jwt = localStorage.getItem("token");
  if (!jwt) return; // only register for logged-in users

  // you can skip this guard if your backend uses ON CONFLICT on token
  if (already) return;

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

function Dashboard() {
  const [bump, setBump] = useState(0);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();              // remove token from localStorage
    localStorage.removeItem("push_registered_v1"); // so next login re-registers
    navigate("/login");    // redirect to login
  };

      return (
        <DashboardLayout onLogout={handleLogout}>
          <div className="space-y-6">
            <MonitorForm onSiteAdded={() => setBump(v => v + 1)} />
            <NotificationTest />
            <MonitorList key={bump}/>
          </div>
        </DashboardLayout>
      );
}

export default function App() {
  useEffect(() => {
    // run on every app load for users with persisted sessions
    registerPushTokenOnce();
   // optional: handle messages while the app is open
   onForegroundMessage((p) => {
    console.log("Foreground push:", p);
      if (Notification.permission === "granted") {
        new Notification(p.notification.title, { body: p.notification.body });
      }
    });

  }, []);
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
           <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/edit-profile"
              element={
                <ProtectedRoute>
                  <EditProfilePage />
                </ProtectedRoute>
              }
            />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
