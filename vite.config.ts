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

// const tesseractDir = require.resolve('tesseract.js/package.json')

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    proxy: {
      "/api/": "http://localhost:3000/"
    }
  },
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
            src: '/icon/favicon.png',
            type: 'image/png',
          },
          {
            src: '/icon/android-chrome-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/icon/android-chrome-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ]
      }
    }),
    viteStaticCopy({
      targets: [
        // {
        //   src: '',
        //   dest: '',
        // },
        {
          src: cMapsDir,
          dest: "",
        },
      ],
    }),
  ],
});
