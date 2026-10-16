import * as maplibregl from 'maplibre-gl';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { START_CENTER } from '../config/mapConfig.js';
import {
  DETAIL_MAX_TREES,
  DETAIL_ZOOM,
  FOLIAGE_MATERIAL,
  HEALTH_BLEND,
  TREE_APPEARANCE_COLORS,
  TREE_CUT_MODEL,
  TREE_DETAIL_MODELS,
  TREE_INSTANCE_VARIATION,
  TREE_LIGHTING,
  TREE_MODELS,
  TREE_MODEL_HEIGHT_LIMITS,
  TREE_RENDERER,
} from '../config/treeRendering.js';
import { chooseTreeModel, getTreeAppearance } from '../data/treeData.js';

export function createTreeLayer() {
  let map, renderer, scene, camera;
  let trunkGeometry, crownGeometry, trunkMaterial, crownMaterial;
  let trunkInstances, lowerCrownInstances, middleCrownInstances, topCrownInstances;
  let selectedMarker, localToMercator, sceneOrigin, metersToMercator;
  let visibleTrees = [];
  let selectedId = null;
  let useRealModels = false;
  let detailedModelsReady = false;
  let detailedModelsRequested = false;
  let treeCutModelReady = false;
  let removed = false;
  const preparedModels = new Map();
  const realModelInstances = [];

  function removeInstanceMesh(mesh) {
    if (!mesh) return;
    scene.remove(mesh);
    // Mesh disposal releases instance buffers; shared geometry/material stay alive until onRemove.
    if (typeof mesh.dispose === 'function') mesh.dispose();
  }

  function clearRealModelInstances() {
    while (realModelInstances.length) removeInstanceMesh(realModelInstances.pop());
  }

  function disposeModelAsset(model) {
    for (const part of model.parts) {
      part.geometry.dispose();
      if (part.material.map) part.material.map.dispose();
      part.material.dispose();
    }
  }

  function disposePreparedModels(predicate = () => true) {
    for (const [key, model] of preparedModels) {
      if (!predicate(key, model)) continue;
      disposeModelAsset(model);
      preparedModels.delete(key);
    }
  }

  function prepareModel(gltf) {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const transformed = [];
    const bounds = new THREE.Box3();

    root.traverse((node) => {
      if (!node.isMesh || !node.geometry || !node.material) return;
      const geometry = node.geometry.clone();
      geometry.applyMatrix4(node.matrixWorld);
      geometry.computeBoundingBox();
      bounds.union(geometry.boundingBox);
      transformed.push({
        geometry,
        material: Array.isArray(node.material) ? node.material[0] : node.material,
      });
    });

    if (!transformed.length || bounds.isEmpty()) throw new Error('Tree model contained no mesh geometry');

    const modelHeight = bounds.max.y - bounds.min.y;
    if (!Number.isFinite(modelHeight) || modelHeight <= 0) throw new Error('Tree model has invalid dimensions');

    // GLB uses Y-up; the MapLibre custom 3D layer uses local Z-up metres.
    const centerX = (bounds.min.x + bounds.max.x) * 0.5;
    const centerZ = (bounds.min.z + bounds.max.z) * 0.5;
    const groups = new Map();
    transformed.forEach(({ geometry, material }) => {
      geometry.translate(-centerX, -bounds.min.y, -centerZ);
      geometry.rotateX(Math.PI / 2);
      const attributeKey = Object.keys(geometry.attributes).sort().join(',');
      const key = material.uuid + '|' + attributeKey;
      if (!groups.has(key)) groups.set(key, { geometries: [], material });
      groups.get(key).geometries.push(geometry);
    });

    const parts = [];
    for (const { geometries, material } of groups.values()) {
      const merged = geometries.length === 1 ? geometries[0] : mergeGeometries(geometries, false);
      if (!merged) {
        geometries.forEach((geometry) => geometry.dispose());
        throw new Error('Could not merge a tree model material batch');
      }
      geometries.forEach((geometry) => {
        if (geometry !== merged) geometry.dispose();
      });
      merged.computeBoundingSphere();

      const materialClone = material.clone();
      const isFoliage = !/bark|trunk|wood/i.test(material.name || '');
      if (isFoliage) {
        // Keep the GLB's original greens (leaf / leaf_light or per-part green values).
        // Matte, non-metallic leaves reduce blown-out specular highlights.
        materialClone.side = THREE.DoubleSide;
        materialClone.roughness = FOLIAGE_MATERIAL.roughness;
        materialClone.metalness = FOLIAGE_MATERIAL.metalness;
        // Mix health color with the GLB's natural leaf color instead of multiplying it,
        // which would muddy reds/yellows against green foliage.
        materialClone.onBeforeCompile = (shader) => {
          shader.fragmentShader = shader.fragmentShader.replace(
            '#include <color_fragment>',
            THREE.ShaderChunk.color_fragment
              .replace(
                '#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )',
                '#if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA ) || defined( USE_INSTANCING_COLOR )'
              )
              .replace(
                'diffuseColor *= vColor;',
              'diffuseColor.rgb = mix(diffuseColor.rgb, vColor.rgb, ' + Number(HEALTH_BLEND).toFixed(1) + ');\n\tdiffuseColor.a *= vColor.a;'
            )
          );
        };
        materialClone.customProgramCacheKey = () => 'canopy-foliage-property-color-v2';
      }

      parts.push({ geometry: merged, material: materialClone, isFoliage });
    }

    // Release GLTF source geometries; merged buffers/material clones are used by the layer.
    root.traverse((node) => {
      if (node.isMesh && node.geometry) node.geometry.dispose();
    });
    return { parts, height: modelHeight };
  }

  function buildRealModelInstances(trees) {
    const wantsDetailed = Boolean(
      map && map.getZoom() >= DETAIL_ZOOM && detailedModelsReady && trees.length <= DETAIL_MAX_TREES,
    );
    const buckets = new Map();
    // Scale stumps relative to the average recorded height of trees currently visible.
    const measuredHeights = trees
      .map((tree) => Number(tree.heightMeters))
      .filter((height) => Number.isFinite(height) && height > 0);
    const averageTreeHeight = measuredHeights.length
      ? measuredHeights.reduce((sum, height) => sum + height, 0) / measuredHeights.length
      : 8;
    const stumpHeightMeters = Math.max(2.5, Math.min(4.5, averageTreeHeight * 0.32));
    trees.forEach((tree) => {
      // Recognize values such as Dead, Mechanically Cut, TreeCut, Cut Tree, and Uprooted.
      const condition = String(tree.healthCondition || tree.healthLabel || '').trim().toLowerCase();
      const normalizedCondition = condition.replace(/[^a-z]/g, '');
      const isTreeCut = /dead|mechanicallycut|treecut|cuttree|cut|uprooted/.test(normalizedCondition);
      if (wantsDetailed && treeCutModelReady && isTreeCut) {
        if (!buckets.has('treecut')) buckets.set('treecut', []);
        buckets.get('treecut').push(tree);
        return;
      }
      // Local palm aliases are reclassified only in detail zoom. The original
      // chooseTreeModel behavior, and therefore the zoomed-out tier, stays unchanged.
      const localName = String(tree.localName || '').trim().toLowerCase().replace(/\s+/g, ' ');
      const isPalmAlias = /\bpalm\b|coconut|areca|date\s+palm|\bnaral\b|\bnarikel\b|\bsupari\b|\bkhajur\b/.test(localName);
      const key = wantsDetailed && isPalmAlias ? 'palm' : chooseTreeModel(tree);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key).push(tree);
    });

    for (const [key, modelTrees] of buckets) {
      const model = preparedModels.get(wantsDetailed ? key + ':detailed' : key) || preparedModels.get(key);
      if (!model) throw new Error('Tree model not loaded: ' + key);

      model.parts.forEach((part) => {
        const instances = new THREE.InstancedMesh(part.geometry, part.material, modelTrees.length);
        instances.instanceMatrix.setUsage(THREE.StaticDrawUsage);
        const transform = new THREE.Object3D();
        const instanceColor = new THREE.Color();

        modelTrees.forEach((tree, index) => {
          const point = toLocalMeters(tree);
          const height = key === 'treecut'
            ? stumpHeightMeters
            : Math.max(TREE_MODEL_HEIGHT_LIMITS.min, Math.min(TREE_MODEL_HEIGHT_LIMITS.max, Number(tree.heightMeters) || 8));
          const scale = height / model.height;
          const seed = String(tree.uid || tree.id).split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
          transform.position.set(point.x, point.y, 0);
          transform.rotation.set(0, 0, (seed % 360) * Math.PI / 180);
          // Mild, deterministic crown-width variation breaks up repeated silhouettes
          // without changing the census height represented by the tree.
          const widthVariation = TREE_INSTANCE_VARIATION.widthBase + (seed % TREE_INSTANCE_VARIATION.widthSteps) * TREE_INSTANCE_VARIATION.widthStep;
          const stumpWidthScale = key === 'treecut' ? 1.65 : 1.0;
          transform.scale.set(scale * widthVariation * stumpWidthScale, scale * widthVariation * stumpWidthScale, scale);
          transform.updateMatrix();
          instances.setMatrixAt(index, transform.matrix);

          if (part.isFoliage && key !== 'treecut') {
            const appearance = getTreeAppearance(tree);
            const foliageColor = TREE_APPEARANCE_COLORS[appearance] || TREE_APPEARANCE_COLORS.default;
            const colorVariation = TREE_INSTANCE_VARIATION.colorBase + (seed % TREE_INSTANCE_VARIATION.colorSteps) * TREE_INSTANCE_VARIATION.colorStep;
            instances.setColorAt(index, instanceColor.set(foliageColor).multiplyScalar(colorVariation));
          }
        });

        instances.instanceMatrix.needsUpdate = true;
        if (instances.instanceColor) instances.instanceColor.needsUpdate = true;
        instances.computeBoundingSphere();
        scene.add(instances);
        realModelInstances.push(instances);
      });
    }
  }

  function loadModelSet(modelSet, suffix = '') {
    const loader = new GLTFLoader();
    return Promise.all(Object.entries(modelSet).map(([key, url]) => new Promise((resolve) => {
      loader.load(
        url,
        (gltf) => {
          try {
            preparedModels.set(key + suffix, prepareModel(gltf));
            resolve(true);
          } catch (error) {
            console.warn('Could not prepare tree model ' + key + suffix + ':', error);
            resolve(false);
          }
        },
        undefined,
        (error) => {
          console.warn('Could not load tree model ' + key + suffix + ':', error);
          resolve(false);
        },
      );
    })));
  }

  function loadTreeCutModel() {
    const loader = new GLTFLoader();
    loader.load(
      TREE_CUT_MODEL,
      (gltf) => {
        if (removed) {
          gltf.scene.traverse((node) => {
            if (node.isMesh) {
              node.geometry?.dispose();
              const materials = Array.isArray(node.material) ? node.material : [node.material];
              materials.forEach((material) => material?.dispose());
            }
          });
          return;
        }
        try {
          preparedModels.set('treecut', prepareModel(gltf));
          treeCutModelReady = true;
          rebuild(visibleTrees);
          if (map) map.triggerRepaint();
        } catch (error) {
          console.warn('Could not prepare TreeCut stump model:', error);
        }
      },
      undefined,
      (error) => console.warn('Could not load TreeCut stump model:', error),
    );
  }

  function loadTreeModels() {
    loadModelSet(TREE_MODELS).then((results) => {
      if (removed) {
        disposePreparedModels();
        return;
      }
      useRealModels = results.every(Boolean) &&
        Object.keys(TREE_MODELS).every((key) => preparedModels.has(key));
      if (!useRealModels) {
        console.warn('Using procedural trees because one or more downloaded GLB assets did not load.');
        disposePreparedModels();
      }
      rebuild(visibleTrees);
      if (map) map.triggerRepaint();
    });
  }

  function loadDetailedTreeModels() {
    if (detailedModelsRequested || removed || !useRealModels) return;
    detailedModelsRequested = true;
    loadModelSet(TREE_DETAIL_MODELS, ':detailed').then((results) => {
      if (removed) {
        disposePreparedModels((key) => key.endsWith(':detailed'));
        return;
      }
      detailedModelsReady = results.every(Boolean) &&
        Object.keys(TREE_DETAIL_MODELS).every((key) => preparedModels.has(key + ':detailed'));
      if (!detailedModelsReady) {
        console.warn('Detailed tree LOD could not fully load; keeping lightweight tree models.');
        disposePreparedModels((key) => key.endsWith(':detailed'));
      } else {
        // Use detailed leaves only if the camera is still zoomed in close.
        rebuild(visibleTrees);
        if (map) map.triggerRepaint();
      }
    });
  }

  function clearSelectionMarker() {
    if (!selectedMarker) return;
    scene.remove(selectedMarker);
    selectedMarker.geometry.dispose();
    selectedMarker.material.dispose();
    selectedMarker = null;
  }

  function toLocalMeters(tree) {
    const point = maplibregl.MercatorCoordinate.fromLngLat([tree.x, tree.y], 0);
    return {
      x: (point.x - sceneOrigin.x) / metersToMercator,
      y: (sceneOrigin.y - point.y) / metersToMercator,
    };
  }

  function updateSelection() {
    clearSelectionMarker();
    if (!selectedId) return;
    const tree = visibleTrees.find((item) => item.id === selectedId);
    if (!tree) return;

    const point = toLocalMeters(tree);
    const height = Math.max(2.5, Math.min(28, Number(tree.heightMeters) || 8));
    selectedMarker = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.65, height * 0.12), 10, 8),
      new THREE.MeshBasicMaterial({ color: '#f4fff5', wireframe: true })
    );
    selectedMarker.position.set(point.x, point.y, height * 0.9);
    scene.add(selectedMarker);
  }

  function rebuild(trees) {
    if (!scene || !map) return;
    visibleTrees = trees;

    removeInstanceMesh(trunkInstances);
    removeInstanceMesh(lowerCrownInstances);
    removeInstanceMesh(middleCrownInstances);
    removeInstanceMesh(topCrownInstances);
    trunkInstances = lowerCrownInstances = middleCrownInstances = topCrownInstances = null;
    clearSelectionMarker();
    clearRealModelInstances();
    if (!trees.length) return;

    if (useRealModels) {
      try {
        buildRealModelInstances(trees);
        updateSelection();
        return;
      } catch (error) {
        console.warn('Realistic tree instancing failed; retaining procedural fallback:', error);
        clearRealModelInstances();
        useRealModels = false;
      }
    }

    trunkInstances = new THREE.InstancedMesh(trunkGeometry, trunkMaterial, trees.length);
    lowerCrownInstances = new THREE.InstancedMesh(crownGeometry, crownMaterial, trees.length);
    middleCrownInstances = new THREE.InstancedMesh(crownGeometry, crownMaterial, trees.length);
    topCrownInstances = new THREE.InstancedMesh(crownGeometry, crownMaterial, trees.length);

    const meshes = [trunkInstances, lowerCrownInstances, middleCrownInstances, topCrownInstances];
    meshes.forEach((mesh) => mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage));
    const transform = new THREE.Object3D();
    const instanceColor = new THREE.Color();

    trees.forEach((tree, index) => {
      const point = toLocalMeters(tree);
      const height = Math.max(2.5, Math.min(28, Number(tree.heightMeters) || 8));
      const trunkHeight = height * 0.36;
      const crownHeight = height * 0.64;
      const crownRadius = Math.max(2.0, Math.min(5.0, height * 0.28));
      const appearance = getTreeAppearance(tree);
      const foliageColor = TREE_APPEARANCE_COLORS[appearance] || TREE_APPEARANCE_COLORS.default;

      transform.position.set(point.x, point.y, trunkHeight * 0.5);
      transform.scale.set(0.16, 0.16, trunkHeight);
      transform.rotation.set(0, 0, 0);
      transform.updateMatrix();
      trunkInstances.setMatrixAt(index, transform.matrix);

      const crowns = [
        { mesh: lowerCrownInstances, radius: crownRadius, z: trunkHeight + crownHeight * 0.27, vertical: 0.76 },
        { mesh: middleCrownInstances, radius: crownRadius * 0.79, z: trunkHeight + crownHeight * 0.52, vertical: 0.82 },
        { mesh: topCrownInstances, radius: crownRadius * 0.58, z: trunkHeight + crownHeight * 0.74, vertical: 0.9 },
      ];

      crowns.forEach((crown) => {
        transform.position.set(point.x, point.y, crown.z);
        transform.scale.set(crown.radius, crown.radius * 0.94, crown.radius * crown.vertical);
        transform.updateMatrix();
        crown.mesh.setMatrixAt(index, transform.matrix);
        crown.mesh.setColorAt(index, instanceColor.set(foliageColor));
      });
    });

    meshes.forEach((mesh) => {
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    });
    scene.add(...meshes);
    updateSelection();
  }

  return {
    id: 'tree-models-3d',
    type: 'custom',
    renderingMode: '3d',

    onAdd(mapInstance, gl) {
      map = mapInstance;
      scene = new THREE.Scene();
      camera = new THREE.Camera();
      sceneOrigin = maplibregl.MercatorCoordinate.fromLngLat(START_CENTER, 0);
      metersToMercator = sceneOrigin.meterInMercatorCoordinateUnits();
      localToMercator = new THREE.Matrix4()
        .makeTranslation(sceneOrigin.x, sceneOrigin.y, sceneOrigin.z)
        .scale(new THREE.Vector3(metersToMercator, -metersToMercator, metersToMercator));

      trunkGeometry = new THREE.CylinderGeometry(0.13, 0.19, 1, 6);
      trunkGeometry.rotateX(Math.PI / 2);
      crownGeometry = new THREE.IcosahedronGeometry(1, 0);
      trunkMaterial = new THREE.MeshStandardMaterial({ color: '#77533a', roughness: 1 });
      crownMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 });

      // Softer, more neutral light reduces washed-out leaf faces over satellite imagery.
      const hemisphere = new THREE.HemisphereLight(
        TREE_LIGHTING.hemisphere.skyColor,
        TREE_LIGHTING.hemisphere.groundColor,
        TREE_LIGHTING.hemisphere.intensity,
      );
      const keyLight = new THREE.DirectionalLight(TREE_LIGHTING.key.color, TREE_LIGHTING.key.intensity);
      keyLight.position.set(...TREE_LIGHTING.key.position);
      const fillLight = new THREE.DirectionalLight(TREE_LIGHTING.fill.color, TREE_LIGHTING.fill.intensity);
      fillLight.position.set(...TREE_LIGHTING.fill.position);
      scene.add(hemisphere, keyLight, fillLight);

      renderer = new THREE.WebGLRenderer({
        canvas: map.getCanvas(),
        context: gl,
        antialias: true,
      });
      renderer.autoClear = false;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = TREE_RENDERER.toneMappingExposure;
      loadTreeModels();
      loadTreeCutModel();
    },

    render(_gl, args) {
      if (!renderer) return;
      camera.projectionMatrix
        .fromArray(args.defaultProjectionData.mainMatrix)
        .multiply(localToMercator);
      camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
      renderer.resetState();
      renderer.render(scene, camera);
    },

    updateTrees(trees) {
      rebuild(trees);
      if (map) map.triggerRepaint();
    },

    ensureDetailModels(treeCount = visibleTrees.length) {
      if (
        map &&
        map.getZoom() >= DETAIL_ZOOM &&
        treeCount > 0 &&
        treeCount <= DETAIL_MAX_TREES
      ) {
        loadDetailedTreeModels();
      }
    },

    setSelected(id) {
      selectedId = id;
      updateSelection();
      if (map) map.triggerRepaint();
    },

    onRemove() {
      removed = true;
      clearRealModelInstances();
      disposePreparedModels();
      if (renderer) renderer.dispose();
      if (trunkGeometry) trunkGeometry.dispose();
      if (crownGeometry) crownGeometry.dispose();
      if (trunkMaterial) trunkMaterial.dispose();
      if (crownMaterial) crownMaterial.dispose();
      clearSelectionMarker();
    },
  };
}

