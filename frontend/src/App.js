import { useState } from "react";
import MonitorForm from "./components/MonitorForm";
import MonitorList from "./components/MonitorList";

export default function App() {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSiteAdded = () => {
    setRefreshKey((prev) => prev + 1); // force list refresh
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">🌐 SiteScope</h1>
      <MonitorForm onSiteAdded={handleSiteAdded} />
      <MonitorList refreshKey={refreshKey} />
    </div>
  );
}
