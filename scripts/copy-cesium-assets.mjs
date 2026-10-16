import { cpSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const sourceRoot = resolve(projectRoot, 'node_modules', 'cesium', 'Build', 'Cesium');
const destinationRoot = resolve(projectRoot, 'public', 'cesium');
const directories = ['Workers', 'ThirdParty', 'Assets', 'Widgets'];

mkdirSync(destinationRoot, { recursive: true });
for (const directory of directories) {
  cpSync(resolve(sourceRoot, directory), resolve(destinationRoot, directory), {
    recursive: true,
    force: true,
  });
}
console.log('Copied CesiumJS runtime assets to public/cesium.');
