# 3D tree model assets

All eight GLB files in this folder are downloaded from the Innerscene 3D Parts Library. The asset pages label these models CC0 / public domain, allowing free reuse and modification, including commercial use. This attribution note is retained for provenance even though CC0 does not require credit.

| Local file | Source asset | Preview / license details |
|---|---|---|
| `maple-street-tree.glb` | Maple street tree, light canopy | https://www.innerscene.com/tools/library/3d-parts/maple-street-tree-light-canopy-867d03d7 |
| `oak-street-tree.glb` | Oak street tree, light canopy | https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-light-canopy-a469b6df |
| `linden-street-tree.glb` | Linden street tree, light canopy | https://www.innerscene.com/tools/library/3d-parts/linden-street-tree-light-canopy-1bdbd90f |
| `palm-light.glb` | Palm, light | https://www.innerscene.com/tools/library/3d-parts/palm-light-20c2a70c |
| `maple-street-tree-detailed.glb` | Maple street tree, detailed leaves | https://www.innerscene.com/tools/library/3d-parts/maple-street-tree-detailed-leaves-006cddf4 |
| `oak-street-tree-detailed.glb` | Oak street tree, detailed leaves | https://www.innerscene.com/tools/library/3d-parts/oak-street-tree-detailed-leaves-a273fef9 |
| `linden-street-tree-detailed.glb` | Linden street tree, detailed leaves | https://www.innerscene.com/tools/library/3d-parts/linden-street-tree-detailed-leaves-6300c26e |
| `palm-detailed.glb` | Palm, detailed | https://www.innerscene.com/tools/library/3d-parts/palm-detailed-a8777b8c |

Light models are merged by material and GPU-instanced for the default map view. At zoom 18.8 and closer, the detail tier lazily loads these compact replacements instead of the multi-MB detailed-leaf assets:
- quaternius-common-tree-1.glb for the maple model bucket (about 504 KiB)
- quaternius-common-tree-2.glb for the oak model bucket (about 436 KiB)
- quaternius-common-tree-3.glb for the linden model bucket (about 325 KiB)
- innerscene-palm-light.glb for the palm model bucket (about 704 KiB)

The detail tier is eligible for viewports with up to 2,000 visible trees. These models are instanced by model/material rather than downloaded as a separate copy per census tree. Nashik local palm aliases (Naral, Narikel, Supari, Khajur) are recognized as palms in detail zoom only; the default zoom-out mapping remains unchanged. These are visualization proxies, not scientific species matches for every LocalName.

Downloaded 2026-10-14. Source licenses and asset details should be rechecked if these assets are redistributed or deployed commercially.
