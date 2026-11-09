import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const apiTarget = process.env.API_PROXY_TARGET || "http://localhost:8080";

const proxy = {
  "/api": {
    target: apiTarget,
    changeOrigin: true,
    rewrite: (path) => path.replace(/^\/api/, ""),
  },
};

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy,
    watch: process.env.DOCKER ? { usePolling: true } : undefined,
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    proxy,
  },
});
