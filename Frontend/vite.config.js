import path from "path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  define: {
    "process.env.IS_PREACT": JSON.stringify("true"),
  },
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  server: {
    proxy: {
      '/excalidraw-assets': {
        target: 'https://unpkg.com/@excalidraw/excalidraw@0.17.6/dist/excalidraw-assets-dev/',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/excalidraw-assets/, '')
      }
    }
  }
  
});
