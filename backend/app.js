import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());          // <--- allow frontend requests
app.use(express.json());

app.post("/ping", async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ status: "error", message: "URL required" });
  }

  try {
    const response = await fetch(url, { method: "GET" });
    if (response.ok) {
      return res.json({ status: "UP", code: response.status });
    } else {
      return res.json({ status: "DOWN", code: response.status });
    }
  } catch (err) {
    return res.json({ status: "DOWN", error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});
