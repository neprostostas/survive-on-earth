# Milestone 04 — Item System & Resource Results

## Goal

Add the first pure item-domain foundation and make a depleted M03 resource produce one valid, visible result. This milestone answers what was harvested; it does not create a physical world item or store anything on the player.

## Initial item definitions

The read-only registry contains exactly two definitions:

- `pine-log` — Pine Log, resource, max stack 20.
- `limestone` — Limestone, resource, max stack 20.

Stable IDs are gameplay identity. Display names and SVG icon IDs are presentation metadata. Hatchet and Pickaxe remain prototype tool availability flags and are not item definitions.

## Item domain

`src/items/` contains Babylon/DOM-independent TypeScript contracts and operations:

- `ItemId` is the closed initial ID union.
- `ItemDefinition` holds static item data.
- `ItemRegistry` validates unique definitions and max-stack rules at initialization, then exposes deterministic `has`, `get`, and `getAll` reads. Unknown IDs fail explicitly.
- `ItemStack` is an immutable `{ itemId, quantity }` value created only through validated functions.
- `createItemStacks` splits arbitrary positive quantities by the registered maximum, for example `47 → [20, 20, 7]`.
- `mergeItemStacks` fills one same-type stack and returns an immutable optional remainder. Different item IDs reject predictably.
- `ItemResult` records source ID, item ID, total quantity, and valid stacks.

No item operation knows about a world position, harvesting animation, player, inventory, DOM, or Babylon.js.

## Resource yields and one-shot generation

The existing centralized harvesting resource data now also defines yield:

- Pine Tree: 4 Hatchet impacts → `pine-log ×3`.
- Limestone Rock: 5 Pickaxe impacts → `limestone ×3`.

On the accepted final impact, `HarvestableResource.claimYield()` permits exactly one claim. Partial, interrupted, wrong-tool, and missing-tool states return no yield. A repeated lifecycle callback or extra impact cannot produce a second result.

`HarvestingSystem` still owns when depletion occurs. It asks the item domain to create validated stacks, passes the immutable result to `ResourceResultSink`, and continues the unchanged M03 interaction/collision/minimap and visual-depletion cleanup. Tree and Rock visual modules do not create stacks or touch UI.

## Temporary result sink and presentation

`ResourceResultFeedback` is the current temporary `ResourceResultSink`. It does not store items. It uses a fixed four-entry DOM pool and original SVG Pine Log/Limestone icons to show a compact icon, `+3`, and display name near the depleted resource's projected world position. Entries lift/fade for approximately 1.05 seconds and are then reused.

Projection uses the active orthographic camera and current render/client dimensions, so resize and pixel-snapped camera movement do not rely on hardcoded screen coordinates. Multiple nearby results may coexist. F3 freeze supplies zero delta, pausing feedback lifetime/motion while still allowing projection to remain aligned.

The sink also exposes debug-only last-result and session-count data. F2 reports definition count, source, item ID, total quantity, and stack quantities. These statistics are not inventory or progression.

## M03 preservation

The harvesting selector, hit counts, tool checks, tap/hold cadence, facing, movement/range interruption, partial hit persistence, procedural tools, reactions, depletion animations, collision removal, and minimap cleanup were not replaced. Result data is emitted synchronously on the accepted `remainingHits: 1 → 0` transition and does not wait for fall/break animation completion.

## Explicit non-goals and limitations

There is no GroundItem, Ground Loot, pickup, auto-pickup, Inventory, inventory slot/grid, Backpack, hotbar storage, item drag/drop, Crafting, tool item/durability, XP, persistence, audio, or combat. Result feedback has no collision, interaction descriptor, world identity, or pickup behavior. Reloading recreates resources and clears result history.

Milestone 05 may replace or compose the temporary sink with a Ground Loot implementation while reusing the same definitions, stacks, yields, and immutable `ItemResult`.
