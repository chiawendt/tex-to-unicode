import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  publicDir: "./extension/public",
  build: {
    outDir: "./extension/dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "extension/render.ts"),
      },
      output: {
        entryFileNames: "render.js",
        format: "iife",
      },
    },
    sourcemap: true,
    minify: false,
    target: "es2022",
  },
});
