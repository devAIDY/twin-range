import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const src = (p: string) => fileURLToPath(new URL(`../src/${p}`, import.meta.url));

// Point `twin-range` at the source, so edits in src/ hot-reload in the demo.
export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // Relative assets keep the built demo working at GitHub Pages' /twin-range/ path.
  base: "./",
  plugins: [react()],
  resolve: {
    alias: [
      { find: /^twin-range\/styles\.css$/, replacement: src("styles.css") },
      { find: /^twin-range$/, replacement: src("index.ts") },
    ],
  },
  server: { host: true },
});
