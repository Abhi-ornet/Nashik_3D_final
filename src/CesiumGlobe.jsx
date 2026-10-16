import { useEffect, useRef } from 'react';
import {
  Cartesian3,
  Color,
  ColorBlendMode,
  createOsmBuildingsAsync,
  Credit,
  createWorldTerrainAsync,
  HeightReference,
  Ion,
  HeadingPitchRoll,
  CustomDataSource,
  EllipsoidTerrainProvider,
  Math as CesiumMath,
  ScreenSpaceEventHandler,
  ScreenSpaceEventType,
  Transforms,
  UrlTemplateImageryProvider,
  Viewer,
} from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import {
  CESIUM_IMAGE_MAX_LEVEL,
  CESIUM_MAX_TREES,
  CESIUM_PAGE_SIZE,
  CESIUM_START_HEIGHT_METERS,
  SATELLITE_TILE_URL,
  START_CENTER,
  TREE_LAYER,
  WFS_URL,
} from './config/mapConfig.js';
import { CESIUM_TREE_MODELS, TREE_APPEARANCE_COLORS, TREE_MODEL_HEIGHT_LIMITS } from './config/treeRendering.js';
import { chooseTreeModel, getCqlFilter, getTreeAppearance, normalizeTree, PROPERTY_NAMES } from './data/treeData.js';


function rectangleToBounds(rectangle) {
  const west = CesiumMath.toDegrees(rectangle.west);
  const south = CesiumMath.toDegrees(rectangle.south);
  const east = CesiumMath.toDegrees(rectangle.east);
  const north = CesiumMath.toDegrees(rectangle.north);
  // Avoid querying a whole hemisphere if the globe view is zoomed far out.
  const width = east >= west ? east - west : 360 - west + east;
  if (!Number.isFinite(width) || width > 0.8 || north - south > 0.8) return null;
  return { west, south, east, north };
}

function getTreeBounds(viewer) {
  const rectangle = viewer.camera.computeViewRectangle(viewer.scene.globe.ellipsoid);
  const viewportBounds = rectangle ? rectangleToBounds(rectangle) : null;
  if (viewportBounds && viewportBounds.east - viewportBounds.west < 0.18 && viewportBounds.north - viewportBounds.south < 0.18) {
    return viewportBounds;
  }

  // Low, oblique views often have a huge/undefined ellipsoid rectangle because
  // the top of the camera frustum points into the sky. Query in front of the
  // camera instead of dropping the trees or fetching a city-sized area.
  const cameraPosition = viewer.camera.positionCartographic;
  const longitude = CesiumMath.toDegrees(cameraPosition.longitude);
  const latitude = CesiumMath.toDegrees(cameraPosition.latitude);
  const nearNashik = longitude > 73.55 && longitude < 74.05 && latitude > 19.75 && latitude < 20.35;
  if (!nearNashik || cameraPosition.height > 30000) return null;

  const pitch = Math.max(CesiumMath.toRadians(4), Math.min(CesiumMath.PI_OVER_TWO, Math.abs(viewer.camera.pitch)));
  const forwardDistance = Math.min(6000, cameraPosition.height / Math.tan(pitch));
  const heading = viewer.camera.heading;
  const targetLatitude = latitude + (forwardDistance * Math.cos(heading)) / 111320;
  const longitudeScale = Math.max(0.2, Math.cos(CesiumMath.toRadians(latitude)));
  const targetLongitude = longitude + (forwardDistance * Math.sin(heading)) / (111320 * longitudeScale);
  const halfLatitude = Math.max(0.0045, Math.min(0.025, (forwardDistance * 0.65) / 111320 + 0.0035));
  const halfLongitude = halfLatitude / longitudeScale;
  return {
    west: targetLongitude - halfLongitude,
    south: targetLatitude - halfLatitude,
    east: targetLongitude + halfLongitude,
    north: targetLatitude + halfLatitude,
  };
}

function drawTrees(viewer, dataSource, trees, treeEntityMap) {
  dataSource.entities.removeAll();
  treeEntityMap.clear();

  trees.forEach((tree) => {
    const modelKey = chooseTreeModel(tree);
    const modelAsset = CESIUM_TREE_MODELS[modelKey];
    const height = Math.max(TREE_MODEL_HEIGHT_LIMITS.min, Math.min(TREE_MODEL_HEIGHT_LIMITS.max, Number(tree.heightMeters) || 8));
    const position = Cartesian3.fromDegrees(tree.x, tree.y, 0.5);
    const hash = String(tree.uid || tree.id)
      .split('')
      .reduce((sum, char) => (Math.imul(sum, 31) + char.charCodeAt(0)) >>> 0, 0);
    const heading = CesiumMath.toRadians(hash % 360);
    const appearance = getTreeAppearance(tree);
    const foliageColor = Color.fromCssColorString(TREE_APPEARANCE_COLORS[appearance] || TREE_APPEARANCE_COLORS.default);

    const entity = dataSource.entities.add({
      id: tree.id,
      name: tree.localName,
      position,
      orientation: Transforms.headingPitchRollQuaternion(
        position,
        new HeadingPitchRoll(heading, 0, 0),
      ),
      model: {
        uri: modelAsset.url,
        heightReference: HeightReference.CLAMP_TO_GROUND,
        scale: height / modelAsset.height,
        minimumPixelSize: 2,
        maximumScale: 2.4,
        runAnimations: false,
        color: foliageColor,
        colorBlendMode: ColorBlendMode.MIX,
        colorBlendAmount: 0.10,
      },
      properties: {
        treeId: tree.id,
        treeUid: tree.uid,
        treeName: tree.localName,
        health: tree.healthLabel,
        appearance,
        heritage: tree.isHeritage,
        species: tree.speciesGroup,
      },
    });
    treeEntityMap.set(entity.id, tree);
  });

  if (viewer.scene.requestRenderMode) viewer.scene.requestRender();
}

export default function CesiumGlobe({
  healthFilter,
  speciesFilter,
  treesEnabled,
  onSelect,
  onStatus,
  onCounts,
  onReady,
}) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const dataSourceRef = useRef(null);
  const treeEntityMapRef = useRef(new Map());
  const treesRef = useRef([]);
  const filtersRef = useRef({ health: healthFilter, species: speciesFilter });
  const enabledRef = useRef(treesEnabled);
  const onSelectRef = useRef(onSelect);
  const onStatusRef = useRef(onStatus);
  const onCountsRef = useRef(onCounts);
  const onReadyRef = useRef(onReady);
  const requestControllerRef = useRef(null);
  const queryTimerRef = useRef(null);
  const queryRef = useRef(() => {});
  const disposedRef = useRef(false);

  filtersRef.current = { health: healthFilter, species: speciesFilter };
  enabledRef.current = treesEnabled;
  onSelectRef.current = onSelect;
  onStatusRef.current = onStatus;
  onCountsRef.current = onCounts;
  onReadyRef.current = onReady;

  useEffect(() => {
    if (!containerRef.current) return undefined;
    disposedRef.current = false;

    let viewer;
    let handler;
    let removeMoveEnd;
    let resizeObserver;
    let buildingsTileset = null;

    try {
      viewer = new Viewer(containerRef.current, {
        animation: false,
        timeline: false,
        baseLayerPicker: false,
        geocoder: false,
        homeButton: true,
        // Keep Cesium's native 2D / Columbus View / 3D mode selector visible.
        sceneModePicker: true,
        navigationHelpButton: true,
        navigationInstructionsInitiallyVisible: false,
        fullscreenButton: false,
        vrButton: false,
        infoBox: false,
        selectionIndicator: false,
        baseLayer: false,
        terrainProvider: new EllipsoidTerrainProvider(),
        scene3DOnly: false,
        shouldAnimate: false,
        requestRenderMode: true,
        maximumRenderTimeChange: Infinity,
      });
    } catch (error) {
      onStatusRef.current?.('Cesium initialization failed: ' + error.message);
      return undefined;
    }

    viewerRef.current = viewer;
    viewer.scene.globe.show = true;
    viewer.scene.globe.baseColor = Color.fromCssColorString('#17251d');
    viewer.scene.globe.enableLighting = true;
    viewer.scene.skyAtmosphere.show = true;
    // Start from a real globe view even if a 2D mode was selected earlier.
    viewer.scene.morphTo3D(0);

    // The optional OSM 3D building backdrop uses the user's Cesium ion token.
    // The trees continue to work when no token is configured.
    const ionToken = import.meta.env.VITE_CESIUM_ION_ACCESS_TOKEN?.trim();
    if (ionToken) {
      Ion.defaultAccessToken = ionToken;
      createWorldTerrainAsync({ requestVertexNormals: true })
        .then((terrainProvider) => {
          if (disposedRef.current || viewer.isDestroyed()) return;
          viewer.terrainProvider = terrainProvider;
          viewer.scene.requestRender();
        })
        .catch((error) => console.warn('Cesium World Terrain could not load:', error));
      createOsmBuildingsAsync({ showOutline: false })
        .then((tileset) => {
          if (disposedRef.current || viewer.isDestroyed()) {
            tileset.destroy();
            return;
          }
          buildingsTileset = viewer.scene.primitives.add(tileset);
          viewer.scene.requestRender();
        })
        .catch((error) => console.warn('Cesium OSM buildings could not load:', error));
    }

    const imagery = new UrlTemplateImageryProvider({
      url: SATELLITE_TILE_URL,
      maximumLevel: CESIUM_IMAGE_MAX_LEVEL,
      credit: new Credit('Source: Esri, Vantor, Earthstar Geographics, and the GIS User Community'),
    });
    viewer.imageryLayers.addImageryProvider(imagery);

    const dataSource = new CustomDataSource('nashik-tree-census');
    dataSourceRef.current = dataSource;
    viewer.dataSources.add(dataSource);

    viewer.camera.setView({
      destination: Cartesian3.fromDegrees(START_CENTER[0], START_CENTER[1], CESIUM_START_HEIGHT_METERS),
      orientation: {
        heading: CesiumMath.toRadians(12),
        pitch: CesiumMath.toRadians(-8),
        roll: 0,
      },
    });

    queryRef.current = async () => {
      const currentViewer = viewerRef.current;
      if (!currentViewer || currentViewer.isDestroyed() || disposedRef.current) return;
      if (requestControllerRef.current) requestControllerRef.current.abort();
      const controller = new AbortController();
      requestControllerRef.current = controller;

      const bounds = getTreeBounds(currentViewer);
      if (!bounds) {
        treesRef.current = [];
        dataSource.entities.removeAll();
        treeEntityMapRef.current.clear();
        onCountsRef.current?.({ matched: 0, loaded: 0 });
        onStatusRef.current?.('Zoom into the Nashik tree-census coverage to load inventory records.');
        currentViewer.scene.requestRender();
        return;
      }
      const filters = filtersRef.current;
      const cqlFilter = getCqlFilter(filters, {
        getWest: () => bounds.west,
        getSouth: () => bounds.south,
        getEast: () => bounds.east,
        getNorth: () => bounds.north,
      });
      const paramsFor = (startIndex) => {
        const params = new URLSearchParams({
          service: 'WFS',
          version: '2.0.0',
          request: 'GetFeature',
          typeNames: TREE_LAYER,
          outputFormat: 'application/json',
          srsName: 'CRS:84',
          count: String(CESIUM_PAGE_SIZE),
          startIndex: String(startIndex),
          propertyName: PROPERTY_NAMES,
        });
        params.set('CQL_FILTER', cqlFilter);
        return WFS_URL + '?' + params.toString();
      };

      onStatusRef.current?.('Querying trees for the Cesium globe…');
      try {
        const response = await fetch(paramsFor(0), { signal: controller.signal });
        if (!response.ok) throw new Error('GeoServer returned HTTP ' + response.status);
        const firstPage = await response.json();
        if (firstPage.type !== 'FeatureCollection' || !Array.isArray(firstPage.features)) {
          throw new Error('GeoServer did not return GeoJSON');
        }
        if (controller.signal.aborted) return;

        const matchedRaw = Number(firstPage.numberMatched ?? firstPage.totalFeatures ?? firstPage.features.length);
        const matched = Number.isFinite(matchedRaw) ? matchedRaw : firstPage.features.length;
        const target = Math.min(matched || firstPage.features.length, CESIUM_MAX_TREES);
        const offsets = [];
        for (let start = CESIUM_PAGE_SIZE; start < target; start += CESIUM_PAGE_SIZE) offsets.push(start);
        const pages = await Promise.all(offsets.map(async (startIndex) => {
          const pageResponse = await fetch(paramsFor(startIndex), { signal: controller.signal });
          if (!pageResponse.ok) throw new Error('GeoServer returned HTTP ' + pageResponse.status);
          const page = await pageResponse.json();
          if (page.type !== 'FeatureCollection' || !Array.isArray(page.features)) {
            throw new Error('GeoServer returned an invalid feature page');
          }
          return page.features;
        }));
        if (controller.signal.aborted || disposedRef.current) return;

        const normalized = [firstPage.features, ...pages].flat().map(normalizeTree).filter(Boolean);
        treesRef.current = normalized;
        onCountsRef.current?.({ matched, loaded: normalized.length });
        drawTrees(currentViewer, dataSource, enabledRef.current ? normalized : [], treeEntityMapRef.current);
        onStatusRef.current?.(
          matched > normalized.length
            ? `Cesium loaded ${normalized.length.toLocaleString()} of ${matched.toLocaleString()} trees in view; zoom in for more detail.`
            : `Cesium loaded all ${normalized.length.toLocaleString()} trees in view.`,
        );
      } catch (error) {
        if (error.name === 'AbortError') return;
        onStatusRef.current?.('Cesium data error: ' + error.message);
        onCountsRef.current?.({ matched: 0, loaded: 0 });
      }
    };

    const scheduleQuery = () => {
      clearTimeout(queryTimerRef.current);
      queryTimerRef.current = setTimeout(() => queryRef.current(), 260);
    };
    removeMoveEnd = viewer.camera.moveEnd.addEventListener(scheduleQuery);
    handler = new ScreenSpaceEventHandler(viewer.scene.canvas);
    handler.setInputAction((movement) => {
      const picked = viewer.scene.pick(movement.position);
      const entityId = picked?.id?.id ?? picked?.id;
      const tree = entityId ? treeEntityMapRef.current.get(entityId) : null;
      onSelectRef.current?.(tree || null);
    }, ScreenSpaceEventType.LEFT_CLICK);

    resizeObserver = new ResizeObserver(() => {
      if (!viewer.isDestroyed()) {
        viewer.resize();
        viewer.scene.requestRender();
      }
    });
    resizeObserver.observe(containerRef.current);

    const controls = {
      viewer,
      flyToTree(tree) {
        viewer.camera.flyTo({
          destination: Cartesian3.fromDegrees(tree.x, tree.y, Math.max(180, (Number(tree.heightMeters) || 8) * 24)),
          orientation: {
            heading: CesiumMath.toRadians(0),
            pitch: CesiumMath.toRadians(-35),
            roll: 0,
          },
          duration: 1.2,
        });
      },
    };
    onReadyRef.current?.(controls);
    // Give the camera one frame to establish a view rectangle before fetching.
    viewer.scene.requestRender();
    queryRef.current();

    return () => {
      disposedRef.current = true;
      clearTimeout(queryTimerRef.current);
      if (requestControllerRef.current) requestControllerRef.current.abort();
      if (removeMoveEnd) removeMoveEnd();
      if (handler && !handler.isDestroyed()) handler.destroy();
      if (resizeObserver) resizeObserver.disconnect();
      if (buildingsTileset && viewer && !viewer.isDestroyed()) {
        viewer.scene.primitives.remove(buildingsTileset);
      }
      onReadyRef.current?.(null);
      if (viewer && !viewer.isDestroyed()) viewer.destroy();
      viewerRef.current = null;
      dataSourceRef.current = null;
      treeEntityMapRef.current.clear();
    };
  }, []);

  useEffect(() => {
    if (viewerRef.current && !viewerRef.current.isDestroyed()) {
      clearTimeout(queryTimerRef.current);
      queryTimerRef.current = setTimeout(() => queryRef.current(), 100);
    }
  }, [healthFilter, speciesFilter]);

  useEffect(() => {
    if (viewerRef.current && dataSourceRef.current) {
      drawTrees(
        viewerRef.current,
        dataSourceRef.current,
        treesEnabled ? treesRef.current : [],
        treeEntityMapRef.current,
      );
    }
  }, [treesEnabled]);

  return (
    <div className="cesium-view-shell">
      <div ref={containerRef} className="cesium-globe-container" />
      <div className="cesium-mode-chip"><span className="cesium-mode-dot" /> CESIUMJS <span>/</span> 3D GLOBE</div>
      <div className="cesium-mode-note">Left-drag to rotate <span>·</span> Middle-drag to tilt <span>·</span> Scroll / right-drag to zoom <span>·</span> Use top-right scene picker for 2D / 3D</div>
    </div>
  );
}
