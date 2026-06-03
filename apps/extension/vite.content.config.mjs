import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(root, "src/content/index.tsx"),
      output: {
        inlineDynamicImports: true,
        entryFileNames: "assets/content.js",
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css") ? "assets/content.css" : "assets/[name].[ext]"
      }
    }
  }
});
