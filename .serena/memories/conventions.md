# Project conventions

- Use React/Vite scaffolding and npm lifecycle commands; do not replace the scaffold with ad hoc project files.
- Keep map initialization/cleanup in a React effect and keep long-lived map/layer/data references in refs, not React state.
- Coordinates in sample JSON: `x=longitude`, `y=latitude`; use `maplibregl.MercatorCoordinate.fromLngLat` to place Three.js objects. Do not treat degrees as metres.
- Build one reusable procedural tree geometry and use `THREE.InstancedMesh` for visible tree instances.
- Current POC viewport filtering is client-side over 10,000 local records. Production data delivery should switch to GeoServer WFS BBOX or vector tiles, not download all 500k records.
- Tree health color mapping: healthy green, fair amber, poor red.
- Label generated coordinates as synthetic; do not imply records are surveyed real tree locations.