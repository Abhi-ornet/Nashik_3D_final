# Canopy — 3D Tree Map POC

Map-first 3D tree inventory using React, Vite, MapLibre GL JS, and Three.js.

## Run locally on Windows

    npm install
    npm run dev

Open the URL printed by Vite. Vite proxies `/geoserver/*` to `http://localhost:8081/geoserver/*` for local development.

## Live tree source

The app queries GeoServer's working feature type:

- Workspace/layer: `test:nashiktreecensus`
- Endpoint: `/geoserver/ows`
- Protocol: WFS 2.0.0, GeoJSON responses
- Spatial filter: a CQL BBOX(geom, west, south, east, north, 'CRS:84') predicate built from the current viewport (this GeoServer rejects a separate bbox and CQL_FILTER parameter in one request)
- Paging: fetches viewport matches in pages up to a zoom-dependent POC cap.
- Attribute filtering: `CQL_FILTER` combines the spatial BBOX with selected tree group and health.
- Normalization: WFS Point coordinates become `x=longitude`, `y=latitude`; HealthCondition, LocalName, Specie, Height, Girth, Canopy, heritage flag, and WardNameOrNum are mapped for display.

The previously inspected `nashiktreecensus:nashiktreecensus` layer returned a SQLite missing-table error. The app uses `test:nashiktreecensus`, which returned features during inspection.

## Rendering

- Map view uses OpenFreeMap Liberty, Satellite switches on Esri World Imagery raster tiles, and Cesium 3D launches a separate CesiumJS globe with a low, oblique camera over Nashik. Cesium queries WFS around the visible area (with a forward-projected fallback for low-angle views), renders reusable GLB tree models at census heights, and shares the health/group filters and tree details. Cesium uses an ellipsoid globe and Esri imagery without a token; optional OSM 3D buildings can be enabled with your own Cesium ion token. Cesium static workers, assets, and widgets are copied to public/cesium before development/build runs and that generated folder is git-ignored.
- Three.js is integrated through src/map/createTreeLayer.js, a custom MapLibre 3D layer.
- Map/query settings are in src/config/mapConfig.js; tree models, health blending, LOD, and lighting are in src/config/treeRendering.js.
- WFS normalization and CQL filtering live in src/data/treeData.js; reusable UI sections live in src/components/.
- Four lightweight CC0 GLB tree forms (maple, oak, linden, palm) are normalized into local Z-up metres and instanced by material. At zoom 18.8+, compact Common Tree 1/2/4 and Palm Light assets replace the multi-MB detailed-leaf models; the detail tier is eligible for viewports with up to 2,000 visible trees. The zoomed-out model set and health tinting are unchanged.
- Panning or zooming debounces the WFS query; a new request aborts any stale request.
- UI displays the global count GeoServer reports, viewport match count, loaded count, and any viewport cap.

## Optional Cesium 3D buildings

To add the global OSM 3D building layer in Cesium mode, create an .env.local file in the project root and set your own Cesium ion access token:

    VITE_CESIUM_ION_ACCESS_TOKEN=your_token_here

Restart the Vite dev server after changing the variable. The token is optional and .env.local is ignored by Git. With a token, Cesium loads OSM building tiles and World Terrain; tree models are clamped to the ground. Without it, tree GLBs render over Esri imagery on the ellipsoid, with no 3D buildings or terrain.
## Development-only notes

The synthetic dataset `public/data/trees-central-park-10000.json` and `scripts/generate_sample_trees.py` are preserved as fallback/test data but are no longer the active source. Temporary GeoServer inspection output belongs in `temp/geoserver-inspection/` and is git-ignored.

Tree GLBs and source/license links are documented in `public/models/README.md`. Models are realistic visual proxies, not species-accurate representations of each census record. For production, configure a same-origin reverse proxy or server-side API to GeoServer, verify authentication/CORS and provider licensing, and tune paging or switch to vector tiles if the number of viewport matches is large.

## Code organization and tuning

- src/config/mapConfig.js centralizes map defaults, service endpoints, and WFS paging/debounce limits.
- src/config/treeRendering.js centralizes tree model paths, LOD threshold/count, leaf material, health blend, lighting, renderer exposure, model scaling, and per-instance variation.
- src/data/treeData.js owns WFS property projection, tree normalization/model selection, and CQL filter generation shared by MapLibre and Cesium.
- src/map/createTreeLayer.js owns the Three.js custom MapLibre layer and model instancing.
- src/components/ contains the inventory sidebar, map-mode controls, and selected-tree details panel.
- Cesium-specific WFS paging caps are in src/config/mapConfig.js and its model path/height registry is in src/config/treeRendering.js.

## Reviewing alternative tree models

Start the development server and open `/tree-samples.html` to compare 16 tree models from low-poly geometric candidates to detailed, species-inspired assets side by side. The GLBs and source/license notes are in `public/models/samples/`; they are preview-only and do not replace the models used by the live map.
