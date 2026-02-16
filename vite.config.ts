import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
    proxy: {
      "/api/thesportsdb": {
        target: "https://www.thesportsdb.com",
        changeOrigin: true,
        rewrite: (path) => "/api/v1/json/123" + path.replace(/^\/api\/thesportsdb/, ""),
        secure: true,
      },
      "/api/proxy-stream": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/get-live-stream": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/get-match-streams": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
      "/api/admin": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
