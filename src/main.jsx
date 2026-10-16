import React from 'react';
import { createRoot } from 'react-dom/client';
import { setWorkerUrl } from 'maplibre-gl';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import App from './App.jsx';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';
import './App.css';

// MapLibre GL JS v6 uses ESM workers; bundle its worker through Vite.
setWorkerUrl(maplibreWorkerUrl);

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);