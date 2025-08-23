import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "docs-src",
  build: {
    outDir: "../docs",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "docs-src/index.html"),
      },
    },
    sourcemap: true,
    target: "es2022",
  },
  base: "/tex-to-unicode/",
});
