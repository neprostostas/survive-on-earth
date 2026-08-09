# SURVIVE ON EARTH — MILESTONE 15

# STARTER GROUND RESOURCES + DIRECT HARVEST-TO-INVENTORY

## Status

Complete.

## Goal

1. Add deterministic loose **Pine Log ×6** and **Limestone ×6** world pickups (bootstrap without tools).
2. Deliver completed harvest yields **directly into PlayerInventory** — never spawn GroundLoot for harvest.

## Two acquisition flows

### Loose world resources (manual)

```text
GroundLoot (authored)
→ InteractionSystem
→ PickupSystem
→ PlayerInventory (FULL STACK OR NOTHING)
```

### Harvest yields (automatic)

```text
HarvestableResource completion
→ ItemResult
→ HarvestRewardDelivery
→ PlayerInventory.tryInsertAvailable (partial OK, overflow discarded)
```

`GroundLootSystem` is retained for authored/world items (starter logs/stone, equipment calibration, future world drops). It is **not** a harvest reward sink.

## Starter fixtures

| Item | Count | Quantity each |
| --- | ---: | ---: |
| Pine Log | 6 | 1 |
| Limestone | 6 | 1 |

Fixed positions in `starterGroundResources.ts` (no `Math.random`, no respawn).

Bootstrap:

```text
pick 6+6 → craft Hatchet + Pickaxe (existing recipes)
```

## Harvest delivery rules

| Resource | Hits | Yield | Destination |
| --- | ---: | --- | --- |
| Pine Tree | 4 | Pine Log ×3 | Inventory direct |
| Limestone Rock | 5 | Limestone ×3 | Inventory direct |

- Final impact is never blocked by inventory capacity.
- Insert as much as fits (same merge/empty order as normal insert).
- Overflow is **never** ground-dropped.
- Exactly one reward event per completed node (`claimYield` one-shot).

## Explicit non-goals

Random spawn/respawn, new item defs (Stick/Stone), AUTO pickup, loot tables, audio, save/load.

## Tests

```bash
npm run test:resource-acquisition
```
