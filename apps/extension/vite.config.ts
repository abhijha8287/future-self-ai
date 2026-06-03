import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig(({ mode }) => {
  const isContentBuild = mode === "content";
  const contentOptions = {
    input: resolve(__dirname, "src/content/index.tsx"),
    output: {
      inlineDynamicImports: true,
      entryFileNames: "assets/content.js",
      assetFileNames: (assetInfo: { name?: string }) => assetInfo.name?.endsWith(".css") ? "assets/content.css" : "assets/[name].[ext]"
    }
  };
  const appOptions = {
    input: {
      popup: resolve(__dirname, "index.html"),
      background: resolve(__dirname, "src/background/service-worker.ts")
    },
    output: {
      entryFileNames: "assets/[name].js",
      chunkFileNames: "assets/[name].js",
      assetFileNames: "assets/[name].[ext]"
    }
  };

  return {
    plugins: [react()],
    publicDir: isContentBuild ? false : "public",
    build: {
      emptyOutDir: isContentBuild,
      rollupOptions: isContentBuild ? contentOptions : appOptions
    }
  };
});
