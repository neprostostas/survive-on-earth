import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { GroundLootSystem } from "../src/ground-loot/GroundLootSystem.ts";
import { PickupSystem } from "../src/ground-loot/PickupSystem.ts";
import { TemporaryPickupResultSink } from "../src/ground-loot/PickupResult.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { PlayerInventory, planInventoryInsertion } from "../src/inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, createItemResult, createItemStack } from "../src/items/ItemSystem.ts";

const stackAt = (inventory, index) => inventory.getSlot(index).stack;
const quantities = (inventory) => inventory.getSlots().map((slot) => slot.stack?.quantity ?? 0);

const initial = new PlayerInventory();
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.equal(INVENTORY_CONFIG.columns, 5);
assert.equal(initial.slotCount, 10);
assert.equal(initial.getSlots().length, 10);
assert.equal(initial.emptySlotCount, 10);
assert.equal(initial.occupiedSlotCount, 0);
assert.deepEqual(initial.getSlots().map((slot) => slot.index), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
assert.equal(initial.getSlots().every((slot) => slot.stack === null), true);
const snapshot = initial.getSlots();
assert.equal(Object.isFrozen(snapshot), true);
assert.equal(Object.isFrozen(snapshot[0]), true);
assert.throws(() => snapshot.push({ index: 10, stack: null }), TypeError, "external snapshot cannot be resized");
assert.throws(() => initial.getSlot(10), RangeError);

const basic = new PlayerInventory();
let changeNotifications = 0;
let lastChangedSlots = [];
basic.subscribe((change) => { changeNotifications += 1; lastChangedSlots = [...change.changedSlotIndexes]; });
const incomingPine = createItemStack("pine-log", 3);
const incomingBefore = { ...incomingPine };
let result = basic.tryInsert(incomingPine);
assert.equal(result.accepted, true);
assert.deepEqual(result.changedSlotIndexes, [0]);
assert.deepEqual(stackAt(basic, 0), { itemId: "pine-log", quantity: 3 });
assert.deepEqual(incomingPine, incomingBefore, "incoming ItemStack must not mutate");
assert.equal(Object.isFrozen(incomingPine), true);
assert.equal(changeNotifications, 1, "successful state change emits one local notification");
assert.deepEqual(lastChangedSlots, [0]);
result = basic.tryInsert(createItemStack("limestone", 3));
assert.deepEqual(result.changedSlotIndexes, [1]);
assert.deepEqual(stackAt(basic, 1), { itemId: "limestone", quantity: 3 });

const merge = new PlayerInventory();
merge.tryInsert(createItemStack("pine-log", 3));
merge.tryInsert(createItemStack("pine-log", 3));
assert.deepEqual(stackAt(merge, 0), { itemId: "pine-log", quantity: 6 });
assert.equal(stackAt(merge, 1), null);
const twelvePlusThree = new PlayerInventory();
twelvePlusThree.tryInsert(createItemStack("pine-log", 12));
twelvePlusThree.tryInsert(createItemStack("pine-log", 3));
assert.equal(stackAt(twelvePlusThree, 0).quantity, 15, "12 + 3 must merge to 15");
const nineteenPlusOne = new PlayerInventory();
nineteenPlusOne.tryInsert(createItemStack("pine-log", 19));
nineteenPlusOne.tryInsert(createItemStack("pine-log", 1));
assert.equal(stackAt(nineteenPlusOne, 0).quantity, 20);
const overflow = new PlayerInventory();
overflow.tryInsert(createItemStack("pine-log", 19));
overflow.tryInsert(createItemStack("pine-log", 3));
assert.deepEqual(quantities(overflow).slice(0, 2), [20, 2], "19 + 3 must become 20 + 2");
assert.equal(overflow.getSlots().every((slot) => !slot.stack || slot.stack.quantity <= ITEM_REGISTRY.get(slot.stack.itemId).maxStack), true);

const different = new PlayerInventory();
different.tryInsert(createItemStack("pine-log", 10));
different.tryInsert(createItemStack("limestone", 3));
assert.equal(stackAt(different, 0).quantity, 10);
assert.deepEqual(stackAt(different, 1), { itemId: "limestone", quantity: 3 });

const arbitrarySlots = Object.freeze([
  createItemStack("limestone", 20), null, createItemStack("limestone", 20), null, null,
  createItemStack("limestone", 20), null, null, null, null,
]);
const earliestEmptyPlan = planInventoryInsertion(arbitrarySlots, createItemStack("pine-log", 3));
assert.ok(earliestEmptyPlan);
assert.deepEqual(earliestEmptyPlan[1], { itemId: "pine-log", quantity: 3 }, "earliest empty slot must win");
assert.equal(earliestEmptyPlan[3], null);
assert.deepEqual(
  planInventoryInsertion(arbitrarySlots, createItemStack("pine-log", 3)),
  earliestEmptyPlan,
  "same starting state must produce a deterministic plan",
);

// Prefer free base-pocket over merging into an existing backpack stack of the same item.
const pocketVsBackpack = Array.from({ length: 15 }, () => null);
pocketVsBackpack[10] = createItemStack("pine-log", 5);
const pocketFirstPlan = planInventoryInsertion(pocketVsBackpack, createItemStack("pine-log", 3));
assert.ok(pocketFirstPlan);
assert.deepEqual(pocketFirstPlan[0], { itemId: "pine-log", quantity: 3 }, "free pocket must win over backpack merge");
assert.deepEqual(pocketFirstPlan[10], { itemId: "pine-log", quantity: 5 }, "backpack stack stays untouched when pocket has room");

const multiplePartial = Array.from({ length: 10 }, () => createItemStack("limestone", 20));
multiplePartial[0] = createItemStack("pine-log", 19);
multiplePartial[4] = createItemStack("pine-log", 18);
const partialPlan = planInventoryInsertion(multiplePartial, createItemStack("pine-log", 3));
assert.ok(partialPlan);
assert.equal(partialPlan[0].quantity, 20, "earliest partial stack fills first");
assert.equal(partialPlan[4].quantity, 20, "next partial stack receives the remainder");
assert.equal(partialPlan.filter((stack) => stack?.itemId === "pine-log").length, 2, "no empty slot is needed");
assert.equal(partialPlan.reduce((total, stack) => total + (stack?.itemId === "pine-log" ? stack.quantity : 0), 0), 40);

function fillFull(inventory) {
  for (let index = 0; index < 10; index += 1) {
    const itemId = index % 2 === 0 ? "pine-log" : "limestone";
    assert.equal(inventory.tryInsert(createItemStack(itemId, 20)).accepted, true);
  }
}

const full = new PlayerInventory();
fillFull(full);
assert.equal(full.occupiedSlotCount, 10);
assert.equal(full.emptySlotCount, 0);
const fullBefore = full.getSlots();
assert.equal(full.canInsert(createItemStack("pine-log", 3)), false);
assert.equal(full.tryInsert(createItemStack("pine-log", 3)).accepted, false);
assert.deepEqual(full.getSlots(), fullBefore, "failed insertion must not mutate any slot");
assert.equal(full.getSlots().length, 10, "failed insertion cannot create an eleventh slot");

const exactCapacity = new PlayerInventory();
exactCapacity.tryInsert(createItemStack("pine-log", 17));
for (let index = 0; index < 9; index += 1) exactCapacity.tryInsert(createItemStack("limestone", 20));
assert.equal(exactCapacity.emptySlotCount, 0);
assert.equal(exactCapacity.canInsert(createItemStack("pine-log", 3)), true);
assert.equal(exactCapacity.tryInsert(createItemStack("pine-log", 3)).accepted, true);
assert.equal(stackAt(exactCapacity, 0).quantity, 20);

const insufficient = new PlayerInventory();
insufficient.tryInsert(createItemStack("pine-log", 18));
for (let index = 0; index < 9; index += 1) insufficient.tryInsert(createItemStack("limestone", 20));
assert.equal(insufficient.canInsert(createItemStack("pine-log", 3)), false);
assert.equal(insufficient.tryInsert(createItemStack("pine-log", 3)).accepted, false);
assert.equal(stackAt(insufficient, 0).quantity, 18, "full-stack rejection must not partially merge two items");

function lootHarness() {
  const interactables = [];
  const registry = {
    addInteractable(entity) { interactables.push(entity); },
    removeInteractable(entity) {
      const index = interactables.indexOf(entity);
      if (index >= 0) interactables.splice(index, 1);
    },
  };
  return { interactables, groundLoot: new GroundLootSystem(registry) };
}

const interaction = { cleared: 0, clearTarget() { this.cleared += 1; } };
const source = Object.freeze({ x: 2, y: 0, z: 2 });
const pinePickupHarness = lootHarness();
const pineLoot = pinePickupHarness.groundLoot.materialize(createItemResult("tree-inventory", "pine-log", 3), source)[0];
const pickupInventory = new PlayerInventory();
const pickupResults = new TemporaryPickupResultSink();
const pickup = new PickupSystem(pinePickupHarness.groundLoot, interaction, pickupInventory, pickupResults);
assert.equal(pickup.tryPickup(pineLoot, source), true);
assert.equal(pickupInventory.totalQuantity("pine-log"), 3);
assert.equal(pineLoot.state, "removed");
assert.equal(pickupResults.resultCount, 1);
assert.equal(pickup.tryPickup(pineLoot, source), false);
assert.equal(pickupInventory.totalQuantity("pine-log"), 3, "duplicate pickup cannot duplicate Inventory quantity");
assert.equal(pickupResults.resultCount, 1);

const limestonePickupHarness = lootHarness();
const limestoneLoot = limestonePickupHarness.groundLoot.materialize(createItemResult("rock-inventory", "limestone", 3), source)[0];
const limestoneInventory = new PlayerInventory();
const limestoneResults = new TemporaryPickupResultSink();
assert.equal(new PickupSystem(limestonePickupHarness.groundLoot, interaction, limestoneInventory, limestoneResults).tryPickup(limestoneLoot, source), true);
assert.equal(limestoneInventory.totalQuantity("limestone"), 3);

const rejectionHarness = lootHarness();
const rejectedLoot = rejectionHarness.groundLoot.materialize(createItemResult("tree-full", "pine-log", 3), source)[0];
const rejectionInventory = new PlayerInventory();
fillFull(rejectionInventory);
const rejectionResults = new TemporaryPickupResultSink();
const rejectionFeedback = { count: 0, handleInventoryFull() { this.count += 1; } };
const rejectedPickup = new PickupSystem(rejectionHarness.groundLoot, interaction, rejectionInventory, rejectionResults, rejectionFeedback);
const rejectionBefore = rejectionInventory.getSlots();
const clearedBefore = interaction.cleared;
assert.equal(rejectedPickup.tryPickup(rejectedLoot, source), false);
assert.equal(rejectedLoot.state, "active");
assert.equal(rejectedLoot.isInteractionEnabled(), true);
assert.equal(rejectionHarness.groundLoot.activeCount, 1);
assert.equal(rejectionHarness.interactables.includes(rejectedLoot), true);
assert.deepEqual(rejectionInventory.getSlots(), rejectionBefore);
assert.equal(rejectionResults.resultCount, 0);
assert.equal(rejectionResults.lastResult, null);
assert.equal(rejectionFeedback.count, 1);
assert.equal(interaction.cleared, clearedBefore, "rejected pickup must not clear its active target");
const retryInventory = new PlayerInventory();
const retryResults = new TemporaryPickupResultSink();
assert.equal(new PickupSystem(rejectionHarness.groundLoot, interaction, retryInventory, retryResults).tryPickup(rejectedLoot, source), true);
assert.equal(retryInventory.totalQuantity("pine-log"), 3, "same still-active loot can succeed after capacity is available");

assert.equal(ITEM_REGISTRY.get("pine-log").maxStack, 20);
assert.equal(ITEM_REGISTRY.get("limestone").maxStack, 20);
assert.deepEqual(ITEM_REGISTRY.getAll().map((definition) => definition.id).sort(), ["cargo-pants", "dad-hat", "hatchet", "limestone", "pickaxe", "pine-log", "shirt", "sneakers", "spear"], "catalog must contain resources, armor, tools, and spear");
const inventorySource = await readFile(new URL("../src/inventory/PlayerInventory.ts", import.meta.url), "utf8");
for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "GroundLoot", "worldPosition", "InventoryItemDefinition"]) {
  assert.equal(inventorySource.includes(forbidden), false, `Inventory domain must not contain ${forbidden}`);
}
const panelSource = await readFile(new URL("../src/ui/InventoryPanel.ts", import.meta.url), "utf8");
const hudSource = await readFile(new URL("../src/ui/HUD.ts", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const inputSource = await readFile(new URL("../src/input/InputController.ts", import.meta.url), "utf8");
assert.equal(panelSource.includes("ITEM_ICONS"), true, "Inventory UI must reuse shared item icons");
assert.equal(panelSource.includes("INVENTORY_CONFIG.baseSlotCount"), true, "slot DOM must derive from centralized config");
assert.equal(panelSource.includes("INVENTORY_CONFIG.columns"), true, "Inventory grid columns must derive from centralized config");
assert.equal(hudSource.includes("inventory-toggle"), true, "existing HUD utility strip must expose Inventory toggle");
assert.equal(gameSource.includes('event.code === "KeyI"'), true, "desktop I toggle must exist");
assert.equal(gameSource.includes('event.code === "Escape"'), true, "Escape close must exist");
assert.equal(gameSource.includes("this.harvesting.cancel()"), true, "opening Inventory must use existing harvesting cancellation");
assert.equal(inputSource.includes("setSuppressed"), true, "Inventory modal must suppress normalized gameplay input");
assert.equal(panelSource.includes("beginDrag"), true, "Inventory UI must support pointer drag-and-drop rearrange / equip");
assert.equal(panelSource.includes("applyDrop"), true, "Inventory UI must apply drop targets for storage, armor, and weapon");
assert.equal(inventorySource.includes("rearrangeSlots"), true, "Inventory domain must support slot rearrange for drag reorder");
assert.equal(cssSource.includes("inventory-slot::after"), false, "Inventory slots must not show numeric indices");
assert.equal(cssSource.includes("inventory-drag-ghost"), true, "Drag ghost styles must exist");

console.log("Player Inventory verification passed (drag, equip slots, acceptance groups)");
