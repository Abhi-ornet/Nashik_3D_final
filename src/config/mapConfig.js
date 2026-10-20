// Central configuration for the Nashik map, GeoServer queries, and interactions.
import { GEOSERVER_CONFIG, WFS_URL, TREE_LAYER, GEOMETRY_COLUMN } from './geoserverConfig.js';
export { GEOSERVER_CONFIG, WFS_URL, TREE_LAYER, GEOMETRY_COLUMN };

export const SATELLITE_SOURCE_ID = 'satellite-imagery-source';
export const SATELLITE_LAYER_ID = 'satellite-imagery-layer';
export const BASEMAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
export const SATELLITE_TILE_URL =
  'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

export const START_CENTER = [73.75085257, 19.99097347];
export const START_ZOOM = 17.1;
export const INITIAL_PITCH = 48;
export const FOCUS_PITCH = 53;
export const MAX_PITCH = 65;
export const MIN_ZOOM = 11;

export const PAGE_SIZE = 1500;
export const VIEWPORT_RECORD_CAPS = [
  { minZoom: 18.5, maxRecords: 12000 },
  { minZoom: 0, maxRecords: 7000 },
];

export const MOVE_QUERY_DEBOUNCE_MS = 220;
export const TREE_PICK_RADIUS_PX = 18;

export function getViewportRecordLimit(zoom) {
  return VIEWPORT_RECORD_CAPS.find((limit) => zoom >= limit.minZoom)?.maxRecords ?? 1500;
}


