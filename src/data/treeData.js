// GeoServer WFS property projection and normalization into the app's tree view model.
export const PROPERTY_NAMES = [
  'geom',
  'Tree_UID',
  'Height',
  'LocalName',
  'Specie',
  'IsHeritageTree',
  'HealthCondition',
].join(',');

// Attributes not needed to draw/filter trees are fetched only after a tree is clicked.
export const DETAIL_PROPERTY_NAMES = [
  'TreeCensusCd',
  'Girth',
  'Canopy',
  'AgeGroup',
  'TreePhoto',
  'WardNameOrNum',
  'OwnershipOfLand',
  'IUCN_Status',
  'Icon',
].join(',');

export function normalizeHealth(value) {
  const status = String(value ?? '').trim().toLowerCase();
  if (status === 'healthy' || status === 'good') return 'healthy';
  if (status === 'average' || status === 'fair' || status === 'moderate') return 'fair';
  if (/dead|danger|cut|poor|remove|diseased|critical/.test(status)) return 'poor';
  return 'unknown';
}

export function chooseTreeModel(tree) {
  const localName = String(tree.localName || '').toLowerCase();
  if (/palm|coconut|areca|date palm/.test(localName)) return 'palm';
  if (/\boak\b/.test(localName)) return 'oak';
  if (/linden|basswood/.test(localName)) return 'linden';
  if (/\bmaple\b/.test(localName)) return 'maple';

  // Stable variety across the inventory, independent of request/paging order.
  const key = String(tree.uid || tree.id);
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (Math.imul(hash, 31) + key.charCodeAt(i)) >>> 0;
  }
  return ['maple', 'oak', 'linden'][hash % 3];
}

export function getTreeAppearance(tree) {
  const condition = String(tree.healthCondition || tree.healthLabel || '').trim().toLowerCase();
  const species = String(tree.speciesGroup || '').trim().toLowerCase();
  if (/dead|mechanically cut|cut|uprooted/.test(condition)) return 'dead';
  if (/danger/.test(condition)) return 'dangerous';
  if (tree.isHeritage) return 'heritage';
  if (species === 'exotic') return 'exotic';
  return 'default';
}

export function normalizeTree(feature) {
  const properties = feature?.properties ?? {};
  const coordinates = feature?.geometry?.coordinates;
  if (
    feature?.geometry?.type !== 'Point' ||
    !Array.isArray(coordinates) ||
    !Number.isFinite(Number(coordinates[0])) ||
    !Number.isFinite(Number(coordinates[1]))
  ) {
    return null;
  }

  const longitude = Number(coordinates[0]);
  const latitude = Number(coordinates[1]);
  const rawHeight = Number(properties.Height);
  const rawGirth = Number(properties.Girth);
  const rawCanopy = Number(properties.Canopy);
  const uid = properties.Tree_UID || feature.id || `tree-${longitude}-${latitude}`;
  const healthCondition = String(properties.HealthCondition ?? '').trim();

  return {
    id: String(feature.id || uid),
    uid: String(uid),
    x: longitude,
    y: latitude,
    heightMeters: Number.isFinite(rawHeight) && rawHeight > 0 ? rawHeight : 8,
    girth: Number.isFinite(rawGirth) && rawGirth >= 0 ? rawGirth : null,
    canopy: Number.isFinite(rawCanopy) && rawCanopy >= 0 ? rawCanopy : null,
    localName: properties.LocalName || 'Unknown tree',
    speciesGroup: properties.Specie || 'Unclassified',
    ageGroup: properties.AgeGroup || 'Unknown',
    health: normalizeHealth(healthCondition),
    healthLabel: healthCondition || 'Not recorded',
    healthCondition,
    isHeritage: String(properties.IsHeritageTree ?? '').trim().toLowerCase() === 'yes',
    ward: properties.WardNameOrNum || 'Not recorded',
    ownership: properties.OwnershipOfLand || 'Not recorded',
    iucnStatus: properties.IUCN_Status || 'Not recorded',
    photo: properties.TreePhoto || null,
    icon: properties.Icon || null,
  };
}

export function getCqlFilter(filters, bounds) {
  // This GeoServer rejects the BBOX parameter and CQL_FILTER together, so combine
  // the spatial predicate and optional attribute filters into one CQL expression.
  const clauses = [
    "BBOX(geom," + bounds.getWest() + "," + bounds.getSouth() + "," +
      bounds.getEast() + "," + bounds.getNorth() + ",'CRS:84')",
  ];
  if (filters.species !== 'all') {
    clauses.push("Specie = '" + filters.species + "'");
  }

  const healthExpressions = {
    healthy: "HealthCondition = 'Healthy'",
    fair: "(HealthCondition = 'Average' OR HealthCondition = 'Fair')",
    poor: "(HealthCondition = 'Dead' OR HealthCondition = 'Dangerous' OR HealthCondition = 'Mechanically Cut' OR HealthCondition = 'Poor')",
  };
  if (filters.health !== 'all') clauses.push(healthExpressions[filters.health]);
  return clauses.join(' AND ');
}
