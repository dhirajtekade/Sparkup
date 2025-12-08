import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // Automatically update the service worker when a new build is deployed
      registerType: "autoUpdate",
      // Files to include in the precache
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "masked-icon.svg"],
      // The Web App Manifest
      manifest: {
        name: "SparkUp", // The full name of your app
        short_name: "SparkUp", // The name shown on the home screen
        description: "An educational habit-building and tracking platform.",
        theme_color: "#1976d2", // Should match your primary color
        background_color: "#ffffff", // Background color for splash screen
        display: "standalone", // Opens app without browser UI
        orientation: "portrait", // Lock to portrait mode on mobile (optional)
        // Define your icons here
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable", // Good for Android adaptive icons
          },
        ],
      },
    }),
  ],
  // Keep your existing server configuration if you have one
  server: {
    port: 3000,
    open: true,
  },
});
