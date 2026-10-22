/**
 * Utility for dynamically loading and parsing municipal KML boundary files.
 * Extracts polygon coordinates, builds GeoJSON FeatureCollection for 2D map layers,
 * and calculates boundary centers.
 * Handles all whitespace, newline, and XML namespace variations.
 */

function parseCoordinateString(coordStr) {
  if (!coordStr) return [];
  // Standardize commas and split by any whitespace or newline
  const cleaned = coordStr.replace(/,\s+/g, ',').replace(/\s+,/g, ',');
  const tokens = cleaned.trim().split(/\s+/);
  const points = [];
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

  const allRings = [];
  const features = [];

  let minLng = Infinity;
  let maxLng = -Infinity;
  let minLat = Infinity;
  let maxLat = -Infinity;
  let totalPoints = 0;

  // 1. Try DOMParser using getElementsByTagName (ignores XML namespaces)
  try {
    const parser = new DOMParser();
    const xml = parser.parseFromString(kmlString, 'text/xml');
    let placemarks = xml.getElementsByTagName('Placemark');
    if (!placemarks || placemarks.length === 0) {
      placemarks = xml.getElementsByTagNameNS('*', 'Placemark');
    }

    if (placemarks && placemarks.length > 0) {
      for (let idx = 0; idx < placemarks.length; idx++) {
        const pm = placemarks[idx];
        const nameNode = pm.getElementsByTagName('name')[0];
        const wardName = nameNode ? nameNode.textContent.trim() : `Ward ${idx + 1}`;
        const wardRings = [];

        const coordNodes = pm.getElementsByTagName('coordinates');
        for (let c = 0; c < coordNodes.length; c++) {
          const ring = parseCoordinateString(coordNodes[c].textContent);
          if (ring.length > 2) {
            if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
              ring.push([...ring[0]]);
            }
            wardRings.push(ring);
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
        }

        if (wardRings.length > 0) {
          features.push({
            type: 'Feature',
            properties: { name: wardName, id: idx },
            geometry: {
              type: 'Polygon',
              coordinates: wardRings,
            },
          });
        }
      }
    }
  } catch (err) {
    console.warn('[KML] DOMParser error, using regex fallback:', err);
  }

  // 2. Regex fallback if DOM parsing found no placemarks
  if (features.length === 0) {
    const pmRegex = /<Placemark[\s\S]*?<\/Placemark>/gi;
    let match;
    let idx = 0;
    while ((match = pmRegex.exec(kmlString)) !== null) {
      const pmBlock = match[0];
      const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(pmBlock);
      const wardName = nameMatch ? nameMatch[1].trim() : `Ward ${idx + 1}`;
      const coordRegex = /<coordinates>([\s\S]*?)<\/coordinates>/gi;
      let cMatch;
      const wardRings = [];
      while ((cMatch = coordRegex.exec(pmBlock)) !== null) {
        const ring = parseCoordinateString(cMatch[1]);
        if (ring.length > 2) {
          if (ring[0][0] !== ring[ring.length - 1][0] || ring[0][1] !== ring[ring.length - 1][1]) {
            ring.push([...ring[0]]);
          }
          wardRings.push(ring);
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
      }
      if (wardRings.length > 0) {
        features.push({
          type: 'Feature',
          properties: { name: wardName, id: idx },
          geometry: {
            type: 'Polygon',
            coordinates: wardRings,
          },
        });
      }
      idx++;
    }
  }

  if (features.length === 0 || totalPoints === 0) {
    console.warn('[KML] No valid polygon coordinates found in KML');
    return null;
  }

  const center = [(minLng + maxLng) / 2, (minLat + maxLat) / 2];

  console.log(`[KML] Successfully parsed ${features.length} wards with ${totalPoints} coordinates. Center:`, center);

  return {
    rings: allRings,
    bounds: [minLng, minLat, maxLng, maxLat],
    center,
    totalPoints,
    geojson: {
      type: 'FeatureCollection',
      features,
    },
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
      console.warn(`[KML] File /kml/${citycode}_kml.kml returned HTTP ${res.status}`);
      return null;
    }
    const text = await res.text();
    return parseKml(text);
  } catch (err) {
    console.warn(`[KML] Error fetching /kml/${citycode}_kml.kml:`, err);
    return null;
  }
}
