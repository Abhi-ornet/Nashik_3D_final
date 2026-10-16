# Tree model review samples

This folder contains **16 preview-only tree GLBs** collected from online asset libraries so the Canopy tree-map POC can compare different silhouettes, geometry budgets, and detail levels. They are not wired into the live map and do not replace the configured production assets.

Open the local gallery at `http://127.0.0.1:5173/tree-samples.html` while the Vite development server is running. The gallery uses a **single WebGL renderer** and loads only the selected model, to avoid opening one renderer/context for every card. It includes filters, per-model geometry/file stats, source links, and download links.

## Inventory

| Model | Local file | Approx. triangles | File size | GLTF mesh objects | License/source |
|---|---|---:|---:|---:|---|
| Common Tree 1 | `quaternius-common-tree-1.glb` | 6,257 | 504 KiB | 1 | [Quaternius / Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html), CC0 1.0 per source repo credits |
| Common Tree 2 | `quaternius-common-tree-2.glb` | 5,625 | 436 KiB | 1 | [Quaternius / Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html), CC0 1.0 per source repo credits |
| Common Tree 4 | `quaternius-common-tree-3.glb` | 4,065 | 325 KiB | 1 | [Quaternius / Stylized Nature MegaKit](https://quaternius.com/packs/stylizednaturemegakit.html), CC0 1.0 per source repo credits |
| Low-poly City Tree | `innerscene-city-tree.glb` | 108 | 13.9 KiB | 4 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-city-tree-80877d8e), CC0 |
| Layered Fir Tree | `innerscene-layered-fir.glb` | 108 | 11.3 KiB | 4 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-layered-fir-tree-a70f6aae), CC0 |
| Angular Deciduous | `innerscene-angular-deciduous.glb` | 108 | 14.5 KiB | 4 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-angular-deciduous-tree-c680d623), CC0 |
| Round Deciduous | `innerscene-round-deciduous.glb` | 108 | 13.9 KiB | 4 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-round-deciduous-tree-d13d7363), CC0 |
| Conical Pine | `innerscene-conical-pine.glb` | 80 | 9.0 KiB | 3 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-conical-pine-tree-6bfffc05), CC0 |
| Low-poly Palm | `innerscene-low-poly-palm.glb` | 192 | 26.7 KiB | 15 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/low-poly-nature-palm-tree-5e953f37), CC0 |
| Maple Street Tree · Light | `innerscene-maple-street-light.glb` | 6,972 | 330 KiB | 172 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/maple-street-tree-light-canopy-867d03d7), CC0 |
| Palm · Light | `innerscene-palm-light.glb` | 34,064 | 704 KiB | 65 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/palm-light-20c2a70c), CC0 |
| Mature Date Palm | `innerscene-mature-date-palm.glb` | 56,000 | 2.36 MiB | 122 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/mature-date-palm-tree-af8bdc6f), CC0 |
| Columnar Cypress | `innerscene-columnar-cypress.glb` | 40,232 | 2.28 MiB | 143 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/columnar-cypress-tree-46fad033), CC0 |
| Mature Scots Pine | `innerscene-scots-pine.glb` | 54,318 | 2.01 MiB | 18 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/mature-scots-pine-tree-280307e1), CC0 |
| Japanese Maple | `innerscene-japanese-maple.glb` | 46,624 | 4.23 MiB | 87 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/japanese-maple-tree-565c1604), CC0 |
| Oak Street Tree · Detailed | `innerscene-oak-detailed.glb` | 213,372 | 5.90 MiB | 625 | [Innerscene listing](https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9), CC0 |

## Licensing and provenance

The Innerscene listing pages linked above explicitly label the individual GLB downloads as public domain under CC0. The three Quaternius models came from optimized GLB copies hosted in a GitHub repository whose [credits file](https://github.com/anshaneja5/skyline-run/blob/main/CREDITS.md) identifies `tree1.glb`–`tree3.glb` as Quaternius CommonTree 1/2/4 from Stylized Nature MegaKit under CC0 1.0. The [CC0 1.0 text](https://creativecommons.org/publicdomain/zero/1.0/) is linked for reference. Preserve source links if these sample files are copied to another project.

## How to interpret the numbers

- Triangle counts are estimated by reading the primitives' index/position accessors and the GLTF primitive mode. Treat them as a consistent screening metric, not a replacement for a full GPU profiler.
- “GLTF mesh objects” is the count in the file's top-level `meshes` array. It is **not** the same thing as actual draw calls after Three.js batching/instancing.
- Texture/image counts refer to the GLB JSON; a model can have no image textures and still use multiple material colors.
- The gallery normalizes tree height in the viewer for easy visual comparison. It does not rewrite the underlying GLB files.
- The 40k–213k triangle samples are included as detail references. They are not an indication that hundreds of those models should be rendered at once.
