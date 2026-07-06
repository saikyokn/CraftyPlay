import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  /** 静的ホスティング向け: 相対パスで dist/ をそのまま配信可能 */
  base: "./",
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ["@monaco-editor/react"],
        },
      },
    },
  },
  optimizeDeps: {
    include: ["@monaco-editor/react"],
  },
});
