# Visual Milestone V1 — LDOE Visual Quality Overhaul

## Goal

Raise the existing calibration scene from a readable prototype toward a clean, stylized mobile-survival presentation while preserving every Milestone 01 and 02 gameplay boundary. All assets and textures remain original and procedural.

## Visual upgrades

- Ground uses a generated 1024px grass/dirt color map, soft procedural patch transitions, fine color breakup, vertex variation, and a tiled generated bump-detail texture.
- Thin-instanced grass tufts, dry weeds, pebbles, and twigs add deterministic micro-detail without collision or interaction registrations.
- Pine trees now use tapered textured trunks, root flares, needle beds, 7–8 asymmetric foliage clusters, deterministic variants, contact shading, and very light sway.
- Rocks use primary chipped masses, secondary fragments, nearby pebbles, face-tone variation, and contact shading without changing collision radii.
- Bushes use multi-cluster silhouettes and restrained motion.
- The player has improved torso/hip proportions, shoulders, neck, hair, layered jacket/chest, belt, straps, backpack, hands, and forward-readable boots. Existing locomotion blending remains intact.
- The 3×3 house fragment uses generated wood response plus framed wall panels, posts, and top beams while retaining mathematical grid calibration.
- The crate is assembled from individual planks, bands, and a latch around its unchanged gameplay anchor.
- The campfire has arranged logs, a stone ring, coals, animated stylized flames, rising smoke, and a very low-intensity warm local light.

## Rendering systems

- `ProceduralTextureFactory` generates ground, bump, wood, bark, and soft contact textures at initialization.
- `GroundSurface` owns terrain geometry/material and redraws only when ground calibration changes.
- `GroundClutter` owns deterministic thin-instance batches and rebuilds their buffers only when density or quality changes.
- `PostProcessing` applies restrained ACES tone mapping, exposure/contrast tuning, and a subtle vignette.
- `Lighting` retains hemispheric + directional daylight, improves light colors/bias, and maps preset/calibration values to PCF filtering.
- Soft generated contact discs provide lightweight ambient grounding instead of an expensive screen-space AO pipeline.

## Visual configuration

Calibration storage is version 4 and merges v3/v2/v1 values with new defaults.

- Quality preset: Low / Medium / High / Ultra (High baseline).
- Ground detail: `1.0`.
- Dirt intensity: `0.78`.
- Clutter density: `0.90`.
- Foliage sway: `0.12`.
- Contact shadow intensity: `0.32`.
- Post-processing intensity: `0.28`.

Presets scale clutter, shadow filtering, fire/smoke complexity, and post-processing. F1 updates settings live and Save/Reset/Copy includes all visual values. F2 reports quality, contact shading, post state, and active clutter count.

## Performance notes

- Generated textures are created at startup and never regenerated per frame.
- Clutter uses four shared meshes and thin-instance buffers rather than hundreds of mesh nodes/materials.
- Materials are shared per logical surface family.
- Runtime motion is limited to transform changes for foliage clusters and a small fixed campfire effect.
- No SSAO pipeline was added; generated contact shading is the predictable lightweight alternative.

## Known limitations

- Visual tuning requires final review in a real browser/GPU because the current automation environment has no connected browser session.
- Babylon remains the dominant production bundle and Vite reports the existing large-chunk warning.
- Procedural placeholder geometry is still intended to be replaced by project-owned authored assets later.

## Non-goals

No harvesting, resource health, tools, drops, items, inventory, crafting, combat, AI, pathfinding, building system, progression, or save-game behavior is part of this milestone. Milestone 03 has not started.
