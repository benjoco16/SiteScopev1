import { useState } from "react";

function App() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);

  const handlePing = async () => {
    try {
      const res = await fetch("http://localhost:4000/ping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ status: "error", message: err.message });
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>SiteScope - Ping Test</h1>
      <input
        type="text"
        placeholder="Enter URL (e.g. https://google.com)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        style={{ padding: "0.5rem", width: "300px" }}
      />
      <button
        onClick={handlePing}
        style={{ marginLeft: "1rem", padding: "0.5rem 1rem" }}
      >
        Ping
      </button>

      {result && (
        <div style={{ marginTop: "1rem" }}>
          <strong>Status:</strong> {result.status}{" "}
          {result.code && `(HTTP ${result.code})`}
          {result.error && <p>Error: {result.error}</p>}
        </div>
      )}
    </div>
  );
}

export default App;
