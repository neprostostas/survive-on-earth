# SURVIVE ON EARTH — MILESTONE 14

# ACTIVE WEAPON SLOT + HATCHET / PICKAXE MELEE COMBAT

## Status

Complete.

## Goal

Add one separate active Weapon Slot, equip existing Hatchet/Pickaxe into it, and resolve Player melee through the existing combat pipeline with shared instance durability.

## Domain split

```text
PlayerEquipment  → armor only (head / torso / legs / feet)
PlayerWeaponSlot → active melee weapon only (capacity 1)
```

Weapon Slot is **not** an armor slot and does **not** affect `totalArmor`.

## Counts

| Domain | Count |
| --- | --- |
| ItemDefinitions | 8 |
| Crafting recipes | 2 |
| Inventory base slots | 10 |
| Armor Equipment slots | 4 |
| Weapon slots | 1 separate |

`PrototypeToolLoadout` remains deleted.

## Melee profiles

| Source | Damage | Attack speed |
| --- | ---: | ---: |
| Fists (empty Weapon Slot) | 6 | 1.8/sec |
| Hatchet | 7 | 0.9/sec |
| Pickaxe | 7 | 1.1/sec |

Fists are **not** an ItemDefinition. Fallback profile: `UNARMED_MELEE_PROFILE`.

Hatchet/Pickaxe expose explicit `ItemDefinition.meleeCombat` metadata (not inferred from `category = tool`).

Cycle duration is `1 / attacksPerSecond`. Impact remains at normalized time `0.38` on the swing.

## Equip / unequip / swap

- Equip **moves** the real Inventory `ItemStack` into Weapon Slot (no clone; durability preserved).
- Unequip moves it back via deterministic insert; inventory-full rejects atomically.
- Equip while another weapon is held swaps the previous weapon into the **source Inventory slot** of the new tool.
- No auto-equip on craft, break, or pocket.

## Combat

```text
Weapon empty → fists
Weapon Hatchet/Pickaxe → item melee metadata
```

`MeleeCombatSystem` snapshots the profile at attack start so mid-swing equip/unequip cannot change that swing’s damage source. Equip/unequip via `WeaponEquipSystem` cancels an in-flight attack first.

Successful weapon combat impact:

```text
target takes damage → shared currentDurability -1
```

Miss/cancel (out of range, dead target, cancelled swing, freeze, defeated) costs **0**.

At `1 → 0`: final hit still applies damage, then Weapon Slot empties. Next attack uses fists. No auto-replace.

Fresh 40 HP Zombie / Combat Dummy:

```text
Fists   → 7 impacts
Hatchet → 6 impacts (7 dmg) → durability 50 → 44
Pickaxe → 6 impacts (7 dmg) → durability 50 → 44
```

## Harvesting

`HarvestToolResolver` (alias `InventoryHarvestTools`):

1. matching equipped Weapon Slot tool
2. else lowest matching Inventory slot

Wrong equipped tool is ignored (e.g. Pickaxe equipped still uses Inventory Hatchet for Tree). Durability is the same `ItemStack.currentDurability` as combat.

## UI / debug

- Inventory panel: **ARMOR** (4 slots) + **WEAPON** (1 slot), EQUIP/UNEQUIP for tools, durability bar reused.
- F2: WEAPON section + harvest tool source (`weapon-slot` / `inventory`).
- F3 freeze: no combat timing, no impact, no durability loss.

## Explicit non-goals (not implemented)

Spear, firearm, quick-slot weapon switch, sneak×3, AUTO combat, second weapon slot, armor durability/repair, different weapon ranges, criticals, enemy rebalance.

## Tests

```bash
npm run test:weapon-combat
```
