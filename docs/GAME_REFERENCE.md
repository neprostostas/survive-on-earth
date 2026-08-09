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
- Armor values are displayed and derived but do not reduce damage yet. Weapons, backpack equipment, durability, drag/drop, and persistence remain later milestones.

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
- Crafted Hatchet and Pickaxe are non-stackable Item System / Inventory items with no equipment metadata.
- Durability, tool/weapon equipment, combat stats, stations, storage crafting, timers, queues, multi-craft, progression, and persistence remain absent.

## Inventory-backed harvesting tools from Milestone 12

Current project M12 behavior:

- Harvesting reads Hatchet/Pickaxe ownership only from live `PlayerInventory` (via thin `InventoryHarvestTools`).
- Pine Tree requires a Hatchet in Inventory; Limestone Rock requires a Pickaxe.
- Matching tools resolve by lowest occupied inventory slot index. No equip action and no tool equipment slot.
- Crafting a tool inserts it into Inventory, and the next harvest check immediately sees it without a sync callback.
- Successful harvest does not consume or degrade tools (durability is explicitly deferred).
- Hatchet/Pickaxe remain non-combat inventory items. Player melee stays fists only (damage 6).
- `PrototypeToolLoadout` no longer exists in production code.

## Unarmed melee foundation from Milestone 09

Current project calibration:

- Fists deal exactly 6 damage per accepted impact.
- Fists attack at 1.8 attacks per second, giving a cycle duration of `1 / 1.8` seconds.
- The single impact occurs at normalized attack time `0.38`.
- Combat target acquisition range is 2.2 world units; impact range is 1.15 world units.
- A Combat Dummy has exactly 40 health. Its health after seven uninterrupted fist impacts is `34 → 28 → 22 → 16 → 10 → 4 → 0`.

Current project M09 behavior:

- The existing attack HUD button and `F` key create one intentional attack request per press. Keyboard repeat and pointer hold do not create automatic attacks.
- Combat targets are explicitly registered and selected independently from contextual interaction. Selection is nearest-first with runtime-ID tie-breaking and a small switch bias.
- An attack locks its target at start and applies damage exactly once at the configured impact moment, after confirming that the target is still registered, alive, and in hit range.
- Movement is blocked only from attack start through impact. Recovery allows movement, while the next attack remains unavailable until the full cycle ends.
- Fists alternate right/left. Their lightweight procedural pose uses the existing player pivots, so sleeves and harvesting visuals continue to follow the same character hierarchy.
- Three deterministic Combat Dummies provide collision, target ring/health feedback, `-6` impact feedback, recoil, and death cleanup. They do not provide AI, loot, or rewards.
- Unarmed damage, cadence, impact timing, ranges, dummy placement, and presentation timing are project calibration values chosen to establish LDOE-like melee pacing; they are not claimed as extracted official internal LDOE values.
- Enemy AI, healing, weapons, tools-as-weapons, durability, respawn, loot, knockback simulation, and persistence remain later milestones where still marked deferred.

## Roaming Zombie and Player health from Milestone 10

Verified LDOE reference used by this milestone:

- Roaming Zombie: 40 HP, 0 Armor, 6 Damage, movement-speed reference 14, and attack speed described as “Very Slow”.
- Player base health: 100 HP.

Survive on Earth project calibration for the current world scale:

- Zombie world movement speed: 1.6 units/second, compared with Player speed 4.5.
- Zombie attack rate: 0.8 attacks/second; derived cycle: `1 / 0.8 = 1.25` seconds.
- Normalized attack impact time: 0.42.
- Radial acquire range: 4.0; lose range: 8.0.
- Attack-start range: 1.05; impact hit range: 1.15.

Current project M10 behavior (still active except where M11 supersedes raw damage application):

- Three fixed Roaming Zombie calibration fixtures independently idle, detect, chase by direct steering, stop for timed melee attacks, recover, and disengage using range hysteresis.
- A successful Zombie impact deals **raw** damage 6. Final Player HP change is resolved by armor mitigation (Milestone 11).
- Player attacks use the existing CombatTargetSystem and 6-damage fists. A fresh 40-HP Roaming Zombie dies after exactly seven successful fist impacts.
- The Player can leave hit range during the Zombie windup to make the impact miss. A Zombie killed before impact cannot deal phantom damage.
- Player health reaching zero enters a temporary terminal M10 gameplay state. Production death, corpse, inventory loss, respawn, and recovery are deferred.
- Detection is radial and ignores line of sight. Movement respects supported collision geometry but has no pathfinding, so an obstacle can leave a Zombie stuck.
- Fixed fixtures are calibration content, not a production spawn table. Zombie death produces no loot or XP.

The world-space speed, numeric attack cadence/timing, and ranges above are project calibration values. They are not presented as extracted internal LDOE constants.

## Player armor damage mitigation from Milestone 11

LDOE reference rule used by the project:

```text
DamageReduction = Armor / (Armor + 50/3)
Damage Taken is rounded to nearest whole number.
```

Current Survive on Earth equipment metadata (project values; not necessarily claimed exact current LDOE item stats):

- Dad Hat: Head, Armor 2
- Shirt: Torso, Armor 3
- Cargo Pants: Legs, Armor 3
- Sneakers: Feet, Armor 0
- Full current set total: Armor 8

Current calibration for Roaming Zombie raw damage 6:

- Armor 0 → final damage 6 (`100 → 94`)
- Armor 2 (Dad Hat) → final 5
- Armor 3 (Shirt or Cargo Pants) → final 5
- Armor 5 (Dad Hat + Shirt) → final 5
- Armor 8 (full set) → final 4 (`100 → 96`)

Current project M11 behavior:

- Armor points are read from live `PlayerEquipment.totalArmor` at enemy impact resolution time only.
- `PlayerDamageResolver` applies pure mitigation, then commits final damage to the existing Player `HealthPool`.
- Enemy AI stores and emits only raw damage 6; equipping armor never mutates the enemy profile.
- Sneakers remain equippable with armor 0 and therefore do not change incoming damage by themselves.
- Armor metadata is display/combat-mitigation only: no durability, wear, breaking, or repair.
- Enemy armor, armor penetration, damage types, block/dodge, healing, and respawn remain deferred.
- Outgoing Player fists remain unmitigated 6 damage against Zombies and Combat Dummies.
