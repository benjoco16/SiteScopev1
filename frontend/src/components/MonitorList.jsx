import { useEffect, useRef, useState } from "react";
import { notifyStatus } from "../services/notifications";
import { checkNow, testAlert } from "../services/api";

export default function MonitorList({ refreshKey }) {
  const [sites, setSites] = useState([]);
  const [busy, setBusy] = useState(null); // url currently running an action
  const prevStatusRef = useRef(new Map()); // url -> status

  async function loadStatus() {
    try {
      const res = await fetch("http://localhost:4000/status");
      const data = await res.json();

      const nextMap = new Map();
      data.forEach((s) => {
        const prev = prevStatusRef.current.get(s.url);
        if (prev && prev !== s.status) notifyStatus(s.url, s.status);
        nextMap.set(s.url, s.status);
      });

      prevStatusRef.current = nextMap;
      setSites(data);
    } catch (e) {
      console.error("Failed to load status:", e);
    }
  }

  useEffect(() => { loadStatus(); }, [refreshKey]);
  useEffect(() => {
    const id = setInterval(loadStatus, 10_000);
    return () => clearInterval(id);
  }, []);

  const onCheckNow = async (url) => {
    setBusy(url);
    try {
      await checkNow(url);
      await loadStatus();
    } catch (e) {
      console.error(e);
      alert("Check failed. See console.");
    } finally {
      setBusy(null);
    }
  };

  const onForce = async (url, status) => {
    setBusy(url);
    try {
      await testAlert(url, status);
      alert(`Forced ${status} email sent for ${url}`);
    } catch (e) {
      console.error(e);
      alert("Force email failed. See console.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mt-4">
      <h2 className="font-semibold mb-2">Monitored Sites</h2>
      <ul className="space-y-3">
        {sites.map((s) => (
          <li key={s.url} className="rounded border p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{s.url}</div>
                <div className="text-xs text-gray-500">
                  Last: {s.last_checked ? new Date(s.last_checked).toLocaleString() : "—"}
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded text-sm ${
                s.status === "UP" ? "bg-green-100 text-green-700"
                : s.status === "DOWN" ? "bg-red-100 text-red-700"
                : "bg-gray-100 text-gray-700"
              }`}>
                {s.status}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                onClick={() => onCheckNow(s.url)}
                disabled={busy === s.url}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
              >
                {busy === s.url ? "Checking…" : "Check Now"}
              </button>
              <button
                onClick={() => onForce(s.url, "DOWN")}
                disabled={busy === s.url}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                title="Sends a test email without ping"
              >
                Force DOWN email
              </button>
              <button
                onClick={() => onForce(s.url, "UP")}
                disabled={busy === s.url}
                className="px-3 py-1 rounded border hover:bg-gray-50 disabled:opacity-50"
                title="Sends a test email without ping"
              >
                Force UP email
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
