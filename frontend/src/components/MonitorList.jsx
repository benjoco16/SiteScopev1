import { useEffect, useState } from "react";
import { getStatus } from "../services/api";

export default function MonitorList({ refreshKey }) {
  const [sites, setSites] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      const data = await getStatus();
      setSites(data);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000); // refresh every 5s
    return () => clearInterval(interval);
  }, [refreshKey]);

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div>
      <h2 className="font-bold text-lg mb-2">Monitored Sites</h2>
      <ul>
        {Object.entries(sites).map(([url, info]) => (
          <li key={url} className="mb-2">
            <strong>{url}</strong> →{" "}
            <span
              className={
                info.status === "UP" ? "text-green-600 font-semibold" : "text-red-600 font-semibold"
              }
            >
              {info.status === "UP" ? "✅ UP" : "❌ DOWN"}
            </span>
            <br />
            <small className="text-gray-500">
              Last checked: {formatDate(info.last_checked)}
            </small>
          </li>
        ))}
      </ul>
    </div>
  );
}
