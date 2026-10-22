# Canopy — 3D Tree Map POC

Map-first 3D tree inventory and census visualization using React, Vite, MapLibre GL JS, and Three.js.

---

## Key Features

- **Density-Based Multi-Tier LOD**: Automatically transitions between high-detail 3D models, mid-tier street trees, ultra-low-poly showcase conifers, and 2D WMS raster tiles based on **viewport tree density** rather than arbitrary zoom levels. Camera pitch/tilt is preserved across all tiers.
- **Dynamic Multi-City / Multi-Workspace Support**: Supports multiple cities and GeoServer workspaces on the fly via URL search parameters (`?citycode=tmc`, `?workspace=...`, `?layer=...`, `?lat=...&long=...`).
- **Ward Boundary Visualizations**: Automatically fetches and draws municipal boundary polygons from local KML datasets (`/kml/${citycode}_kml.kml`).
- **Realistic 3D Instancing & Foliage Color Tinting**: High-performance Three.js GPU instancing (`THREE.InstancedMesh`) with property-driven health and appearance color blending (Healthy, Dead, Dangerous, Heritage, Exotic).
- **Inspection & Detail Fly-To**: Smooth camera animations to inspect individual trees with full census metadata (Girth, Canopy, Height, Condition, Age Group, Tree Photo, Ward).

---

## Density-Based Level of Detail (LOD) Architecture

Layer activation and model detail transitions are governed **strictly by the number of trees in the current viewport**, giving users smooth 60 FPS performance regardless of zoom level:

| Tier | Tree Count Threshold | Rendering Mode | Model Assets Used |
| :--- | :--- | :--- | :--- |
| **Tier 1: Detailed 3D** | `≤ 5,000` trees | Three.js 3D Instancing | Quaternius Common Trees (1, 2, 3), Palm Light, and Stump Cut model (`tree-cut.glb`) for dead/cut trees. |
| **Tier 2: Mid 3D** | `5,001 – 7,500` trees | Three.js 3D Instancing | Base Street Trees (`maple`, `oak`, `linden`, `palm-light`). |
| **Tier 3: Showcase Low-Poly 3D** | `7,501 – 16,000` trees | Three.js 3D Instancing | Ultra-low-poly Conical Pine (80 tris) and Layered Fir (108 tris) for bird's-eye 3D canopy massing. |
| **Tier 4: 2D Overview** | `> 16,000` trees | GeoServer WMS Raster | 2D raster image tiles (`wms-tree-2d-layer`) for zero-overhead city-wide views. |

---

## Dynamic URL Parameters

Canopy dynamically loads data for different municipalities, coordinates, and GeoServer workspaces:

| Parameter | Example | Description |
| :--- | :--- | :--- |
| `citycode` | `?citycode=tmc` | Automatically loads `/kml/tmc_kml.kml` and sets workspace/layer to `tmctreecensus:tmctreecensus`. |
| `workspace` | `?workspace=nashiktreecensus` | Overrides the active GeoServer workspace name. |
| `layer` | `?layer=nashiktreecensus` | Overrides the active GeoServer layer name. |
| `lat` & `long` | `?lat=19.218&long=72.978` | Overrides initial camera coordinates and centers the map directly. |

Examples:
- `http://localhost:5173/?citycode=tmc` (Thane Municipal Corporation)
- `http://localhost:5173/?citycode=nashik` (Nashik Municipal Corporation)
- `http://localhost:5173/?citycode=panvel&lat=18.99&long=73.11`

---

## Development & Deployment Quickstart

For full deployment instructions, see the dedicated [`DEPLOYMENT.md`](DEPLOYMENT.md) guide.

### 1. Local Development (`npm run dev`)

In local development, the browser makes requests through Vite's local dev proxy (`/geoserver/*` ➡️ `targetServer`), which **prevents browser CORS errors**.

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Configure your local `.env`:
   ```env
   VITE_GEOSERVER_TARGET_SERVER=https://www.ornettreecensus.com
   VITE_USE_PROXY=true

   # Default workspace and layer loaded when no ?citycode= or ?workspace= URL parameter is provided:
   VITE_DEFAULT_WORKSPACE=nashiktreecensus
   VITE_DEFAULT_LAYER_NAME=nashiktreecensus
   ```
3. Run the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open the printed URL (e.g., `http://localhost:5173`).

---

## Code Organization

- **`src/config/mapConfig.js`**: Central map configuration, basemap endpoints, starting position, and query paging.
- **`src/config/treeRendering.js`**: Multi-tier density thresholds (`DENSITY_THRESHOLDS`), GLB model paths, LOD tier mapping, foliage materials, and appearance colors.
- **`src/config/geoserverConfig.js`**: Environment variable parsing, GeoServer target host, workspace, layer, and proxy settings.
- **`src/data/treeData.js`**: WFS GeoJSON normalization, property projections, CQL filter generation, and species/health classification.
- **`src/data/kmlLoader.js`**: Municipal KML parser for boundary coordinates and GeoJSON polygon generation.
- **`src/map/createTreeLayer.js`**: Custom MapLibre Three.js 3D layer, GLTF model preparation, multi-tier instanced mesh management, and picking.
- **`src/components/`**: Modular UI components including `InventorySidebar.jsx`, `MapModeControls.jsx`, `TreeColorLegend.jsx`, and `TreeDetailsPopup.jsx`.

---

## Reviewing Alternative Tree Models

Start the development server and open `/tree-samples.html` to compare 16 tree models from low-poly geometric candidates to detailed, species-inspired assets side by side. Model stats and licenses are documented in [`public/models/samples/README.md`](public/models/samples/README.md).
