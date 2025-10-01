import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./context/ProtectedRoute";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import MonitorForm from "./components/MonitorForm";
import MonitorList from "./components/MonitorList";
import { useState } from "react";

function Dashboard() {
  const [, setBump] = useState(0);
  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-2xl mb-3">SiteScope</h1>
      <MonitorForm onSiteAdded={() => setBump(v => v + 1)} />
      <MonitorList />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login/>} />
          <Route path="/register" element={<Register/>} />
          <Route path="/" element={<ProtectedRoute><Dashboard/></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
