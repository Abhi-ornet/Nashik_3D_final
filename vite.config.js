import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

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
      // Browser requests /geoserver/... from Vite; Vite forwards them to local GeoServer.
      '/geoserver': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      },
    },
  },
});
