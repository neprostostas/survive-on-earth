# Architecture

Survive on Earth is a small, dependency-light Babylon.js application. `Game` owns the lifetime of cohesive systems but does not contain their implementation.

- `config/`: centralized defaults and persisted calibration data.
- `input/`: keyboard and pointer joystick, combined as one normalized screen-space vector.
- `interaction/`: explicit interactable contracts, deterministic proximity selection with hysteresis, and contextual action execution/feedback.
- `player/`: procedural visual, animation, movement state, and collision-aware controller.
- `camera/`: fixed orthographic camera with exponential smoothing.
- `collision/`: deterministic 2D circle/AABB collision and sliding; rendering meshes are never collision geometry.
- `world/`: deterministic procedural test location and mathematical building grid.
- `rendering/`: generated textures, shared stylized materials, daylight/shadows, quality presets, and restrained image processing.
- `world/detail/`: procedural ground surface and preset-scaled thin-instance clutter with no gameplay presence.
- `debug/`: live calibration controls and non-gameplay diagnostics.
- `ui/`: mock mobile-style HUD.

The update order is input → movement/collision → animation → interaction selection/action → camera → debug. Physical keyboard/pointer input becomes semantic movement or a discrete primary-action request before gameplay systems consume it. All time-based systems use a clamped delta time. Calibration changes flow directly into systems through a shared typed object and explicit apply methods.

`World` exposes a small explicit collection of `Interactable` descriptors. The interaction layer never scans the Babylon scene graph and does not know about DOM events. Objects provide stable IDs, XZ anchors, gameplay radii, types, and enabled state; behavior such as harvesting or inventory is intentionally absent.

Visual geometry is allowed to be richer than gameplay geometry. Trees, rocks, the crate, campfire, house fragment, vegetation, and player rendering remain attached to the same stable roots/anchors while collision and interaction data stay unchanged. Procedural textures are generated once and redrawn only during live calibration; environmental clutter uses shared meshes with thin-instance buffers. `World.update` advances only lightweight foliage/fire/smoke presentation.

No physics engine, event bus, framework, or global manager is used in Milestone 01.
