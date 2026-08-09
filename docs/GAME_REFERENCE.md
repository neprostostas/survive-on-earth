# Game Reference

**Primary gameplay reference: Last Day on Earth: Survival.**

Reference means camera, character/world proportions, movement feeling, survival gameplay structure, building-grid proportions, interaction distances, and pacing. It does not mean copying proprietary code, art, audio, branding, UI assets, or content.

When future development must choose between a novel interpretation and behavior closer to LDOE, the default choice is the behavior closer to LDOE. All final values still require visual calibration against lawful reference footage using original procedural or project-owned assets.

## Stable presentation rules from Fidelity F1

- Treat the current Kefir gameplay/help interface as the HUD-generation reference; do not mix it with older layouts.
- Primary play is a high oblique, horizon-free, near-orthographic composition. Exact yaw/pitch remain screenshot-calibrated estimates rather than claimed source values.
- The survivor should read at roughly one fifth of viewport height in the reviewed mobile landscape framing.
- The player sits near horizontal center and slightly above vertical center, leaving more actionable ground below.
- Building cell width is approximately 1.4 player heights; wall height approximately 1.3 player heights.
- Major HUD circles use normalized anchors and height-relative sizing. The joystick is intentionally large and inward from the lower-left edge; minimap and action hierarchy carry comparable weight on the right.
- Minimap, joystick, AUTO, contextual/attack/sneak hierarchy, and bottom utility strip are persistent composition elements, even when a prototype exposes only presentation shells.
- Environment palette is muted olive survival green. Fine clutter must remain subordinate to trees, rocks, the survivor, and interactable feedback.
- Keep original project assets and symbols. Reference similarity applies to hierarchy, proportions, spacing, behavior category, and screen composition—not copyrighted artwork.
- Camera pixel snapping and stable shadow projection are required regression guards.

## Harvesting baseline from Milestone 03

- Pine Tree requires exactly 4 successful Hatchet impacts.
- Limestone Rock requires exactly 5 successful Pickaxe impacts.
- A tap performs one swing; holding the contextual action repeats swings using game-controlled cadence.
- Movement interrupts harvesting immediately, while partial remaining hits persist for the current location session.
- Tool swing durations and normalized impact timings are screen/gameplay-feel calibrated approximations, not official internal LDOE timing values.
- Harvesting ends at depleted resource state in Milestone 03. Resource results/items begin in Milestone 04.

## Resource results from Milestone 04

- Pine Tree depletion produces 3 Pine Logs (`pine-log`).
- Limestone Rock depletion produces 3 Limestone (`limestone`).
- Pine Log max stack is 20.
- Limestone max stack is 20.
- The compact icon/amount feedback duration is a project gameplay-feel approximation, not an official LDOE internal timing.
- Milestone 04 produces a valid immutable item result. Player storage remains a later milestone.

## Current project behavior from Milestone 05

- Each stack in a harvesting `ItemResult` materializes as one physical Ground Loot entity near the depleted resource.
- Pine Tree depletion therefore creates one Pine Log ×3 entity; Limestone Rock depletion creates one Limestone ×3 entity.
- Ground Loot uses the same contextual interaction target and Action controls as other interactables, then emits one pickup result and cleans up.
- These ground materialization and temporary always-accepted pickup rules are current project milestone architecture, not claimed confirmed internal LDOE rules.
- Inventory/storage semantics begin in Milestone 06.

## Player Inventory from Milestone 06

Reference-backed current values:

- Base carrying inventory: 10 slots.
- Pine Log max stack: 20.
- Limestone max stack: 20.

Current project M06 behavior:

- Ground Loot pickup checks complete-stack capacity before consuming the world entity.
- Matching partial stacks fill before empty slots, in ascending base-slot order.
- Pickup is full-stack-or-nothing: insufficient capacity leaves Inventory and Ground Loot unchanged.
- The full-stack atomic pickup rule is a project milestone decision, not documented here as confirmed exact LDOE internal behavior.
- Backpacks, quick slots, manual rearranging, and persistence remain absent. Basic armor equipment begins in Milestone 07.

## Basic armor equipment from Milestone 07

Reference-backed structure used by the current project:

- Exactly four basic armor slots: Head, Torso, Legs, and Feet.
- Armor items are non-stackable and use the shared item catalog and Inventory.
- Equipping automatically targets the item definition's compatible slot.

Current project M07 values:

- Dad Hat: Head, Armor +2.
- Shirt: Torso, Armor +3.
- Cargo Pants: Legs, Armor +3.
- Sneakers: Feet, Armor +0.
- Full basic set total: Armor 8.

Current project behavior:

- Equipping into an occupied slot swaps the previous armor into the same Inventory source slot, even when no other slot is empty.
- Unequipping uses the M06 deterministic insertion rules; a full Inventory rejects the action without changing equipment.
- Four deterministic armor Ground Loot fixtures near the test spawn provide a calibration-only pickup path.
- Equipped armor projects onto the existing procedural player hierarchy and follows locomotion/harvesting animation without changing collision, speed, camera, capacity, or world generation.
- Armor values are displayed and derived but do not reduce damage yet. Weapons, backpack equipment, durability, combat, drag/drop, and persistence remain later milestones.

## Starter blueprints from Milestone 08

Reference-backed starter recipes used by the current project:

```text
3 Pine Log + 3 Limestone → Hatchet ×1
3 Pine Log + 3 Limestone → Pickaxe ×1
```

Current project M08 behavior:

- Crafting reads resources only from the 10-slot Player Inventory.
- Ingredients may be split across slots and are consumed from the lowest slot index first.
- Crafting is instant, one click produces at most one item, and the full consume-plus-output transaction is atomic.
- Output capacity is checked against the post-consumption Inventory layout, including slots freed by ingredients.
- Hatchet and Pickaxe are non-stackable Item System / Inventory items with no equipment metadata.
- Crafted tools intentionally do not change current harvesting availability. `PrototypeToolLoadout` remains the M03 calibration source until a later dedicated tool-lifecycle milestone.
- Durability, tool/weapon equipment, combat stats, stations, storage crafting, timers, queues, multi-craft, progression, and persistence remain absent.
