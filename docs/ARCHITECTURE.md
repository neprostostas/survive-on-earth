# Architecture

Survive on Earth is a small, dependency-light Babylon.js application. `Game` owns the lifetime of cohesive systems but does not contain their implementation.

- `config/`: centralized defaults and persisted calibration data.
- `input/`: keyboard and pointer joystick, combined as one normalized screen-space vector.
- `interaction/`: explicit interactable contracts, deterministic proximity selection with hysteresis, and contextual action execution/feedback.
- `harvesting/`: deterministic resource hit state, tap/hold swing sessions, required-tool availability, and the runtime bridge from the existing contextual target to player/resource feedback.
- `items/`: Babylon/DOM-free item definitions, read-only registry, immutable validated stacks, split/merge operations, and resource-result contracts.
- `ground-loot/`: runtime ItemStack world entities, deterministic materialization/placement, procedural presentation, and one-shot pickup transactions.
- `inventory/`: pure 10-slot player storage, deterministic capacity planning, atomic stack insertion, and read-only snapshots.
- `equipment/`: pure four-slot armor state, guarded Inventory transfer coordinator, deterministic calibration fixtures, and a thin player-visual projection.
- `crafting/`: pure starter recipe definitions, immutable recipe registry, inventory-derived craftability, and the thin atomic crafting coordinator.
- `player/`: procedural visual, animation, movement state, and collision-aware controller.
- `camera/`: fixed orthographic camera with exponential smoothing.
- `collision/`: deterministic 2D circle/AABB collision and sliding; rendering meshes are never collision geometry.
- `world/`: deterministic procedural test location and mathematical building grid.
- `rendering/`: generated textures, shared stylized materials, daylight/shadows, quality presets, and restrained image processing.
- `world/detail/`: procedural ground surface and preset-scaled thin-instance clutter with no gameplay presence.
- `debug/`: live calibration controls and non-gameplay diagnostics.
- `debug/FidelityMode`: local-only F3 reference upload, comparison views, guides, and presentation freeze; reference images are never persisted.
- `ui/`: responsive LDOE-aligned HUD, presentation-only minimap, resource-result feedback, and one modal loadout view bound to Inventory and Equipment snapshots.
- `config/hudLayoutConfig`: centralized normalized HUD anchors/sizes and lightweight validation.

The update order is input → movement/collision → locomotion animation → interaction selection → harvesting/contextual action → HUD/minimap → camera → Ground Loot presentation → debug. Physical keyboard/pointer input becomes semantic movement plus a primary-action state (`pressed`, `held`, `released`) before gameplay systems consume it. Inventory or Crafting visibility suppresses gameplay input and cancels an active harvest through the existing cancellation path without pausing world/render updates. The two gameplay panels coordinate directly so only one is interactive at a time; there is no generic window or pause manager. Non-resource interaction and pickup use the discrete press edge; only harvesting consumes hold cadence. All time-based systems use a clamped delta time.

`World` exposes one explicit collection of `Interactable` descriptors. Harvestable resources and active Ground Loot implement that same contract, so the interaction layer remains the only target selector and never scans the Babylon scene graph. A harvest session temporarily locks its selected descriptor without replacing selector hysteresis. Resource hit state and yield data are deterministic; tree/rock visuals only receive impact/depletion callbacks. On the accepted final impact, the item domain builds one immutable `ItemResult` and passes it through a tiny composite `ResourceResultSink` to the existing feedback and Ground Loot materialization.

Visual geometry is allowed to be richer than gameplay geometry. Trees, rocks, the crate, campfire, house fragment, vegetation, and player rendering remain attached to the same stable roots/anchors while collision and interaction data stay unchanged. Procedural textures are generated once and redrawn only during live calibration; environmental clutter uses shared meshes with thin-instance buffers. `World.update` advances only lightweight foliage/fire/smoke presentation.

F3 freeze supplies a zero frame delta and skips player/harvesting simulation for comparison frames. It pauses tool poses, resource reactions, depletion motion, pooled impact debris, temporary item-result feedback, and pickup presentation without creating a second state model or mutating gameplay data. HUD feature-dependent controls remain disabled shells until their roadmap milestones; the contextual action routes ordinary requests, resource harvesting, or a selected Ground Loot pickup.

Item dependency flow is harvesting depletion → centralized resource yield → item registry/stack validation → immutable item result → Ground Loot materialization → existing contextual selection → PlayerInventory capacity preflight → guarded Inventory commit → one-shot Ground Loot state transition/removal → pickup result. The commit runs inside the active-entity claim guard, so a rejected destination leaves Ground Loot active while a stale/duplicate claim cannot insert. Calibration armor uses the same Ground Loot and pickup path.

Equipment transfer flow is Inventory selection → catalog-derived destination slot → guarded whole-stack exchange → PlayerEquipment state → UI and player-visual subscribers. Equipping into an occupied slot returns the old item to the same source Inventory slot, so a swap does not require spare capacity. Unequipping delegates to the existing deterministic Inventory insertion plan; a full Inventory leaves equipment unchanged. PlayerInventory and PlayerEquipment are the only gameplay owners, and their guarded callbacks keep every accepted transfer item-conserving. The Babylon-facing `EquipmentVisualController` is a projection only and never owns equipment truth.

The temporary pickup sink is debug observation only. Inventory UI reads frozen slot snapshots and updates changed slots through local callbacks, never from the Babylon frame loop. The item, Inventory, PlayerEquipment, and EquipmentSystem domains have no Babylon/DOM dependencies.

Crafting dependency flow is immutable `CraftingRecipeRegistry` → `CraftingSystem` inventory-derived state → generic PlayerInventory consume-and-insert simulation → one atomic slot-state commit → Inventory/Crafting UI subscribers. Requirements are counted across all slots and consumed from the lowest index first. Output capacity is evaluated after simulated consumption, so a slot freed by ingredients can receive the crafted item. PlayerInventory knows only generic item requirements and an output stack; it never imports recipe or CraftingSystem concepts. Crafted M08 tools are catalog/Inventory items only and intentionally do not feed `PrototypeToolLoadout` or harvesting availability.

No physics engine, event bus, framework, or global manager is used in Milestone 01.
