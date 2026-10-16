import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const samples = [
  { id: 'quaternius-tree-1', title: 'Common Tree 1', filename: 'quaternius-common-tree-1.glb', bytes: 516044, triangles: 6257, meshes: 1, materials: 2, textures: 3, kind: 'Stylized broadleaf', tags: ['low-poly', 'broadleaf'], description: 'Stylized, textured tree from the Quaternius Stylized Nature MegaKit.', url: '/models/samples/quaternius-common-tree-1.glb', source: 'https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md', sourceLabel: 'Quaternius CC0 pack' },
  { id: 'quaternius-tree-2', title: 'Common Tree 2', filename: 'quaternius-common-tree-2.glb', bytes: 446732, triangles: 5625, meshes: 1, materials: 2, textures: 3, kind: 'Stylized broadleaf', tags: ['low-poly', 'broadleaf'], description: 'A second stylized broadleaf silhouette with embedded textures.', url: '/models/samples/quaternius-common-tree-2.glb', source: 'https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md', sourceLabel: 'Quaternius CC0 pack' },
  { id: 'quaternius-tree-4', title: 'Common Tree 4', filename: 'quaternius-common-tree-3.glb', bytes: 332440, triangles: 4065, meshes: 1, materials: 2, textures: 3, kind: 'Stylized broadleaf', tags: ['low-poly', 'broadleaf'], description: 'The lightest of the three textured Quaternius models by triangle count.', url: '/models/samples/quaternius-common-tree-3.glb', source: 'https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md', sourceLabel: 'Quaternius CC0 pack' },
  { id: 'city-tree', title: 'Low-poly City Tree', filename: 'innerscene-city-tree.glb', bytes: 13880, triangles: 108, meshes: 4, materials: 4, textures: 4, kind: 'Geometric broadleaf', tags: ['low-poly', 'broadleaf'], description: 'Tiny geometric tree asset intended for simple environment dressing.', url: '/models/samples/innerscene-city-tree.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-city-tree-80877d8e', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'layered-fir', title: 'Layered Fir Tree', filename: 'innerscene-layered-fir.glb', bytes: 11260, triangles: 108, meshes: 4, materials: 3, textures: 3, kind: 'Geometric conifer', tags: ['low-poly', 'conifer'], description: 'Layered evergreen silhouette with an extremely small geometry budget.', url: '/models/samples/innerscene-layered-fir.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-layered-fir-tree-a70f6aae', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'angular-deciduous', title: 'Angular Deciduous', filename: 'innerscene-angular-deciduous.glb', bytes: 14492, triangles: 108, meshes: 4, materials: 4, textures: 4, kind: 'Geometric broadleaf', tags: ['low-poly', 'broadleaf'], description: 'Angular canopy volumes; useful as a very-low-detail distant-tree candidate.', url: '/models/samples/innerscene-angular-deciduous.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-angular-deciduous-tree-c680d623', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'round-deciduous', title: 'Round Deciduous', filename: 'innerscene-round-deciduous.glb', bytes: 13896, triangles: 108, meshes: 4, materials: 4, textures: 4, kind: 'Geometric broadleaf', tags: ['low-poly', 'broadleaf'], description: 'Rounded canopy masses with a minimal polygon footprint.', url: '/models/samples/innerscene-round-deciduous.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-round-deciduous-tree-d13d7363', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'conical-pine', title: 'Conical Pine', filename: 'innerscene-conical-pine.glb', bytes: 9028, triangles: 80, meshes: 3, materials: 3, textures: 3, kind: 'Geometric conifer', tags: ['low-poly', 'conifer'], description: 'The lowest-poly candidate in this group: a simple conical pine silhouette.', url: '/models/samples/innerscene-conical-pine.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-conical-pine-tree-6bfffc05', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'low-poly-palm', title: 'Low-poly Palm', filename: 'innerscene-low-poly-palm.glb', bytes: 27384, triangles: 192, meshes: 15, materials: 3, textures: 3, kind: 'Geometric palm', tags: ['low-poly', 'palm'], description: 'A compact tropical silhouette for checking how a palm reads at city-map scale.', url: '/models/samples/innerscene-low-poly-palm.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-palm-tree-5e953f37', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'maple-street-light', title: 'Maple Street Tree · Light', filename: 'innerscene-maple-street-light.glb', bytes: 338352, triangles: 6972, meshes: 172, materials: 3, textures: 0, kind: 'Street tree', tags: ['broadleaf'], description: 'A species-inspired maple with a branching trunk and simplified foliage mesh. Similar intended use to your existing city trees.', url: '/models/samples/innerscene-maple-street-light.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/maple-street-tree-light-canopy-867d03d7', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'palm-light', title: 'Palm · Light', filename: 'innerscene-palm-light.glb', bytes: 720852, triangles: 34064, meshes: 65, materials: 5, textures: 0, kind: 'Palm tree', tags: ['palm', 'detailed'], description: 'Feather-like fronds with a simplified leaflet mesh; compare its cost to the tiny low-poly palm.', url: '/models/samples/innerscene-palm-light.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/palm-light-20c2a70c', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'date-palm', title: 'Mature Date Palm', filename: 'innerscene-mature-date-palm.glb', bytes: 2473396, triangles: 56000, meshes: 122, materials: 4, textures: 4, kind: 'Mature palm', tags: ['palm', 'detailed'], description: 'A larger, mature palm asset for judging more naturalistic crown and trunk detail.', url: '/models/samples/innerscene-mature-date-palm.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/mature-date-palm-tree-af8bdc6f', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'columnar-cypress', title: 'Columnar Cypress', filename: 'innerscene-columnar-cypress.glb', bytes: 2388208, triangles: 40232, meshes: 143, materials: 2, textures: 2, kind: 'Conifer', tags: ['conifer', 'detailed'], description: 'Tall narrow cypress form with a much more detailed geometry structure.', url: '/models/samples/innerscene-columnar-cypress.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/columnar-cypress-tree-46fad033', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'scots-pine', title: 'Mature Scots Pine', filename: 'innerscene-scots-pine.glb', bytes: 2105404, triangles: 54318, meshes: 18, materials: 2, textures: 2, kind: 'Mature conifer', tags: ['conifer', 'detailed'], description: 'A larger mature pine reference, useful for studying the silhouette at close camera distances.', url: '/models/samples/innerscene-scots-pine.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'japanese-maple', title: 'Japanese Maple', filename: 'innerscene-japanese-maple.glb', bytes: 4439308, triangles: 46624, meshes: 87, materials: 5, textures: 4, kind: 'Broadleaf specimen', tags: ['broadleaf', 'detailed'], description: 'A broader, lower-canopy maple profile that differs from the upright street-tree forms.', url: '/models/samples/innerscene-japanese-maple.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/japanese-maple-tree-565c1604', sourceLabel: 'Innerscene CC0 listing' },
  { id: 'oak-detailed', title: 'Oak Street Tree · Detailed', filename: 'innerscene-oak-detailed.glb', bytes: 6184040, triangles: 213372, meshes: 625, materials: 4, textures: 0, kind: 'Detailed street tree', tags: ['broadleaf', 'detailed'], description: 'A high-detail leaf-geometry reference. Included deliberately to compare quality and performance cost.', url: '/models/samples/innerscene-oak-detailed.glb', source: 'https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9', sourceLabel: 'Innerscene CC0 listing' },
];

const host = document.getElementById('viewer-host');
const status = document.getElementById('viewer-status');
const grid = document.getElementById('model-grid');
const titleEl = document.getElementById('selected-title');
const kindEl = document.getElementById('selected-kind');
const descEl = document.getElementById('selected-desc');
const trianglesEl = document.getElementById('selected-triangles');
const sizeEl = document.getElementById('selected-size');
const meshesEl = document.getElementById('selected-meshes');
const materialsEl = document.getElementById('selected-materials');
const filenameEl = document.getElementById('selected-filename');
const downloadEl = document.getElementById('selected-download');
const sourceEl = document.getElementById('selected-source');
const loader = new GLTFLoader();
let currentIndex = 9;
let currentTree = null;
let requestId = 0;
let currentFilter = 'all';

function formatBytes(bytes) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 100000 ? 1 : 0)} KiB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
}
function formatTriangles(triangles) {
  return triangles >= 1000 ? `${(triangles / 1000).toFixed(triangles >= 100000 ? 0 : 1)}k` : `${triangles}`;
}
function isLowPoly(sample) { return sample.tags.includes('low-poly'); }
function disposeObject(root) {
  const geometries = new Set();
  const materials = new Set();
  const textures = new Set();
  root.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    for (const material of (Array.isArray(node.material) ? node.material : [node.material])) {
      if (!material) continue;
      materials.add(material);
      for (const value of Object.values(material)) {
        if (value && value.isTexture) textures.add(value);
      }
    }
  });
  geometries.forEach((geometry) => geometry.dispose());
  textures.forEach((texture) => texture.dispose());
  materials.forEach((material) => material.dispose());
}
function filteredSamples() {
  if (currentFilter === 'all') return samples;
  if (currentFilter === 'detailed') return samples.filter((sample) => sample.tags.includes('detailed') || sample.triangles >= 35000);
  if (currentFilter === 'low-poly') return samples.filter(isLowPoly);
  return samples.filter((sample) => sample.tags.includes(currentFilter));
}
function renderGrid() {
  grid.replaceChildren();
  filteredSamples().forEach((sample) => {
    const index = samples.indexOf(sample);
    const card = document.createElement('article');
    card.className = `card${index === currentIndex ? ' selected' : ''}`;
    card.dataset.index = String(index);

    const body = document.createElement('div');
    body.className = 'card-body';
    const top = document.createElement('div');
    top.className = 'card-top';
    const heading = document.createElement('h3');
    heading.textContent = sample.title;
    const tris = document.createElement('span');
    tris.className = 'tris';
    tris.textContent = `${formatTriangles(sample.triangles)} tris`;
    top.append(heading, tris);

    const kind = document.createElement('span');
    kind.className = 'kind';
    kind.textContent = sample.kind;
    const small = document.createElement('small');
    small.textContent = `${formatBytes(sample.bytes)} · ${sample.meshes} mesh${sample.meshes === 1 ? '' : 'es'}`;

    const actions = document.createElement('div');
    actions.className = 'card-buttons';
    const previewButton = document.createElement('button');
    previewButton.type = 'button';
    previewButton.className = 'preview-btn';
    previewButton.textContent = index === currentIndex ? 'Viewing' : 'Preview';
    previewButton.addEventListener('click', () => selectSample(index));
    const download = document.createElement('a');
    download.className = 'download-link';
    download.href = sample.url;
    download.download = sample.filename;
    download.textContent = 'GLB ↓';
    actions.append(previewButton, download);
    body.append(top, kind, small, actions);
    card.append(body);
    grid.append(card);
  });
}
function updateSelectedPanel(sample) {
  kindEl.textContent = sample.kind;
  titleEl.textContent = sample.title;
  descEl.textContent = sample.description;
  trianglesEl.textContent = formatTriangles(sample.triangles);
  sizeEl.textContent = formatBytes(sample.bytes);
  meshesEl.textContent = String(sample.meshes);
  materialsEl.textContent = String(sample.materials);
  filenameEl.textContent = sample.filename;
  downloadEl.href = sample.url;
  downloadEl.download = sample.filename;
  sourceEl.href = sample.source;
  sourceEl.textContent = sample.sourceLabel;
}
function selectSample(index) {
  currentIndex = (index + samples.length) % samples.length;
  const sample = samples[currentIndex];
  const thisRequest = ++requestId;
  updateSelectedPanel(sample);
  renderGrid();
  status.textContent = `Loading ${sample.title}…`;
  if (currentTree) {
    scene.remove(currentTree);
    disposeObject(currentTree);
    currentTree = null;
  }

  loader.load(sample.url, (gltf) => {
    if (thisRequest !== requestId) {
      disposeObject(gltf.scene);
      return;
    }
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const firstBounds = new THREE.Box3().setFromObject(root);
    const height = firstBounds.max.y - firstBounds.min.y;
    if (!Number.isFinite(height) || height <= 0) {
      disposeObject(root);
      status.textContent = 'This model has invalid or non-Y-up dimensions.';
      return;
    }
    root.scale.multiplyScalar(8 / height);
    root.updateMatrixWorld(true);
    const normalizedBounds = new THREE.Box3().setFromObject(root);
    const center = normalizedBounds.getCenter(new THREE.Vector3());
    root.position.x -= center.x;
    root.position.y -= normalizedBounds.min.y;
    root.position.z -= center.z;
    root.updateMatrixWorld(true);

    root.traverse((node) => {
      if (!node.isMesh || !node.material) return;
      node.castShadow = false;
      node.receiveShadow = false;
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      mats.forEach((material) => {
        if ('metalness' in material) material.metalness = 0;
        if ('roughness' in material && material.roughness < 0.65) material.roughness = 0.75;
      });
    });

    currentTree = root;
    scene.add(root);
    controls.target.set(0, 4, 0);
    camera.position.set(12, 8.5, 12);
    controls.update();
    status.textContent = 'Drag to orbit · scroll to zoom';
    if (sample.triangles >= 100000) status.textContent += ' · high-detail reference';
  }, undefined, (error) => {
    if (thisRequest !== requestId) return;
    console.error('Could not load tree sample:', sample.url, error);
    status.textContent = 'Model failed to load. Check the source/download URL.';
  });
}

let scene;
let camera;
let renderer;
let controls;
let resizeObserver;
try {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#e7ede4');
  scene.fog = new THREE.Fog('#e7ede4', 28, 58);
  camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);
  camera.position.set(12, 8.5, 12);
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.setSize(host.clientWidth, host.clientHeight, false);
  renderer.domElement.setAttribute('aria-label', 'Interactive 3D tree model preview');
  host.prepend(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xf3f7ed, 0x6e6d55, 1.8));
  const key = new THREE.DirectionalLight(0xfff1dc, 2.1);
  key.position.set(-7, 12, 8);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xd6e7ff, 0.75);
  fill.position.set(8, 5, -7);
  scene.add(fill);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(13, 64), new THREE.MeshStandardMaterial({ color: '#cdd8c6', roughness: 1, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.035;
  scene.add(ground);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.075;
  controls.target.set(0, 4, 0);
  controls.minDistance = 6.5;
  controls.maxDistance = 34;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.update();

  const resize = () => {
    const width = Math.max(1, host.clientWidth);
    const height = Math.max(1, host.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  };
  resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(host);
} catch (error) {
  console.error('Could not initialize tree viewer:', error);
  status.textContent = 'WebGL viewer unavailable in this browser.';
}

renderGrid();
selectSample(currentIndex);
document.querySelectorAll('[data-filter]').forEach((button) => {
  button.addEventListener('click', () => {
    currentFilter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
    renderGrid();
  });
});
document.getElementById('previous-model').addEventListener('click', () => selectSample(currentIndex - 1));
document.getElementById('next-model').addEventListener('click', () => selectSample(currentIndex + 1));

function animate() {
  requestAnimationFrame(animate);
  if (!renderer || !scene || !camera || !controls) return;
  controls.update();
  renderer.render(scene, camera);
}
animate();
