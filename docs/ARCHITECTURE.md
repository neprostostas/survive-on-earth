# Architecture

Survive on Earth is a small, dependency-light Babylon.js application. `Game` owns the lifetime of cohesive systems but does not contain their implementation.

- `config/`: centralized defaults and persisted calibration data.
- `input/`: keyboard and pointer joystick, combined as one normalized screen-space vector.
- `interaction/`: explicit interactable contracts, deterministic proximity selection with hysteresis, and contextual action execution/feedback.
- `harvesting/`: deterministic resource hit state, tap/hold swing sessions, required-tool availability, and the runtime bridge from the existing contextual target to player/resource feedback.
- `items/`: Babylon/DOM-free item definitions, read-only registry, immutable validated stacks, split/merge operations, and resource-result contracts.
- `player/`: procedural visual, animation, movement state, and collision-aware controller.
- `camera/`: fixed orthographic camera with exponential smoothing.
- `collision/`: deterministic 2D circle/AABB collision and sliding; rendering meshes are never collision geometry.
- `world/`: deterministic procedural test location and mathematical building grid.
- `rendering/`: generated textures, shared stylized materials, daylight/shadows, quality presets, and restrained image processing.
- `world/detail/`: procedural ground surface and preset-scaled thin-instance clutter with no gameplay presence.
- `debug/`: live calibration controls and non-gameplay diagnostics.
- `debug/FidelityMode`: local-only F3 reference upload, comparison views, guides, and presentation freeze; reference images are never persisted.
- `ui/`: responsive LDOE-aligned HUD shells, a presentation-only local minimap, and a bounded temporary world-projected resource-result sink.
- `config/hudLayoutConfig`: centralized normalized HUD anchors/sizes and lightweight validation.

The update order is input → movement/collision → locomotion animation → interaction selection → harvesting/action → HUD/minimap → camera → debug. Physical keyboard/pointer input becomes semantic movement plus a primary-action state (`pressed`, `held`, `released`) before gameplay systems consume it. Non-resource interactables still use the discrete press edge; only harvesting consumes hold cadence. All time-based systems use a clamped delta time. Calibration changes flow directly into systems through a shared typed object and explicit apply methods.

`World` exposes a small explicit collection of `Interactable` descriptors. Harvestable resources implement that same contract, so the interaction layer remains the only target selector and never scans the Babylon scene graph. A harvest session temporarily locks its selected descriptor without replacing selector hysteresis. Resource hit state and yield data are deterministic; tree/rock visuals only receive impact/depletion callbacks. On the accepted final impact, the item domain builds one immutable `ItemResult` and passes it through `ResourceResultSink`. The current sink is presentation/debug only and stores nothing.

Visual geometry is allowed to be richer than gameplay geometry. Trees, rocks, the crate, campfire, house fragment, vegetation, and player rendering remain attached to the same stable roots/anchors while collision and interaction data stay unchanged. Procedural textures are generated once and redrawn only during live calibration; environmental clutter uses shared meshes with thin-instance buffers. `World.update` advances only lightweight foliage/fire/smoke presentation.

F3 freeze supplies a zero frame delta and skips player/harvesting simulation for comparison frames. It pauses tool poses, resource reactions, depletion motion, pooled impact debris, and temporary item-result feedback without creating a second state model or mutating gameplay data. HUD feature-dependent controls remain disabled shells until their roadmap milestones; the contextual action now routes ordinary discrete requests or resource harvesting.

Item dependency flow is harvesting depletion → centralized resource yield → item registry/stack validation → immutable item result → temporary result sink. The item domain has no dependency back to harvesting, world rendering, UI, or player state. Ground Loot and Inventory remain absent.

No physics engine, event bus, framework, or global manager is used in Milestone 01.
