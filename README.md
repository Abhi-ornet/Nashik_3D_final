# Canopy — 3D Tree Map POC

Map-first 3D tree inventory using React, Vite, MapLibre GL JS, and Three.js.

## Development & Deployment Guide

All GeoServer settings (workspace, layer, target server, and proxy mode) are centralized in `src/config/geoserverConfig.js` and can be configured using environment variables (`.env`).

### 1. Local Development (`npm run dev`)

In local development, the browser makes requests through Vite's local dev proxy (`/geoserver/ows` ➡️ `targetServer`), which **prevents browser CORS errors**.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your local `.env`:
   ```env
   VITE_GEOSERVER_TARGET_SERVER=http://127.0.0.1:8081
   VITE_GEOSERVER_WORKSPACE=test
   VITE_GEOSERVER_LAYER_NAME=nashiktreecensus
   VITE_USE_PROXY=true
   ```
3. Run the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open the printed URL (e.g., `http://localhost:5173`). Vite proxies `/geoserver/*` requests to your local GeoServer.

---

### 2. Deployment on Render (Recommended)

When deploying to Render (or any cloud Node host), use the built-in [`server.js`](server.js). It serves your production build from `dist/` and proxies `/geoserver/*` requests with automatic CORS headers, so your users never face CORS blocks.

#### Step-by-Step Render Setup:

1. **Push your code to GitHub / GitLab**.
   (`.env` is ignored by `.gitignore` so your private servers and keys are never committed).

2. **Create a Web Service on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com) ➡️ **New** ➡️ **Web Service**.
   - Connect your Git repository.

3. **Configure Build & Start Commands**:
   - **Environment**: `Node`
   - **Build Command**:
     ```bash
     npm install && npm run build
     ```
   - **Start Command**:
     ```bash
     npm start
     ```
     *(Runs `node server.js` which listens on `0.0.0.0` and Render's dynamic `$PORT`)*.

4. **Add Environment Variables** (in Render Dashboard ➡️ **Environment** tab):
   | Key | Value | Description |
   |---|---|---|
   | `VITE_GEOSERVER_TARGET_SERVER` | `https://your-geoserver.com` | Your real GeoServer host address |
   | `VITE_USE_PROXY` | `true` | Tells the app to route requests through `server.js` to avoid CORS |
   | `VITE_GEOSERVER_WORKSPACE` | `your_workspace` | Production GeoServer workspace name |
   | `VITE_GEOSERVER_LAYER_NAME` | `your_layer` | Production layer name |
   | `VITE_CESIUM_ION_ACCESS_TOKEN` | *(optional)* | Cesium ion token for 3D OSM buildings |

5. **Deploy**:
   Click **Create Web Service** (or **Manual Deploy**). Render will build the app, launch `server.js`, and your map will be live!

---

### 3. Alternative: Static Deployment (Vercel, Netlify, S3, Cloudflare Pages)

If you are hosting only static HTML/JS without a Node server:
1. In your deployment environment variables, set:
   ```env
   VITE_GEOSERVER_TARGET_SERVER=https://your-geoserver.com
   VITE_USE_PROXY=false
   VITE_GEOSERVER_WORKSPACE=your_workspace
   VITE_GEOSERVER_LAYER_NAME=your_layer
   ```
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Make sure your remote GeoServer has CORS enabled (`Access-Control-Allow-Origin`).



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
