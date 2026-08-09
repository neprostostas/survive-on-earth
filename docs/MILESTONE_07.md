# Milestone 07 — Equipment / Basic Armor

## Implemented

- One pure TypeScript `PlayerEquipment` with exactly four ordered slots: Head, Torso, Legs, and Feet.
- Empty initial equipment, frozen read-only snapshots, local subscriptions, and derived total Armor.
- Four non-stackable armor definitions in the existing item registry: Dad Hat, Shirt, Cargo Pants, and Sneakers.
- Optional `equipment` metadata on `ItemDefinition` is the only item-to-slot/Armor mapping; no parallel armor catalog exists.
- A DOM/Babylon-free `EquipmentSystem` coordinates guarded whole-stack transfers between Player Inventory and Player Equipment.
- Automatic compatible-slot selection when equipping from Inventory.
- Occupied-slot swap returns the old item to the same source Inventory slot, requiring no spare slot.
- Unequip reuses the M06 deterministic insertion path; full Inventory rejection is atomic and leaves equipment unchanged.
- Stale and duplicate actions reject without duplicating or deleting items.
- One combined Inventory/Equipment modal with four labeled armor slots, a lightweight survivor silhouette, selected-item details, `EQUIP` / `UNEQUIP` actions, and derived Armor total.
- Resource selection remains informative and exposes no fake equipment action.
- Original shared SVG icon set extended with four armor icons.
- Thin `EquipmentVisualController` projects equipped state onto original procedural player attachments for hat, shirt, cargo pants, and sneakers.
- Visual attachments follow the existing body/limb hierarchy and animation without changing gameplay geometry or movement.
- Four deterministic calibration Ground Loot fixtures use the complete existing Ground Loot → interaction → pickup → Inventory route.
- Ground Loot presentation supports readable procedural armor pickups without a special armor-loot gameplay class.
- F2 diagnostics expose all four slots, total Armor, and the last transfer result.
- Automated equipment verification covers catalog integrity, frozen domain state, transfers, wrong-slot/resource rejection, full Inventory, swaps, stale actions, item conservation, acquisition integration, and scope boundaries.

## Transfer rules

```text
Equip from Inventory
1. Read the current whole stack and validate an optional expected reference.
2. Resolve the destination from ItemDefinition.equipment.slot.
3. Reject resources, incompatible slots, empty sources, and stale sources.
4. Replace the source Inventory stack with the previously equipped stack (or empty).
5. Commit the incoming stack to PlayerEquipment and notify projections.

Unequip to Inventory
1. Validate the occupied Equipment slot and optional expected reference.
2. Run the existing M06 full-stack insertion transaction.
3. Clear Equipment only if Inventory accepted the complete item.
```

The guarded callback order means a rejected destination never consumes equipment, while stale/double actions cannot repeat a transfer. Across Inventory plus Equipment, accepted and rejected operations conserve every item.

## Calibration acquisition

Dad Hat, Shirt, Cargo Pants, and Sneakers spawn deterministically as ordinary Ground Loot near the current test spawn. They are development fixtures only: no production armor loot table, special pickup shortcut, or starter-equipment mutation was introduced.

## Current Armor values

| Item | Slot | Armor |
| --- | --- | ---: |
| Dad Hat | Head | 2 |
| Shirt | Torso | 3 |
| Cargo Pants | Legs | 3 |
| Sneakers | Feet | 0 |

## Not implemented

- Damage reduction, health/combat integration, enemies, or death.
- Weapons, weapon slots, backpack equipment/capacity, pockets, quick slots, or extra armor slots.
- Durability, rarity, stat comparison, repair, upgrades, sets, or random affixes.
- Drag and drop, manual rearrangement, splitting, dropping, deleting, or item consumption.
- Crafting, recipes, containers, persistence, save/load, audio, or AUTO equipment.
