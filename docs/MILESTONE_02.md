# Milestone 02 — Interaction System

## Goal

Resolve which nearby world object the player intends to use and route keyboard and HUD action intent through one contextual interaction flow. The milestone ends after a successful request is resolved and acknowledged; it does not perform a gameplay action on the object.

## Architecture

- `Interactable.ts` defines a minimal target contract and adapter: stable ID, type, explicit position/radius, and enabled state.
- `InteractionTargetSelector.ts` performs deterministic XZ proximity selection over the explicit world collection.
- `InteractionSystem.ts` retains the current target, drives a subtle procedural ground ring, revalidates action requests, asks the existing player rotation system to face the target, and records debug-only feedback.
- `World` exposes registered descriptors for trees, rocks, the crate, and campfire. Walls, floors, and bushes are not registered.
- `KeyboardInput` and pointer-button input produce the same edge-triggered semantic primary action consumed by `Game`.

No system scans `scene.meshes`, uses picking/raycasting, or listens for physical input outside the input layer.

## Target selection

Distance is evaluated in the XZ plane as `max(0, centerDistance - targetRadius)`. A target is available inside the calibrated interaction range. The nearest valid target wins; facing is only a weak tiebreaker for nearly equal distances. The current target remains sticky until a challenger is better by more than the calibrated switch bias.

Baseline values:

- Interaction range: `1.55` world units from the target boundary.
- Target switch bias: `0.20` world units.
- Facing tie distance: `0.08` world units.
- Indicator fade speed: `10`.

F1 exposes range and switch bias live. Calibration persistence is version 3 and safely merges older v2/v1 data with new defaults.

## Input and feedback

- `E` or `Space`: one contextual action request per physical press; OS key repeat is ignored.
- Primary Action button: one request per pointer press for mouse, touch, or pen.
- The button gains an available state only while a target is selected.
- A muted ground ring indicates the selected target and pulses briefly after a successful request.
- F2 shows target ID/type, effective distance, range, candidates, last successful request, and optional range/radius rings.

## Known limitations

- Interaction has no duration and does not stop or move the player.
- The request only produces facing and visual/debug feedback.
- The interaction foundation was manually accepted by the user before the visual milestone.

## Explicit non-goals

No harvesting, resource HP, tools, drops, items, loot, inventory, container UI, recipes, crafting, combat, AI, auto-walk, pathfinding, doors, building, or save-game state is implemented.
