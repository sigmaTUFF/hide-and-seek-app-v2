import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    // Stellt sicher, dass Service Worker korrekt kopiert wird
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  },
  // PWA-spezifische Einstellungen
  server: {
    // Für lokale Entwicklung HTTPS aktivieren (optional)
    // https: true
  }
});
