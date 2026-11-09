// Standalone GreenRoots Backend HTTP Server
// Runs on port 54321 (or PORT env) and connects to greenroots.db.

import http from "node:http";
import { handleApiRequest } from "./api.js";

const PORT = process.env.PORT || 54321;

const server = http.createServer(async (req, res) => {
  const urlObj = new URL(req.url, `http://localhost:${PORT}`);
  const apiPath = urlObj.pathname.replace(/^\/?functions\/v1\/?/, "");
  const query = Object.fromEntries(urlObj.searchParams.entries());

  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    return res.end();
  }

  let body = {};
  if (req.method === "POST" || req.method === "PUT") {
    try {
      const buffers = [];
      for await (const chunk of req) buffers.push(chunk);
      const dataStr = Buffer.concat(buffers).toString("utf-8");
      body = dataStr ? JSON.parse(dataStr) : {};
    } catch {
      body = {};
    }
  }

  try {
    const result = await handleApiRequest(apiPath, req.method, body, query);
    res.statusCode = 200;
    return res.end(JSON.stringify(result));
  } catch (err) {
    console.error(`[Server Error] ${req.method} ${apiPath}:`, err.message);
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: err.message }));
  }
});

server.listen(PORT, () => {
  console.log(`GreenRoots Backend API running at http://localhost:${PORT}/functions/v1/`);
});

