// Vite Plugin that integrates the real GreenRoots SQLite backend directly into the dev server.
import { handleApiRequest } from "./api.js";

export function greenrootsBackendPlugin() {
  return {
    name: "greenroots-backend",
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url && req.url.includes("/functions/v1")) {
          // Extract path after /functions/v1/
          const urlObj = new URL(req.url, "http://localhost:5173");
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
              for await (const chunk of req) {
                buffers.push(chunk);
              }
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
            console.error(`[API Error] ${req.method} ${apiPath}:`, err.message);
            res.statusCode = 400;
            return res.end(JSON.stringify({ error: err.message }));
          }
        }
        next();
      });
    },
  };
}

