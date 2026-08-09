# Milestone 08 — Crafting / Starter Blueprints

## Scope

Milestone 08 adds the first complete instant-crafting vertical slice using only resources in Player Inventory. It introduces exactly two calibration recipes and stops before tool lifecycle, equipment, durability, combat, stations, storage, progression, or persistence.

## Item catalog

The single existing Item Registry now contains eight definitions. Hatchet and Pickaxe were added as `tool` items with `maxStack: 1`, their own shared SVG icons, and no equipment or durability metadata.

## Recipe model

The pure TypeScript crafting domain contains:

- `CraftingRecipeId`;
- `CraftingIngredient`;
- `CraftingRecipeDefinition`;
- immutable `CraftingRecipeRegistry`;
- explicit `CraftResult`;
- thin `CraftingSystem`.

The production recipe registry is the single source of requirements and contains exactly:

```text
Hatchet recipe:
3 Pine Log + 3 Limestone → Hatchet ×1

Pickaxe recipe:
3 Pine Log + 3 Limestone → Pickaxe ×1
```

Recipe definitions contain only an ID, one output stack, and ingredient requirements.

## Atomic Inventory transaction

PlayerInventory exposes one generic controlled consume-and-insert transaction. It knows only item IDs, quantities, and an output ItemStack; it does not import Crafting recipes or systems.

```text
current slots
→ validate totals across every slot
→ consume each requirement from lowest slot index first
→ simulate deterministic output insertion
→ reject without mutation or commit the whole resulting layout once
```

Normal rejection outcomes are explicit rather than exceptions:

- `not-enough-resources`;
- `inventory-full`;
- `invalid-recipe`.

An Inventory that is full before crafting may still accept a craft when ingredient consumption empties a slot. If output still cannot fit after simulated consumption, no ingredient is removed.

## UI and modal behavior

- The existing disabled `B` Blueprints HUD shell is reused as the Crafting control; desktop `B` also toggles it.
- The compact panel renders exactly Hatchet and Pickaxe cards from the production registry.
- Cards use shared item definitions/icons and show live owned/required ingredient counts.
- Craft button availability comes from `CraftingSystem`; the system validates again on click.
- Successful and rejected actions reuse the existing compact gameplay status feedback.
- Inventory updates refresh both panels without reopening them.
- Inventory and Crafting cannot remain open simultaneously.
- Opening either panel suppresses movement/actions and uses the existing harvesting cancellation path while world rendering continues.

## Verification

`npm run test:crafting` covers:

- exactly eight item definitions and two recipes;
- tool metadata and non-stackability;
- frozen registry contracts;
- exact, extra, missing, and split ingredient quantities;
- lowest-slot-first consumption;
- basic and repeated craft behavior;
- insufficient-resource immutability;
- post-consumption freed-slot success;
- output-capacity atomic rejection;
- unrelated-item conservation;
- rapid/double action revalidation;
- domain, UI, equipment-slot, and scope boundaries.

All M01–M07 verification commands, the M08 suite, production build, and diff whitespace check are required regression gates.

## Preserved boundaries

- Camera, player scale/collision/speed, harvesting hit counts, yields, resource stacks, 10-slot Inventory, four armor slots, Armor 8, interaction selection, and exactly-once pickup remain unchanged.
- `PrototypeToolLoadout` remains the harvesting availability source.
- Crafted Hatchet/Pickaxe are not auto-equipped and do not activate harvesting.

## Explicitly deferred

- Tool/weapon equipment slots, active tools, durability, breakage, repair, combat, damage, enemies, and animations.
- Additional recipes, armor/backpack crafting, stations, workbenches, containers, remote/storage crafting, unlock progression, XP, levels, quests, and research.
- Multi-craft, Craft All, hold-to-craft, timers, progress bars, queues, background jobs, and cancellation.
- Drag/drop, manual rearranging, stack splitting UI, item dropping/deletion, persistence, save/load, audio, production loot tables, and base building.
