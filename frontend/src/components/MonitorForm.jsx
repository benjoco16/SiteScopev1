import { useState } from "react";
import { addSite } from "../services/api";
import Card from "./ui/Card";
import Button from "./ui/Button";

export default function MonitorForm({ onSiteAdded }) {
  const [url, setUrl] = useState("");
  const [alertEmails, setAlertEmails] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    
    try {
      // Parse alert emails from comma-separated string
      const emails = alertEmails
        .split(',')
        .map(email => email.trim())
        .filter(email => email && email.includes('@'));

      const { data } = await addSite(url, emails);
      onSiteAdded(data);
      setUrl("");
      setAlertEmails("");
    } catch (error) {
      setErr(error.message || "Add failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="mb-6">
      <Card.Header>
        <Card.Title>Add New Site to Monitor</Card.Title>
        <Card.Description>
          Start monitoring a website and receive instant alerts when it goes down
        </Card.Description>
      </Card.Header>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
            Website URL
          </label>
          <input 
            id="url"
            type="url"
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={url} 
            onChange={e => setUrl(e.target.value)} 
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div>
          <label htmlFor="alertEmails" className="block text-sm font-medium text-gray-700 mb-1">
            Alert Emails (Optional)
          </label>
          <input 
            id="alertEmails"
            type="text"
            className="w-full border border-gray-300 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
            value={alertEmails} 
            onChange={e => setAlertEmails(e.target.value)} 
            placeholder="admin@company.com, alerts@company.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate multiple emails with commas. Alerts will be sent to your account email plus these additional addresses.
          </p>
        </div>

        {err && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="text-sm text-red-700">{err}</div>
          </div>
        )}

        <Button 
          type="submit"
          variant="primary"
          disabled={busy || !url}
          className="w-full sm:w-auto"
        >
          {busy ? "Adding..." : "Add Site"}
        </Button>
      </form>
    </Card>
  );
}
