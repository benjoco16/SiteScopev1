import { useEffect, useState } from "react";
import { getSites, deleteSite, checkNow, getLogs } from "../services/api";
import Card from "./ui/Card";
import Button from "./ui/Button";
import Badge from "./ui/Badge";

export default function MonitorList() {
  const [sites, setSites] = useState([]);
  const [open, setOpen] = useState(null);   // site id for log panel
  const [logs, setLogs] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // site id for delete confirmation

  async function loadSites() {
    try {
      setLoading(true);
      const { data } = await getSites();
      setSites(data);
    } catch (error) {
      console.error("Failed to load sites:", error);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => { loadSites(); }, []);

  function handleDeleteClick(id) {
    setDeleteConfirm(id);
  }

  function handleDeleteCancel() {
    setDeleteConfirm(null);
  }

  async function handleDeleteConfirm(id) {
    try {
      const res = await deleteSite(id);
      if (res.ok) {
        setSites(sites.filter((s) => s.id !== id));
        setDeleteConfirm(null);
      } else {
        alert(res.error || "Delete failed");
      }
    } catch (error) {
      alert("Delete failed: " + error.message);
    }
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
    try {
      const { data } = await getLogs(id, 50);
      setLogs(data);
    } catch (error) {
      console.error("Failed to load logs:", error);
      setLogs([]);
    }
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

  function getStatusBadgeVariant(status) {
    switch (status) {
      case "UP":
        return "success";
      case "DOWN":
        return "danger";
      case "UNKNOWN":
        return "default";
      default:
        return "default";
    }
  }

  function formatLastChecked(lastChecked) {
    if (!lastChecked) return "Never";
    const date = new Date(lastChecked);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading sites...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Monitored Sites</h2>
          <p className="text-gray-600">Track your website uptime and performance</p>
        </div>
        <Button 
          variant="outline"
          onClick={loadSites}
        >
          Refresh
        </Button>
      </div>

      {sites.length === 0 ? (
        <Card className="text-center py-12">
          <div className="text-6xl mb-4">🌐</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No sites being monitored yet</h3>
          <p className="text-gray-600">Add your first site above to start monitoring!</p>
        </Card>
      ) : (
        <div className="grid gap-6">
          {sites.map(site => (
            <Card key={site.id} className="hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {site.url}
                    </h3>
                    <Badge variant={getStatusBadgeVariant(site.status)}>
                      {site.status}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-2">
                    <div className="flex items-center space-x-4">
                      <span>Last checked: {formatLastChecked(site.last_checked)}</span>
                      {site.last_code && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          HTTP {site.last_code}
                        </span>
                      )}
                    </div>
                    
                    {site.alert_emails && site.alert_emails.length > 0 && (
                      <div className="flex items-center space-x-2">
                        <span className="text-gray-500">Alert emails:</span>
                        <div className="flex flex-wrap gap-1">
                          {site.alert_emails.map((email, index) => (
                            <Badge key={index} variant="info" size="sm">
                              {email}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 ml-4">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => toggleLogs(site.id)}
                  >
                    {open === site.id ? "Hide Logs" : "View Logs"}
                  </Button>
                  <Button 
                    variant="primary"
                    size="sm"
                    onClick={() => handleCheckNow(site.id)} 
                    disabled={busyId === site.id}
                  >
                    {busyId === site.id ? "Checking..." : "Check Now"}
                  </Button>
                  {deleteConfirm === site.id ? (
                    <div className="flex space-x-1">
                      <Button 
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteConfirm(site.id)}
                      >
                        Confirm
                      </Button>
                      <Button 
                        variant="secondary"
                        size="sm"
                        onClick={handleDeleteCancel}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <Button 
                      variant="danger"
                      size="sm"
                      onClick={() => handleDeleteClick(site.id)}
                    >
                      Delete
                    </Button>
                  )}
                </div>
              </div>

              {open === site.id && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4">Recent Activity</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left border-b border-gray-200">
                          <th className="py-2 font-medium text-gray-700">Time</th>
                          <th className="py-2 font-medium text-gray-700">Status</th>
                          <th className="py-2 font-medium text-gray-700">HTTP Code</th>
                          <th className="py-2 font-medium text-gray-700">Response Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {logs.map((log, i) => (
                          <tr key={i} className="border-b border-gray-100 last:border-0">
                            <td className="py-2 text-gray-600">
                              {new Date(log.checked_at).toLocaleString()}
                            </td>
                            <td className="py-2">
                              <Badge variant={getStatusBadgeVariant(log.status)} size="sm">
                                {log.status}
                              </Badge>
                            </td>
                            <td className="py-2 text-gray-600">
                              {log.code ?? "—"}
                            </td>
                            <td className="py-2 text-gray-600">
                              {log.ms ? `${log.ms}ms` : "—"}
                            </td>
                          </tr>
                        ))}
                        {logs.length === 0 && (
                          <tr>
                            <td colSpan="4" className="py-4 text-center text-gray-500">
                              No activity logs yet.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
