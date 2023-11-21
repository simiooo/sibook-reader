import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const cMapsDir = path.join(
  path.dirname(require.resolve("pdfjs-dist/package.json")),
  "cmaps"
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/jsstore/dist/jsstore.worker.js",
          dest: "jsstore.worker.js",
        },
        {
          src: cMapsDir,
          dest: "",
        },
      ],
    }),
  ],
});
