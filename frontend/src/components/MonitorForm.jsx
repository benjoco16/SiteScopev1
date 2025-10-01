import { useState } from "react";
import { addSite } from "../services/api";

export default function MonitorForm({ onSiteAdded }) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const { data } = await addSite(url);
      onSiteAdded(data);       // return full site row from backend
      setUrl("");
    } catch {
      setErr("Add failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-x-2">
      <input className="border px-2 py-1 rounded" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://example.com" />
      <button className="bg-blue-600 text-white px-3 py-1 rounded" disabled={busy || !url}>
        {busy ? "Adding..." : "Add"}
      </button>
      {err && <span className="text-sm text-red-600 ml-2">{err}</span>}
    </form>
  );
}
