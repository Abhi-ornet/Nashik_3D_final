import { lazy, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';

import { createTreeLayer } from './map/createTreeLayer.js';
import {
  BASEMAP_STYLE_URL,
  FOCUS_PITCH,
  INITIAL_PITCH,
  MAX_PITCH,
  MIN_ZOOM,
  MOVE_QUERY_DEBOUNCE_MS,
  PAGE_SIZE,
  SATELLITE_LAYER_ID,
  SATELLITE_SOURCE_ID,
  SATELLITE_TILE_URL,
  START_CENTER,
  START_ZOOM,
  TREE_LAYER,
  TREE_PICK_RADIUS_PX,
  WFS_URL,
  getViewportRecordLimit,
} from './config/mapConfig.js';
import { DETAIL_PROPERTY_NAMES, getCqlFilter, normalizeTree, PROPERTY_NAMES } from './data/treeData.js';
import InventorySidebar from './components/InventorySidebar.jsx';
import MapModeControls from './components/MapModeControls.jsx';
import TreeColorLegend from './components/TreeColorLegend.jsx';
import TreeDetailsPopup from './components/TreeDetailsPopup.jsx';

const CesiumGlobe = lazy(() => import('./CesiumGlobe.jsx'));

export default function App() {
  const mapElementRef = useRef(null);
  const mapRef = useRef(null);
  const treeLayerRef = useRef(null);
  const viewportTreesRef = useRef([]);
  const visibleTreesRef = useRef([]);
  const filtersRef = useRef({ health: 'all', species: 'all', enabled: true });
  const fetchViewportRef = useRef(() => {});
  const activeRequestRef = useRef(null);
  const detailsRequestRef = useRef(null);

  const [status, setStatus] = useState('Connecting to GeoServer…');
  const [totalTrees, setTotalTrees] = useState(0);
  const [matchedInViewport, setMatchedInViewport] = useState(0);
  const [loadedInViewport, setLoadedInViewport] = useState(0);
  const [selectedTree, setSelectedTree] = useState(null);
  const [healthFilter, setHealthFilter] = useState('all');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [treesEnabled, setTreesEnabled] = useState(true);
  const [viewMode, setViewMode] = useState('satellite');
  const viewModeRef = useRef('satellite');
  const cesiumControlsRef = useRef(null);

  filtersRef.current = { health: healthFilter, species: speciesFilter, enabled: treesEnabled };
  viewModeRef.current = viewMode;

  const applyVisibleTrees = useCallback(() => {
    const filters = filtersRef.current;
    // Health/group filtering is also sent to GeoServer. Recheck locally for safe UI consistency.
    const filtered = viewportTreesRef.current.filter((tree) =>
      (filters.health === 'all' || tree.health === filters.health) &&
      (filters.species === 'all' || tree.speciesGroup === filters.species)
    );
    visibleTreesRef.current = filtered;
    if (treeLayerRef.current) treeLayerRef.current.updateTrees(filters.enabled ? filtered : []);
  }, []);

  const loadViewport = useCallback(async () => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || viewModeRef.current === 'cesium') return;

    if (activeRequestRef.current) activeRequestRef.current.abort();
    const controller = new AbortController();
    activeRequestRef.current = controller;
    const bounds = map.getBounds();
    const filters = filtersRef.current;
    const cqlFilter = getCqlFilter(filters, bounds);
    const maxRecords = getViewportRecordLimit(map.getZoom());

    const buildUrl = (startIndex) => {
      const params = new URLSearchParams({
        service: 'WFS',
        version: '2.0.0',
        request: 'GetFeature',
        typeNames: TREE_LAYER,
        outputFormat: 'application/json',
        srsName: 'CRS:84',
        count: String(PAGE_SIZE),
        startIndex: String(startIndex),
        propertyName: PROPERTY_NAMES,
      });
      params.set('CQL_FILTER', cqlFilter);
      return WFS_URL + '?' + params.toString();
    };

    setStatus('Querying trees in the current viewport…');
    try {
      const firstResponse = await fetch(buildUrl(0), { signal: controller.signal });
      if (!firstResponse.ok) throw new Error(`GeoServer returned HTTP ${firstResponse.status}`);
      const firstPage = await firstResponse.json();
      if (firstPage.type !== 'FeatureCollection' || !Array.isArray(firstPage.features)) {
        throw new Error('GeoServer did not return a GeoJSON FeatureCollection');
      }
      if (controller.signal.aborted) return;

      const matched = Number(firstPage.numberMatched ?? firstPage.totalFeatures ?? firstPage.features.length);
      const knownMatched = Number.isFinite(matched) ? matched : firstPage.features.length;
      setMatchedInViewport(knownMatched);

      const toFetch = Math.min(knownMatched || firstPage.features.length, maxRecords);
      const pageOffsets = [];
      for (let start = PAGE_SIZE; start < toFetch; start += PAGE_SIZE) pageOffsets.push(start);

      const laterPages = await Promise.all(pageOffsets.map(async (startIndex) => {
        const response = await fetch(buildUrl(startIndex), { signal: controller.signal });
        if (!response.ok) throw new Error(`GeoServer returned HTTP ${response.status}`);
        const page = await response.json();
        if (page.type !== 'FeatureCollection' || !Array.isArray(page.features)) {
          throw new Error('GeoServer returned an invalid feature page');
        }
        return page.features;
      }));
      if (controller.signal.aborted) return;

      const features = [firstPage.features, ...laterPages].flat();
      const normalized = features.map(normalizeTree).filter(Boolean);
      viewportTreesRef.current = normalized;
      setLoadedInViewport(normalized.length);
      setSelectedTree((current) => current && normalized.some((tree) => tree.id === current.id) ? current : null);
      applyVisibleTrees();
      if (filtersRef.current.enabled && treeLayerRef.current) {
        treeLayerRef.current.ensureDetailModels(visibleTreesRef.current.length);
      }

      if (knownMatched > normalized.length) {
        setStatus(`Loaded ${normalized.length.toLocaleString()} of ${knownMatched.toLocaleString()} matching trees; zoom in for more detail.`);
      } else {
        setStatus(`Loaded all ${normalized.length.toLocaleString()} trees matching this viewport.`);
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      viewportTreesRef.current = [];
      applyVisibleTrees();
      setMatchedInViewport(0);
      setLoadedInViewport(0);
      setStatus(`GeoServer error: ${error.message}`);
    }
  }, [applyVisibleTrees]);

  fetchViewportRef.current = loadViewport;

  useEffect(() => {
    let disposed = false;
    let moveTimer;
    let moveEndHandler;
    let clickHandler;

    const map = new maplibregl.Map({
      container: mapElementRef.current,
      style: BASEMAP_STYLE_URL,
      center: START_CENTER,
      zoom: START_ZOOM,
      pitch: INITIAL_PITCH,
      bearing: 0,
      maxPitch: MAX_PITCH,
      minZoom: MIN_ZOOM,
      canvasContextAttributes: { antialias: true },
    });
    mapRef.current = map;
    const countController = new AbortController();
    const countParams = new URLSearchParams({
      service: 'WFS',
      version: '2.0.0',
      request: 'GetFeature',
      typeNames: TREE_LAYER,
      resultType: 'hits',
    });
    fetch(WFS_URL + '?' + countParams.toString(), { signal: countController.signal })
      .then((response) => {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.text();
      })
      .then((xml) => {
        if (disposed) return;
        const match = xml.match(/numberMatched="([0-9]+)"/);
        if (match) setTotalTrees(Number(match[1]));
      })
      .catch((error) => {
        // A failed global-count request should not overwrite the status of a working viewport query.
        if (!disposed && error.name !== 'AbortError') console.warn('GeoServer global count unavailable:', error);
      });
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      if (disposed) return;
      const firstTextLayer = map.getStyle().layers.find(
        (styleLayer) => styleLayer.type === 'symbol' && styleLayer.layout && styleLayer.layout['text-field']
      );

      // Add imagery underneath the style's labels and the 3D tree layer. Its visibility
      // is switched without replacing the map style, preserving camera, queries and trees.
      map.addSource(SATELLITE_SOURCE_ID, {
        type: 'raster',
        tiles: [
          SATELLITE_TILE_URL,
        ],
        tileSize: 256,
        maxzoom: 19,
        attribution: 'Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community',
      });
      map.addLayer({
        id: SATELLITE_LAYER_ID,
        type: 'raster',
        source: SATELLITE_SOURCE_ID,
        layout: { visibility: viewModeRef.current === 'satellite' ? 'visible' : 'none' },
        paint: { 'raster-fade-duration': 180 },
      }, firstTextLayer ? firstTextLayer.id : undefined);

      const layer = createTreeLayer();
      treeLayerRef.current = layer;
      map.addLayer(layer, firstTextLayer ? firstTextLayer.id : undefined);

      moveEndHandler = () => {
        clearTimeout(moveTimer);
        moveTimer = setTimeout(() => fetchViewportRef.current(), MOVE_QUERY_DEBOUNCE_MS);
      };
      clickHandler = (event) => {
        if (!filtersRef.current.enabled) return;
        let nearest = null;
        let nearestDistance = TREE_PICK_RADIUS_PX;
        for (const tree of visibleTreesRef.current) {
          const pixel = map.project([tree.x, tree.y]);
          const distance = Math.hypot(pixel.x - event.point.x, pixel.y - event.point.y);
          if (distance < nearestDistance) {
            nearestDistance = distance;
            nearest = tree;
          }
        }
        setSelectedTree(nearest);
        if (treeLayerRef.current) treeLayerRef.current.setSelected(nearest ? nearest.id : null);
      };
      map.on('moveend', moveEndHandler);
      map.on('click', clickHandler);
      fetchViewportRef.current();
    });

    return () => {
      disposed = true;
      clearTimeout(moveTimer);
      if (activeRequestRef.current) activeRequestRef.current.abort();
      countController.abort();
      if (moveEndHandler) map.off('moveend', moveEndHandler);
      if (clickHandler) map.off('click', clickHandler);
      map.remove();
      mapRef.current = null;
      treeLayerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (mapRef.current && mapRef.current.isStyleLoaded() && treeLayerRef.current) {
      const timer = setTimeout(() => fetchViewportRef.current(), 100);
      return () => clearTimeout(timer);
    }
  }, [healthFilter, speciesFilter]);

  useEffect(() => {
    applyVisibleTrees();
  }, [treesEnabled, applyVisibleTrees]);

  const focusTree = (tree) => {
    if (!tree) return;
    if (viewModeRef.current === 'cesium' && cesiumControlsRef.current) {
      cesiumControlsRef.current.flyToTree(tree);
    } else if (mapRef.current) {
      mapRef.current.flyTo({ center: [tree.x, tree.y], zoom: 19, pitch: FOCUS_PITCH, duration: 850 });
    }
    setSelectedTree(tree);
    if (treeLayerRef.current) treeLayerRef.current.setSelected(tree.id);
  };

  const setView = (mode) => {
    viewModeRef.current = mode;
    setViewMode(mode);
    const map = mapRef.current;
    if (map && map.getLayer(SATELLITE_LAYER_ID)) {
      map.setLayoutProperty(SATELLITE_LAYER_ID, 'visibility', mode === 'satellite' ? 'visible' : 'none');
    }
    if (mode === 'cesium') {
      if (activeRequestRef.current) activeRequestRef.current.abort();
    } else {
      // Filters may have changed while Cesium was active; refresh MapLibre on return.
      fetchViewportRef.current();
    }
  };

  const handleCesiumSelect = useCallback((tree) => {
    setSelectedTree(tree);
    if (treeLayerRef.current) treeLayerRef.current.setSelected(tree ? tree.id : null);
  }, []);
  const handleCesiumStatus = useCallback((nextStatus) => setStatus(nextStatus), []);
  const handleCesiumCounts = useCallback(({ matched, loaded }) => {
    setMatchedInViewport(matched);
    setLoadedInViewport(loaded);
  }, []);
  const handleCesiumReady = useCallback((controls) => {
    cesiumControlsRef.current = controls;
  }, []);

  return (
    <main className="app-shell">
      <InventorySidebar
        status={status}
        totalTrees={totalTrees}
        matchedInViewport={matchedInViewport}
        loadedInViewport={loadedInViewport}
        speciesFilter={speciesFilter}
        setSpeciesFilter={setSpeciesFilter}
        healthFilter={healthFilter}
        setHealthFilter={setHealthFilter}
        treesEnabled={treesEnabled}
        setTreesEnabled={setTreesEnabled}
      />

      <section className="map-panel">
        <div ref={mapElementRef} className={"map-container" + (viewMode === 'cesium' ? ' map-container-hidden' : '')} />
        <div className="map-top-chip"><span className="chip-dot" /> NASHIK <span className="chip-divider">/</span> MAHARASHTRA, INDIA</div>
        <MapModeControls viewMode={viewMode} onChange={setView} />
        <TreeColorLegend />
        {viewMode === 'cesium' && (
          <Suspense fallback={<div className="cesium-loading">Loading CesiumJS globe…</div>}>
            <CesiumGlobe
              healthFilter={healthFilter}
              speciesFilter={speciesFilter}
              treesEnabled={treesEnabled}
              onSelect={handleCesiumSelect}
              onStatus={handleCesiumStatus}
              onCounts={handleCesiumCounts}
              onReady={handleCesiumReady}
            />
          </Suspense>
        )}
        <div className="map-bottom-note">Drag to explore <span>·</span> Scroll to zoom <span>·</span> Click a tree to inspect</div>
        <TreeDetailsPopup
          tree={selectedTree}
          onClose={() => {
            setSelectedTree(null);
            if (treeLayerRef.current) treeLayerRef.current.setSelected(null);
          }}
          onFocus={() => focusTree(selectedTree)}
        />
        <div className="map-attribution">{viewMode === 'cesium' ? 'CESIUMJS GLOBE · ESRI WORLD IMAGERY' : viewMode === 'satellite' ? 'SATELLITE IMAGERY · ESRI WORLD IMAGERY' : 'TREE DATA: GEOSERVER · BASEMAP: OPENFREEMAP / OSM'}</div>
      </section>
    </main>
  );
}
