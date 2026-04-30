import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    headers: {
      // Allows Firebase Google popup to communicate back to the opener
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none'
    },
    hmr: {
      // Explicit HMR config prevents WebSocket token conflicts
      protocol: 'ws',
      host: 'localhost',
      port: 5173
    },
    proxy: {
      // All /api requests forwarded to Express — no direct :3000 calls from browser
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      }
    }
  }
});
