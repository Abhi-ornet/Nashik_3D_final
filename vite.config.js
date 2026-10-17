import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { GEOSERVER_CONFIG } from './src/config/geoserverConfig.js';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: fileURLToPath(new URL('./index.html', import.meta.url)),
        treeSamples: fileURLToPath(new URL('./tree-samples.html', import.meta.url)),
      },
    },
  },
  server: {
    host: '127.0.0.1',
    proxy: {
      // Proxies /geoserver requests in local dev to prevent CORS errors
      '/geoserver': {
        target: GEOSERVER_CONFIG.targetServer,
        changeOrigin: true,
      },
    },
  },
});
