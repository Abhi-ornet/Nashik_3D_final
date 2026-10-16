# Project core

Canopy is a React web POC for a map-first 3D tree inventory, not a game map. Source of tree features is currently `public/data/trees-central-park-10000.json` (10k synthetic Central Park-area points; not surveyed truth). `x=longitude`, `y=latitude` in WGS84/EPSG:4326. The current viewport subset is filtered in-browser; this is a local-data stand-in for future GeoServer BBOX/vector-tile delivery.

- Stack, package versions and MapLibre v6 worker setup: `mem:tech_stack`.
- Windows run/build/check commands: `mem:suggested_commands`.
- React/map/coordinate and rendering conventions: `mem:conventions`.
- Definition of done: `mem:task_completion`.
- Initial architecture notes: `mem:architecture/3d-tree-map-poc`.