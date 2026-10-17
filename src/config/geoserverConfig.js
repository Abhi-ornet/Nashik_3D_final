// Polyfill for Node.js (prevents crash when imported by vite.config.js)
if (typeof import.meta !== 'undefined' && !import.meta.env) {
  import.meta.env = {};
}

// Central GeoServer Configuration
// Reads from .env (VITE_*) with safe local defaults:
const targetServer = import.meta.env.VITE_GEOSERVER_TARGET_SERVER || 'http://127.0.0.1:8081';

const envUseProxy = import.meta.env.VITE_USE_PROXY;
const useProxy = envUseProxy !== undefined
  ? envUseProxy === 'true'
  : Boolean(import.meta.env.DEV);

const cleanTarget = targetServer.replace(/\/+$/, '');
const directUrl = `${cleanTarget}/geoserver/ows`;

export const GEOSERVER_CONFIG = {
  // Whether to use the dev proxy (relative URL) or direct GeoServer URL
  useProxy,

  // Real GeoServer target server host
  targetServer,

  // When useProxy is true -> uses '/geoserver/ows' (proxied by Vite dev server)
  // When useProxy is false -> connects directly to targetServer (e.g. 'https://.../geoserver/ows')
  url: useProxy ? '/geoserver/ows' : directUrl,

  // Workspace name in GeoServer (e.g. 'test' locally, or your production workspace from .env)
  workspace: import.meta.env.VITE_GEOSERVER_WORKSPACE || 'test',

  // Layer name in GeoServer
  layerName: import.meta.env.VITE_GEOSERVER_LAYER_NAME || 'nashiktreecensus',

  // Geometry column name in layer
  geometryColumn: import.meta.env.VITE_GEOSERVER_GEOMETRY_COLUMN || 'geom',

  // Spatial reference system
  srsName: import.meta.env.VITE_GEOSERVER_SRS || 'CRS:84',
};

export const WFS_URL = GEOSERVER_CONFIG.url;
export const TREE_LAYER = `${GEOSERVER_CONFIG.workspace}:${GEOSERVER_CONFIG.layerName}`;
export const GEOMETRY_COLUMN = GEOSERVER_CONFIG.geometryColumn;

// Log active configuration in browser console for easy verification:
if (typeof window !== 'undefined') {
  console.log('[GeoServer Config]', {
    useProxy: GEOSERVER_CONFIG.useProxy,
    url: GEOSERVER_CONFIG.url,
    workspace: GEOSERVER_CONFIG.workspace,
    layerName: GEOSERVER_CONFIG.layerName,
    rawEnv: import.meta.env.VITE_USE_PROXY,
  });
}

export default GEOSERVER_CONFIG;