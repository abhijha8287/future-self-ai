import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  plugins: [react()],
  build: {
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, "src/content/index.tsx"),
      output: {
        inlineDynamicImports: true,
        entryFileNames: "assets/content.js",
        assetFileNames: (assetInfo) => assetInfo.name?.endsWith(".css") ? "assets/content.css" : "assets/[name].[ext]"
      }
    }
  }
});
