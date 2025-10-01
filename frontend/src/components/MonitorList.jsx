import { useEffect, useState } from "react";
import { getSites, deleteSite, checkNow, getLogs } from "../services/api";

export default function MonitorList() {
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(null);   // site id for log panel
  const [logs, setLogs] = useState([]);
  const [busyId, setBusyId] = useState(null);

  async function loadSites() {
    const { data } = await getSites();
    setSites(data);
  }
  useEffect(() => { loadSites(); }, []);

  async function handleDelete(id) {
    await deleteSite(id);
    setSites(sites.filter(s => s.id !== id));
  }
  async function handleCheckNow(id) {
    setBusyId(id);
    try {
      await checkNow(id);
      await loadSites();
      if (open === id) await loadLogs(id);
    } finally {
      setBusyId(null);
    }
  }
  async function loadLogs(id) {
    const { data } = await getLogs(id, 50);
    setLogs(data);
  }
  async function toggleLogs(id) {
    if (open === id) {
      setOpen(null);
      setLogs([]);
    } else {
      setOpen(id);
      await loadLogs(id);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      {sites.map(s => (
        <div key={s.id} className="border rounded p-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">{s.url}</div>
              <div className="text-sm opacity-70">
                Status: {s.status} {s.last_code ? `(HTTP ${s.last_code})` : ""} • Last Checked: {s.last_checked ? new Date(s.last_checked).toLocaleString() : "—"}
              </div>
            </div>
            <div className="space-x-2">
              <button className="px-2 py-1 border rounded" onClick={() => toggleLogs(s.id)}>Logs</button>
              <button className="px-2 py-1 border rounded" onClick={() => handleCheckNow(s.id)} disabled={busyId === s.id}>
                {busyId === s.id ? "Checking..." : "Check Now"}
              </button>
              <button className="px-2 py-1 border rounded text-red-600" onClick={() => handleDelete(s.id)}>Delete</button>
            </div>
          </div>

          {open === s.id && (
            <div className="mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b">
                    <th className="py-1">Time</th>
                    <th className="py-1">Status</th>
                    <th className="py-1">HTTP</th>
                    <th className="py-1">Latency (ms)</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((l, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="py-1">{new Date(l.checked_at).toLocaleString()}</td>
                      <td className="py-1">{l.status}</td>
                      <td className="py-1">{l.code ?? "—"}</td>
                      <td className="py-1">{l.ms ?? "—"}</td>
                    </tr>
                  ))}
                  {logs.length === 0 && (
                    <tr><td colSpan="4" className="py-2 opacity-60">No logs yet.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
      {sites.length === 0 && <div className="opacity-70 text-sm">No sites yet.</div>}
    </div>
  );
}
