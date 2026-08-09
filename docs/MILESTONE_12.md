# Milestone 12 — Inventory-Backed Harvesting Tools

## Status

Complete. M12 replaces the temporary `PrototypeToolLoadout` gameplay bridge with live `PlayerInventory` ownership of Hatchet and Pickaxe for harvesting.

## Goal

```text
crafted / collected tool in PlayerInventory
→ HarvestingSystem can accept matching resource swings
```

```text
missing or wrong tool
→ swing rejected; no resource progress
```

## Source of truth

`PlayerInventory` is the only production source for harvesting tool availability.

`InventoryHarvestTools` is a thin pure read adapter:

- `hasTool(tool)` → true when `findFirstSlotByItemId(tool)` is not null
- `findToolSlot(tool)` → lowest occupied slot index for that ItemId

There is no cached ownership flag, tool loadout mirror, or harvest-specific inventory copy.

Craft flow:

```text
CraftingSystem → PlayerInventory insert
InventoryHarvestTools → live inventory scan
HarvestingSystem accept / reject
```

No post-craft sync call and no tool equipment action are required.

## Resource rules (unchanged)

| Resource | Required tool | Hits | Yield |
|----------|---------------|-----:|-------|
| Pine Tree | hatchet | 4 | Pine Log ×3 |
| Limestone Rock | pickaxe | 5 | Limestone ×3 |

Wrong tools are rejected by the existing impact rules. No equip step. No AUTO harvest.

## Resolution order

When multiple matching tools exist, the **lowest inventory slot index** wins (top-left → bottom-right for the 5×2 layout).

## PrototypeToolLoadout

`PrototypeToolLoadout` is **removed**. F1 calibration no longer exposes prototype Hatchet/Pickaxe checkboxes. Production Game/HUD/Harvesting use only inventory-backed `InventoryHarvestTools`.

## Explicitly deferred

- tool durability, wear, breaking, repair
- tool/weapon equipment slots (`mainHand`, `offHand`, …)
- Hatchet/Pickaxe combat
- new tool tiers (Iron Hatchet, …)
- new harvest resources beyond Pine / Limestone

## Tests

```bash
npm run test:harvesting-tools
```

Plus full prior regression suites.
