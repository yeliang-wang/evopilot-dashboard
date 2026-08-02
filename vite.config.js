import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    strictPort: false,
    proxy: {
      "/api": {
        target: process.env.EVOPILOT_API_BASE_URL || "http://127.0.0.1:19876",
        changeOrigin: true
      },
      "/health": {
        target: process.env.EVOPILOT_API_BASE_URL || "http://127.0.0.1:19876",
        changeOrigin: true
      },
      "/ready": {
        target: process.env.EVOPILOT_API_BASE_URL || "http://127.0.0.1:19876",
        changeOrigin: true
      }
    }
  }
});
