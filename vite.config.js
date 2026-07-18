import { defineConfig } from "vite";

export default defineConfig({
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
