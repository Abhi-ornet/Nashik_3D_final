// Central tuning point for Three.js tree geometry, health coloring, LOD, and lighting.
export const HEALTH_COLORS = {
  healthy: '#4f9863',
  fair: '#d9a64e',
  poor: '#bd5c52',
  unknown: '#829087',
};

// 0 keeps the model's natural leaf material; 1 fully applies the GeoServer-driven foliage color.
export const HEALTH_BLEND = 1;

// Property-driven foliage colors. Higher-priority conditions are evaluated first.
export const TREE_APPEARANCE_COLORS = {
  dead: '#6f665b',
  dangerous: '#e53935',
  heritage: '#f4d21f',
  exotic: '#ff8a18',
  default: '#4f9863',
};

export const TREE_CUT_MODEL = '/models/tree-cut.glb';

// Density thresholds for multi-tier level of detail (purely count-based, not zoom-based)
export const DENSITY_THRESHOLDS = {
  DETAIL: 5000,
  MID: 7500,
  LOW_POLY: 15000,
};

// Tier 3 (Showcase Low-Poly 3D: 7,501 - 16,000 trees)
export const TREE_LOW_POLY_MODELS = {
  pine: '/models/samples/innerscene-conical-pine.glb',
  fir: '/models/samples/innerscene-layered-fir.glb',
};

export const TREE_MODELS = {
  maple: '/models/maple-street-tree.glb',
  oak: '/models/oak-street-tree.glb',
  linden: '/models/linden-street-tree.glb',
  palm: '/models/palm-light.glb',
};



// Detail-zoom replacements are intentionally small and shared across many instances.
// Three Common Tree variants plus Palm Light replace the multi-MB detailed-leaf assets.
export const TREE_DETAIL_MODELS = {
  maple: '/models/samples/quaternius-common-tree-1.glb',
  oak: '/models/samples/quaternius-common-tree-2.glb',
  linden: '/models/samples/quaternius-common-tree-3.glb',
  palm: '/models/samples/innerscene-palm-light.glb',
};

// These models are around 4k–7k triangles per broadleaf tree; Palm Light is ~34k.
// Instancing lets the detail tier cover larger viewports without loading huge tree meshes.
export const DETAIL_ZOOM = 0; // Deprecated: Tiers are now purely tree-count based
export const DETAIL_MAX_TREES = DENSITY_THRESHOLDS.DETAIL;

export const FOLIAGE_MATERIAL = {
  roughness: 0.92,
  metalness: 0,
};

export const TREE_LIGHTING = {
  hemisphere: { skyColor: 0xf1f2e9, groundColor: 0x465342, intensity: 1.05 },
  key: { color: 0xfff4e6, intensity: 1.15, position: [-3, -4, 8] },
  fill: { color: 0xe5eee2, intensity: 0.28, position: [4, 3, 5] },
};

export const TREE_RENDERER = {
  toneMappingExposure: 0.95,
};

export const TREE_INSTANCE_VARIATION = {
  widthBase: 0.86,
  widthStep: 0.02,
  widthSteps: 15,
  colorBase: 0.96,
  colorStep: 0.013,
  colorSteps: 7,
};

export const TREE_MODEL_HEIGHT_LIMITS = {
  min: 3,
  max: 22,
};
