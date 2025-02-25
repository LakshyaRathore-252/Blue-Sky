import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"), // Ensures `@/` points to `src/`
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "https://blue-sky-9hmx.onrender.com",
        changeOrigin: true,
      },
    },
  },
});
