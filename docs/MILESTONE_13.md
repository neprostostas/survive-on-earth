# SURVIVE ON EARTH — MILESTONE 13

# HARVESTING TOOL DURABILITY & BREAKAGE

## Status

Complete.

## Goal

Add real per-item durability for Hatchet and Pickaxe on inventory tool instances: spend exactly one use per successful harvesting impact, and remove the tool from Inventory when durability reaches zero.

## Reference values

| Tool | maxDurability |
| --- | --- |
| Hatchet | 50 |
| Pickaxe | 50 |

Cost:

```text
successful harvesting impact → exactly 1 durability
```

Resource hit requirements unchanged:

```text
Pine Tree → 4 Hatchet impacts → Pine Log ×3
Limestone Rock → 5 Pickaxe impacts → Limestone ×3
```

Fresh tools:

```text
Hatchet 50/50 → one complete Pine Tree → 46/50
Pickaxe 50/50 → one complete Limestone Rock → 45/50
```

## Source of truth

- **maxDurability** lives on `ItemDefinition` (catalog metadata only).
- **currentDurability** lives on the concrete `ItemStack` instance inside `PlayerInventory` slots.
- No parallel maps, globals, or tool-condition managers.
- `InventoryHarvestTools` re-resolves the lowest matching slot on every read / spend.

## Fresh creation

All production stack creation goes through `createItemStack`. Durable tools without an override start full (`currentDurability = maxDurability`). Crafting uses that path inside the existing atomic consume-and-insert transaction.

## Breakage

At `1 → 0`:

- the impact that spends the last point still applies resource progress;
- the inventory slot becomes empty;
- no `0/50` placeholder, scrap, repair, or ground drop.

## Selection

Lowest matching inventory slot first. After break, the next impact re-resolves remaining tools. No same-impact cascade onto the next tool.

## Explicit non-goals (not implemented)

- tool combat / weapon stats / equip slots
- armor durability
- repair or broken-item retention
- new tools, resources, enemies, save/load, AUDIO

## Tests

```bash
npm run test:tool-durability
```
