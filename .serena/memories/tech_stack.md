# Tech stack

- Windows project root: `D:\\abhishek_project\\poc`.
- Vite 8 + React 19, ESM, `@vitejs/plugin-react`, npm.
- MapLibre GL JS v6; default import is not available. Use namespace or named imports.
- For Vite, set MapLibre worker URL in `src/main.jsx` using `import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'` and `setWorkerUrl(workerUrl)`.
- Three.js shares MapLibre's WebGL context through a MapLibre custom layer.
- `public/data/trees-central-park-10000.json` is static local test data.
- Base map currently points to `https://demotiles.maplibre.org/style.json`, for development only; production should choose a suitable tile source/provider.