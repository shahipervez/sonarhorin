import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// PWA: installable app shell + offline-friendly job lists. Big videos are never precached.
const pwa = VitePWA({
  registerType: "autoUpdate",
  injectRegister: "auto",
  includeAssets: ["favicon.ico", "favicon.png", "robots.txt", "push-sw.js"],
  manifest: {
    name: "সোনারহরিণ (Sonarhorin)",
    short_name: "সোনারহরিণ",
    description: "Bangladesh's job platform only for freshers — fresher jobs, internships, CV check and AI interview practice.",
    lang: "bn",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0A1030",
    theme_color: "#0A1030",
    categories: ["business", "education", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  },
  workbox: {
    globPatterns: ["**/*.{js,css,html,svg,woff2}", "icons/*.png", "logo-gold.png"],
    globIgnores: ["**/*.mp4", "**/*.webm", "stories/**", "forest-*.png"],
    maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
    navigateFallback: "/index.html",
    navigateFallbackDenylist: [/^\/api\//, /^\/media\//, /^\/admin/],
    cleanupOutdatedCaches: true,
    // web push: `push` + `notificationclick` handlers (payload {title, body, url})
    importScripts: ["/push-sw.js"],
    runtimeCaching: [
      {
        // job lists + job detail: fresh when online, last copy when offline / slow
        urlPattern: ({ url, request }) => request.method === "GET" && url.pathname.startsWith("/api/jobs") && !url.pathname.includes("/applications"),
        handler: "NetworkFirst",
        method: "GET",
        options: {
          cacheName: "api-jobs",
          networkTimeoutSeconds: 4,
          expiration: { maxEntries: 60, maxAgeSeconds: 60 * 60 * 24 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: ({ request, url }) => request.destination === "image" || /\.(png|jpe?g|webp|gif|svg|ico)$/i.test(url.pathname),
        handler: "CacheFirst",
        options: {
          cacheName: "images",
          expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
          cacheableResponse: { statuses: [0, 200] },
        },
      },
      {
        urlPattern: ({ url }) => url.origin === "https://fonts.googleapis.com" || url.origin === "https://fonts.gstatic.com",
        handler: "StaleWhileRevalidate",
        options: { cacheName: "google-fonts", expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 } },
      },
    ],
  },
  devOptions: { enabled: false },
});


export default defineConfig({
  plugins: [react(), pwa],
  server: {
    port: 5173,
    host: "0.0.0.0",
    allowedHosts: true,
    proxy: {
      "/api": {
        target: process.env.API_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
      "/media": {
        target: process.env.API_TARGET || "http://127.0.0.1:8000",
        changeOrigin: true,
      },
    },
  },
  build: {
    target: "esnext",
    minify: "esbuild",
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
              return "vendor-react";
            }
            return "vendor";
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
