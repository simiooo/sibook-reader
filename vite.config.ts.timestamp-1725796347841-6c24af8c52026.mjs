// vite.config.ts
import { defineConfig } from "file:///D:/playground/sibook-reader/node_modules/.pnpm/vite@4.5.0_@types+node@20.9.3/node_modules/vite/dist/node/index.js";
import { viteStaticCopy } from "file:///D:/playground/sibook-reader/node_modules/.pnpm/vite-plugin-static-copy@0.17.0_vite@4.5.0/node_modules/vite-plugin-static-copy/dist/index.js";
import react from "file:///D:/playground/sibook-reader/node_modules/.pnpm/@vitejs+plugin-react-swc@3.4.0_vite@4.5.0/node_modules/@vitejs/plugin-react-swc/index.mjs";
import path from "node:path";
import { createRequire } from "node:module";
import { VitePWA } from "file:///D:/playground/sibook-reader/node_modules/.pnpm/vite-plugin-pwa@0.17.0_vite@4.5.0_workbox-build@7.1.1_workbox-window@7.1.0/node_modules/vite-plugin-pwa/dist/index.js";
var __vite_injected_original_import_meta_url = "file:///D:/playground/sibook-reader/vite.config.ts";
var require2 = createRequire(__vite_injected_original_import_meta_url);
var cMapsDir = path.join(
  path.dirname(require2.resolve("pdfjs-dist/package.json")),
  "cmaps"
);
var vite_config_default = defineConfig({
  server: {
    proxy: {
      "/api": {
        // target: `https://squirrelso.top`,
        target: "http://localhost:8080"
        // rewrite: (path) => path.replace(/^\/api/, ""),
      }
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        cleanupOutdatedCaches: false
      },
      manifest: {
        name: "Si Reader",
        short_name: "Si Reader",
        description: "Si Reader application",
        theme_color: "#50aa81",
        background_color: "#ffffff",
        icons: [
          {
            src: "/icon/favicon.png",
            type: "image/png"
          },
          {
            src: "/icon/android-chrome-192x192.png",
            sizes: "192x192",
            type: "image/png"
          },
          {
            src: "/icon/android-chrome-512x512.png",
            sizes: "512x512",
            type: "image/png"
          }
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
          dest: ""
        }
      ]
    })
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxwbGF5Z3JvdW5kXFxcXHNpYm9vay1yZWFkZXJcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXHBsYXlncm91bmRcXFxcc2lib29rLXJlYWRlclxcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovcGxheWdyb3VuZC9zaWJvb2stcmVhZGVyL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgZGVmaW5lQ29uZmlnIH0gZnJvbSBcInZpdGVcIjtcclxuaW1wb3J0IHsgdml0ZVN0YXRpY0NvcHkgfSBmcm9tIFwidml0ZS1wbHVnaW4tc3RhdGljLWNvcHlcIjtcclxuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcclxuaW1wb3J0IHBhdGggZnJvbSBcIm5vZGU6cGF0aFwiO1xyXG5pbXBvcnQgeyBjcmVhdGVSZXF1aXJlIH0gZnJvbSBcIm5vZGU6bW9kdWxlXCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tICd2aXRlLXBsdWdpbi1wd2EnXHJcblxyXG5cclxuY29uc3QgcmVxdWlyZSA9IGNyZWF0ZVJlcXVpcmUoaW1wb3J0Lm1ldGEudXJsKTtcclxuY29uc3QgY01hcHNEaXIgPSBwYXRoLmpvaW4oXHJcbiAgcGF0aC5kaXJuYW1lKHJlcXVpcmUucmVzb2x2ZShcInBkZmpzLWRpc3QvcGFja2FnZS5qc29uXCIpKSxcclxuICBcImNtYXBzXCJcclxuKTtcclxuXHJcbi8vIGNvbnN0IHRlc3NlcmFjdERpciA9IHJlcXVpcmUucmVzb2x2ZSgndGVzc2VyYWN0LmpzL3BhY2thZ2UuanNvbicpXHJcblxyXG4vLyBodHRwczovL3ZpdGVqcy5kZXYvY29uZmlnL1xyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHNlcnZlcjoge1xyXG4gICAgcHJveHk6IHtcclxuICAgICAgXCIvYXBpXCI6IHtcclxuICAgICAgICAvLyB0YXJnZXQ6IGBodHRwczovL3NxdWlycmVsc28udG9wYCxcclxuICAgICAgICB0YXJnZXQ6IFwiaHR0cDovL2xvY2FsaG9zdDo4MDgwXCIsXHJcbiAgICAgICAgLy8gcmV3cml0ZTogKHBhdGgpID0+IHBhdGgucmVwbGFjZSgvXlxcL2FwaS8sIFwiXCIpLFxyXG4gICAgICB9LFxyXG4gICAgfVxyXG4gIH0sXHJcbiAgcGx1Z2luczogW1xyXG4gICAgcmVhY3QoKSxcclxuICAgIFZpdGVQV0Eoe1xyXG4gICAgICByZWdpc3RlclR5cGU6ICdhdXRvVXBkYXRlJyxcclxuICAgICAgd29ya2JveDoge1xyXG4gICAgICAgIGNsZWFudXBPdXRkYXRlZENhY2hlczogZmFsc2VcclxuICAgICAgfSxcclxuICAgICAgbWFuaWZlc3Q6IHtcclxuICAgICAgICBuYW1lOiAnU2kgUmVhZGVyJyxcclxuICAgICAgICBzaG9ydF9uYW1lOiAnU2kgUmVhZGVyJyxcclxuICAgICAgICBkZXNjcmlwdGlvbjogJ1NpIFJlYWRlciBhcHBsaWNhdGlvbicsXHJcbiAgICAgICAgdGhlbWVfY29sb3I6ICcjNTBhYTgxJyxcclxuICAgICAgICBiYWNrZ3JvdW5kX2NvbG9yOiAnI2ZmZmZmZicsXHJcbiAgICAgICAgaWNvbnM6IFtcclxuICAgICAgICAgIHtcclxuICAgICAgICAgICAgc3JjOiAnL2ljb24vZmF2aWNvbi5wbmcnLFxyXG4gICAgICAgICAgICB0eXBlOiAnaW1hZ2UvcG5nJyxcclxuICAgICAgICAgIH0sXHJcbiAgICAgICAgICB7XHJcbiAgICAgICAgICAgIHNyYzogJy9pY29uL2FuZHJvaWQtY2hyb21lLTE5MngxOTIucG5nJyxcclxuICAgICAgICAgICAgc2l6ZXM6ICcxOTJ4MTkyJyxcclxuICAgICAgICAgICAgdHlwZTogJ2ltYWdlL3BuZycsXHJcbiAgICAgICAgICB9LFxyXG4gICAgICAgICAge1xyXG4gICAgICAgICAgICBzcmM6ICcvaWNvbi9hbmRyb2lkLWNocm9tZS01MTJ4NTEyLnBuZycsXHJcbiAgICAgICAgICAgIHNpemVzOiAnNTEyeDUxMicsXHJcbiAgICAgICAgICAgIHR5cGU6ICdpbWFnZS9wbmcnLFxyXG4gICAgICAgICAgfSxcclxuICAgICAgICBdXHJcbiAgICAgIH1cclxuICAgIH0pLFxyXG4gICAgdml0ZVN0YXRpY0NvcHkoe1xyXG4gICAgICB0YXJnZXRzOiBbXHJcbiAgICAgICAgLy8ge1xyXG4gICAgICAgIC8vICAgc3JjOiAnJyxcclxuICAgICAgICAvLyAgIGRlc3Q6ICcnLFxyXG4gICAgICAgIC8vIH0sXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiBjTWFwc0RpcixcclxuICAgICAgICAgIGRlc3Q6IFwiXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH0pLFxyXG4gIF0sXHJcbn0pO1xyXG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlRLFNBQVMsb0JBQW9CO0FBQ3RTLFNBQVMsc0JBQXNCO0FBQy9CLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxlQUFlO0FBTDJJLElBQU0sMkNBQTJDO0FBUXBOLElBQU1BLFdBQVUsY0FBYyx3Q0FBZTtBQUM3QyxJQUFNLFdBQVcsS0FBSztBQUFBLEVBQ3BCLEtBQUssUUFBUUEsU0FBUSxRQUFRLHlCQUF5QixDQUFDO0FBQUEsRUFDdkQ7QUFDRjtBQUtBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQTtBQUFBLFFBRU4sUUFBUTtBQUFBO0FBQUEsTUFFVjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxTQUFTO0FBQUEsSUFDUCxNQUFNO0FBQUEsSUFDTixRQUFRO0FBQUEsTUFDTixjQUFjO0FBQUEsTUFDZCxTQUFTO0FBQUEsUUFDUCx1QkFBdUI7QUFBQSxNQUN6QjtBQUFBLE1BQ0EsVUFBVTtBQUFBLFFBQ1IsTUFBTTtBQUFBLFFBQ04sWUFBWTtBQUFBLFFBQ1osYUFBYTtBQUFBLFFBQ2IsYUFBYTtBQUFBLFFBQ2Isa0JBQWtCO0FBQUEsUUFDbEIsT0FBTztBQUFBLFVBQ0w7QUFBQSxZQUNFLEtBQUs7QUFBQSxZQUNMLE1BQU07QUFBQSxVQUNSO0FBQUEsVUFDQTtBQUFBLFlBQ0UsS0FBSztBQUFBLFlBQ0wsT0FBTztBQUFBLFlBQ1AsTUFBTTtBQUFBLFVBQ1I7QUFBQSxVQUNBO0FBQUEsWUFDRSxLQUFLO0FBQUEsWUFDTCxPQUFPO0FBQUEsWUFDUCxNQUFNO0FBQUEsVUFDUjtBQUFBLFFBQ0Y7QUFBQSxNQUNGO0FBQUEsSUFDRixDQUFDO0FBQUEsSUFDRCxlQUFlO0FBQUEsTUFDYixTQUFTO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxRQUtQO0FBQUEsVUFDRSxLQUFLO0FBQUEsVUFDTCxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNIO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFsicmVxdWlyZSJdCn0K
