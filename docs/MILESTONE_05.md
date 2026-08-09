# Milestone 05 — Ground Loot & Pickup

## Implemented

- Generic runtime `GroundLoot` entities materialized from every immutable `ItemStack` in an `ItemResult`.
- Deterministic session-local entity IDs and compact deterministic placement beside the depleted source.
- Centralized Ground Loot tuning for placement, interaction radius, scale, and pickup motion.
- Original procedural Pine Log bundle and rounded Limestone world visuals using shared materials.
- Dynamic registration in the existing world interactable collection; the existing `InteractionSystem` remains the only target selector and retains range/hysteresis behavior.
- Contextual Action metadata using the existing item names and SVG icons.
- `PickupSystem` with atomic `active → collecting → removed` lifecycle, immediate interaction deregistration, exactly-once immutable `PickupResult`, and complete visual cleanup.
- A short delta-driven pickup motion that obeys F3 visual freeze.
- `TemporaryPickupResultSink`, which records only the last event and session event count for debug diagnostics.
- F2 Ground Loot diagnostics and automated materialization/lifecycle/pickup boundary coverage through `npm run test:ground-loot`.

## Runtime flow

```text
HarvestingSystem
→ immutable ItemResult
→ CompositeResourceResultSink
   ├─ ResourceResultFeedback
   └─ GroundLootSystem
      → GroundLoot(ItemStack)
      → existing InteractionSystem selection
      → accepted contextual Action
      → PickupSystem one-shot claim
      → immutable PickupResult
      → TemporaryPickupResultSink
```

Ground Loot does not join player collision and is deliberately omitted from the minimap. Multiple result stacks create multiple entities; quantities inside a stack do not create unit entities, and nearby Ground Loot is not automatically merged.

## Temporary sink boundary

At the M05 boundary every valid selected Ground Loot pickup was accepted because Inventory did not yet exist. M06 supersedes that temporary acceptance rule with PlayerInventory capacity checks. The temporary sink remains debug observation only and never becomes item storage.

## Explicitly not implemented

- Inventory, InventorySlot, backpack, slots, capacity, inventory-full behavior, or partial insertion.
- Equipment, crafting, tool durability, or progression/XP.
- Persistence, location reset, player-death drops, enemy loot, or chest contents.
- Auto-loot, proximity pickup, magnet pickup, or AUTO gameplay.
- Ground-stack merging, physics, audio, or a second loot target selector.
