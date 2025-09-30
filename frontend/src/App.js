import { useState, useEffect } from "react";
import MonitorForm from "./components/MonitorForm";
import MonitorList from "./components/MonitorList";
import { ensureNotifyPermission } from "./services/notifications";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    ensureNotifyPermission();
  }, []);

  const handleSiteAdded = () => setRefreshKey((k) => k + 1);

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">🌐 SiteScope</h1>
      <MonitorForm onSiteAdded={handleSiteAdded} />
      <MonitorList refreshKey={refreshKey} />
    </div>
  );
}
