# Milestone 06 — Player Inventory

## Implemented

- Pure TypeScript `PlayerInventory` with exactly 10 ordered base slots and no starter items.
- Read-only frozen slot snapshots; external code cannot resize or directly replace internal slots.
- Deterministic two-phase insertion: same-item partial stacks first, then empty slots, both in ascending slot order.
- Existing `ItemStack`, `ItemRegistry`, `maxStack`, stack validation, and merge helpers remain the item source of truth.
- Full-stack-or-nothing capacity preflight and atomic synchronous insertion; failed insertion leaves every slot unchanged.
- Inventory-aware pickup: capacity is checked before Ground Loot claim/removal, successful insertion occurs exactly once, and rejection leaves Ground Loot active.
- One runtime-owned Player Inventory as the sole gameplay storage for collected item quantities.
- Responsive Earth UI inventory overlay with a 5 × 2 base-slot grid, shared Pine Log/Limestone icons, quantities, and empty slots.
- Open/close through the existing HUD `I` utility control, desktop `I`, `Escape`, close button, and backdrop.
- Modal gameplay input suppression plus clean harvesting cancellation while the world continues updating/rendering.
- Reused compact `Inventory full` feedback with no pickup animation/result on rejection.
- Inventory F2 diagnostics derived directly from current slots.
- Automated inventory domain, pickup transaction, boundary, and lightweight UI structure verification.

## Insertion rules

```text
1. Preflight the complete incoming ItemStack without mutation.
2. Fill matching partial stacks from slot 0 to slot 9.
3. Use empty slots from slot 0 to slot 9.
4. Commit only if the complete stack fits.
```

Examples:

```text
Pine Log 12 + 3 → Pine Log 15
Pine Log 19 + 3 → Pine Log 20, then Pine Log 2
```

If total available capacity is smaller than the incoming quantity, the Inventory and Ground Loot remain unchanged. This full-stack-or-nothing rule is current project M06 behavior, not a claim about exact internal LDOE pickup behavior.

## Not implemented

> Historical M06 boundary: basic four-slot armor equipment was added in Milestone 07. The remaining exclusions below still apply.

- Backpacks, backpack equipment, or additional carrying slots.
- Weapon or quick-slot gameplay.
- Manual splitting, drag and drop, rearranging, swapping, dropping, deleting, or consuming items.
- Item details/actions, durability, crafting, recipes, containers, or transfers.
- Persistence, save/load, XP, audio, or AUTO gameplay.
