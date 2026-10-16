# 3D tree map POC

Implemented in the React/Vite project using MapLibre GL JS v6 and Three.js.

## Current implementation
- Local data: `public/data/trees-central-park-10000.json`, 10,000 synthetic points around Central Park; x=longitude, y=latitude, WGS84/EPSG:4326.
- `src/App.jsx`: initializes MapLibre, loads JSON, filters features to geographic viewport bounds, supports health/species filters and tree details, and installs a Three.js custom 3D layer.
- The custom layer builds simple shared trunk/canopy geometry and renders per-tree transforms/colors using `THREE.InstancedMesh`.
- `src/main.jsx`: configures MapLibre v6's worker URL with Vite `?worker&url` import.
- Current dataset is loaded locally in full, then filtered client-side. Production should replace this with GeoServer BBOX queries or vector tiles, caching and request cancellation.
- The public MapLibre demo style is development-only. No browser visual smoke test has been confirmed; automated lint/build passed.

## Key coordinate invariant
Tree records use x=longitude and y=latitude, passed through `maplibregl.MercatorCoordinate.fromLngLat`. Do not treat longitude/latitude degrees as metre coordinates.