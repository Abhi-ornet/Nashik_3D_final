/**
 * Utility for dynamically loading and parsing municipal KML boundary files.
 * Extracts polygon coordinates, calculates boundary center, and prepares rings for 3D borderline rendering.
 */

function parseCoordinateString(coordStr) {
  if (!coordStr) return [];
  const points = [];
  const tokens = coordStr.trim().split(/\s+/);
  for (let i = 0; i < tokens.length; i++) {
    const parts = tokens[i].split(',');
    if (parts.length >= 2) {
      const lng = parseFloat(parts[0]);
      const lat = parseFloat(parts[1]);
      if (!Number.isNaN(lng) && !Number.isNaN(lat)) {
        points.push([lng, lat]);
      }
    }
  }
  return points;
}

export function parseKml(kmlString) {
  if (!kmlString) return null;

  const parser = new DOMParser();
  const xml = parser.parseFromString(kmlString, 'application/xml');

  const placemarks = xml.querySelectorAll('Placemark');
  const allRings = [];

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let totalPoints = 0;

  placemarks.forEach((pm) => {
    const coordElems = pm.querySelectorAll('coordinates');
    coordElems.forEach((coordElem) => {
      const ring = parseCoordinateString(coordElem.textContent);
      if (ring.length > 2) {
        allRings.push(ring);
        for (let i = 0; i < ring.length; i++) {
          const [lng, lat] = ring[i];
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          totalPoints++;
        }
      }
    });
  });

  if (allRings.length === 0 || totalPoints === 0) {
    return null;
  }

  const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];

  return {
    rings: allRings,
    bounds: [minLng, minLat, maxLng, maxLat],
    center,
    totalPoints,
  };
}

/**
 * Directly fetches /kml/${citycode}_kml.kml and returns parsed boundary data.
 */
export async function loadCityKml(citycode) {
  if (!citycode) return null;

  try {
    const res = await fetch(`/kml/${citycode}_kml.kml`);
    if (!res.ok) {
      return null;
    }
    const text = await res.text();
    return parseKml(text);
  } catch (err) {
    console.warn(`[KML] Error fetching /kml/${citycode}_kml.kml:`, err);
    return null;
  }
}
