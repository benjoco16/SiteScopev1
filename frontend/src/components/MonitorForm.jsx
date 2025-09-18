import { useState } from "react";
import { addSite } from "../services/api";

export default function MonitorForm({ onSiteAdded }) {
  const [url, setUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url) return;
    const result = await addSite(url);
    onSiteAdded(url, result);
    setUrl("");
  };

  return (
    <form onSubmit={handleSubmit} className="space-x-2">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter website URL"
        className="border px-2 py-1 rounded"
      />
      <button
        type="submit"
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        Add
      </button>
    </form>
  );
}
