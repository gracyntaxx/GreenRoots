import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { greenrootsBackendPlugin } from "./server/vitePlugin.js";

export default defineConfig({
  plugins: [react(), greenrootsBackendPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: { port: 5173, host: true },
});
