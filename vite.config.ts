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
      "/api": {
        target: `http://localhost:8080`,
        // target: "http://localhost:8080",
        // rewrite: (path) => path.replace(/^\/api/, ""),
      },
    }
  },
  plugins: [
    react(),
    VitePWA({
      // registerType: 'autoUpdate',
      workbox: {
        // cleanupOutdatedCaches: false
        globIgnores: ["**\/node_modules\/**\/*", 'index.html'],
      },
      manifest: {
        name: 'Squirrel Reader',
        short_name: 'Squirrel',
        description: 'Squirrel Reader application in cloud',
        theme_color: '#0d52bf',
        background_color: '#ffffff',
        icons: [
          {
            src: '/icon/favicon.ico',
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
