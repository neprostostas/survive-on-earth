# Milestone 16 — Spear / First Dedicated Melee Weapon

## Goal

Add **Spear** as the first dedicated melee weapon (not a harvesting tool), craftable from Pine Logs, equippable in the existing `PlayerWeaponSlot`, using production melee combat + durability.

## Item

| Field | Value |
| --- | --- |
| id | `spear` |
| category | `tool` |
| maxStack | 1 |
| maxDurability | 100 |
| damage | 10 |
| attacksPerSecond | 1.0 |
| hitRange | 1.35 |

Fresh concrete stack: `100/100`.

Catalog totals after M16: **9** item definitions.

## Crafting

```text
3 × Pine Log → Spear ×1
```

- Recipe id: `spear`
- ALL-OR-NOTHING (existing `CraftingSystem`)
- Recipes total: **3** (Hatchet, Pickaxe, Spear)
- No auto-equip after craft

## Weapon Slot

- Capacity remains **1**
- Compatibility policy: `isWeaponCapableItemId` → item has `meleeCombat` metadata (centralized; no scattered id lists)
- Equip / unequip / swap: existing `WeaponEquipSystem` (atomic, durability preserved, no clone inventories needed by callers)

## Combat

Profiles (Weapon Slot → `resolvePlayerMeleeProfile`):

| Source | Damage | Speed | Hit range | Durability |
| --- | --- | --- | --- | --- |
| Fists | 6 | 1.8/s | 1.15 | n/a |
| Hatchet | 7 | 0.9/s | 1.15 | 50 |
| Pickaxe | 7 | 1.1/s | 1.15 | 50 |
| Spear | 10 | 1.0/s | **1.35** | 100 |

- Hit range is snapshotted on the swing profile (`MeleeCombatProfile.hitRange`)
- Default short range remains `COMBAT_CONFIG.meleeHitRange = 1.15`
- Zombie HP 40 → 4 successful Spear impacts → dead
- Durability −1 only on successful impact; 1→0 removes item; no auto-equip of spare Spear

## Harvest isolation

Spear is **not** a `HarvestTool` (`hatchet` | `pickaxe` only).

- Equipped Spear alone cannot chop/mine
- Equipped Spear + inventory Hatchet/Pickaxe → inventory tool used; Spear durability unchanged

## Visual

- Procedural wooden shaft + pointed tip held on right arm
- Thrust (stab) melee pose; hatchet slash / pickaxe chop unchanged
- Icon via `itemIcons` + standard durability bar in Inventory / Weapon Slot UI

## F2 / F3

- F2 WEAPON block shows active profile damage, speed, **hit range**
- Combat hit ring uses active profile hit range
- F3 freeze unchanged (no attack advance while frozen)

## Tests

```bash
npm run test:spear
```

Plus full regression suite including existing combat/weapon/harvesting suites.

## Explicitly not in M16

Sneak, throw spear, mods, quick slots, second weapon slot, new enemies, random damage, auto-equip.
