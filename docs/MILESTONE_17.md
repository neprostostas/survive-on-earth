# Milestone 17 — LDOE-style Inventory / Character Equipment Screen

## Goal

Replace the previous compact loadout modal with a full-screen **Last Day on Earth–style** Inventory / character equipment presentation: POCKETS grid, full-body 3D character preview, equipment slots around the model, character HP/stats, and live production binding. **No backpack gameplay capacity.**

## What landed

### UI

- Full-screen overlay (`.inventory-screen`) with dark desaturated survival chrome.
- **Left:** `INVENTORY` → `POCKETS` (10 real slots, 5×2, indexes 0–9), locked **BACKPACK** future-row shells (presentation only), selection + EQUIP/UNEQUIP, disabled USE/SPLIT/DELETE shells.
- **Right:** character header (PLAYER + live HP bar), stage with:
  - left column: active **Weapon**, empty disabled **Backpack** equip shell, disabled **Utility** shell;
  - center: Babylon.js **InventoryCharacterPreview** canvas;
  - right column: Head / Torso / Legs / Feet armor squares (teal accent).
- Bottom stat strip: **Damage / Armor / Speed / Atk Spd** from production data.

### Production sources of truth (no duplicates)

| UI field | Source |
| --- | --- |
| POCKETS items | `PlayerInventory` (10 slots) |
| Armor | `PlayerEquipment` |
| Weapon | `PlayerWeaponSlot` |
| HP | Player `HealthPool` |
| Damage / APS | `resolvePlayerMeleeProfile(weaponSlot)` |
| Armor total | `PlayerEquipment.totalArmor` |
| Move speed | calibration `player.movementSpeed` |

Equip / unequip / swap still go through `EquipmentSystem` and `WeaponEquipSystem`.

### 3D preview

- Isolated Engine + Scene + canvas (`InventoryCharacterPreview`).
- Same `PlayerVisual` procedural survivor + shared `EquipmentApparelVisuals` mesh factory.
- World character continues to use `EquipmentVisualController` → same apparel factory.
- Preview is visual-only (no collision, combat, health domain).
- Held weapon meshes follow `PlayerWeaponSlot` via `toHeldWeaponVisualId`.
- Renders only while Inventory is open; F3 motion freeze zeros preview idle delta.

### Backpack / utility

- Visible layout shells only.
- **Not** inventory capacity, not drop targets, not ItemStacks.
- No Backpack item definition, no equip transaction.

### Input / world

- Open Inventory still suppresses player movement/attack/interact.
- **World does not pause** — enemies can still detect/chase/damage.
- Esc / close / mutual exclusion with Crafting unchanged.
- Defeated closes and blocks reopen (existing rules).

## Non-goals (M18+)

Actual backpack items/capacity, USE/SPLIT/DELETE gameplay, hunger/thirst/XP/level, drag redesign, sneak, healing slots, death bag.

## Verify

```bash
npm run test:inventory-screen
```

Plus full regression suite listed in the milestone brief.
