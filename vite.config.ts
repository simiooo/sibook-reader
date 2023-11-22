import { defineConfig } from "vite";
import { viteStaticCopy } from "vite-plugin-static-copy";
import react from "@vitejs/plugin-react-swc";
import path from "node:path";
import { createRequire } from "node:module";
import { VitePWA } from 'vite-plugin-pwa'


const require = createRequire(import.meta.url);
const cMapsDir = path.join(
  path.dirname(require.resolve("pdfjs-dist/package.json")),
  "cmaps"
);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Si Reader',
        short_name: 'Si Reader',
        description: 'Si Reader application',
        theme_color: '#80aa51',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icon/si_reader_icon1.png',
            type: 'image/png', 
          },
          {
            src: '/icon/si_reader_icon2.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon/si_reader_icon3.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      }
    }),
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
