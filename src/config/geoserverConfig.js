// Central GeoServer Configuration
// Reads from import.meta.env (in browser/Vite) or process.env (in Node.js/Render/Vite config):
const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return fallback;
};

const targetServer = getEnv('VITE_GEOSERVER_TARGET_SERVER', 'https://www.ornettreecensus.com');

const envUseProxy = getEnv('VITE_USE_PROXY');
const useProxy = envUseProxy !== ''
  ? envUseProxy === 'true'
  : (typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV));

const cleanTarget = targetServer.replace(/\/+$/, '');
const directUrl = `${cleanTarget}/geoserver/ows`;

export const GEOSERVER_CONFIG = {
  // Whether to use the dev proxy (relative URL) or direct GeoServer URL
  useProxy,

  // Real GeoServer target server host
  targetServer,

  // When useProxy is true -> uses '/geoserver/ows' (proxied by Vite)
  // When useProxy is false -> connects directly to targetServer (e.g. 'https://.../geoserver/ows')
  url: useProxy ? (getEnv('VITE_GEOSERVER_URL') || '/geoserver/ows') : directUrl,

  // Workspace name in GeoServer (e.g. 'test' locally, or your production workspace from .env)
  workspace: getEnv('VITE_GEOSERVER_WORKSPACE', 'test'),

  // Layer name in GeoServer
  layerName: getEnv('VITE_GEOSERVER_LAYER_NAME', 'nashiktreecensus'),

  // Geometry column name in layer
  geometryColumn: getEnv('VITE_GEOSERVER_GEOMETRY_COLUMN', 'geom'),

  // Spatial reference system
  srsName: getEnv('VITE_GEOSERVER_SRS', 'CRS:84'),
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
  });
}

export default GEOSERVER_CONFIG;