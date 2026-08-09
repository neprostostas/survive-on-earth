import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createItemResult, createItemStack } from "../src/items/ItemSystem.ts";
import { GroundLoot } from "../src/ground-loot/GroundLoot.ts";
import { GroundLootSystem, groundLootPosition } from "../src/ground-loot/GroundLootSystem.ts";
import { PickupSystem } from "../src/ground-loot/PickupSystem.ts";
import { TemporaryPickupResultSink } from "../src/ground-loot/PickupResult.ts";
import { GROUND_LOOT_CONFIG } from "../src/ground-loot/groundLootConfig.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";

function harness() {
  const interactables = [];
  const registry = {
    addInteractable(entity) { interactables.push(entity); },
    removeInteractable(entity) {
      const index = interactables.indexOf(entity);
      if (index >= 0) interactables.splice(index, 1);
    },
  };
  const system = new GroundLootSystem(registry);
  return { interactables, system };
}

const source = Object.freeze({ x: 4, y: 0, z: -3 });
const pineStack = createItemStack("pine-log", 3);
const pineResult = Object.freeze({ sourceId: "tree-test", itemId: "pine-log", quantity: 3, stacks: Object.freeze([pineStack]) });
const pineHarness = harness();
const [pine] = pineHarness.system.materialize(pineResult, source);
assert.ok(pine, "valid Pine Log x3 stack must materialize");
assert.equal(pine.stack, pineStack, "Ground Loot must retain the original immutable ItemStack");
assert.equal(pine.stack.itemId, "pine-log");
assert.equal(pine.stack.quantity, 3);
assert.equal(Object.isFrozen(pineStack), true);
assert.deepEqual(pineStack, { itemId: "pine-log", quantity: 3 }, "materialization must not mutate its ItemStack");
assert.equal(pine.state, "active");
assert.equal(pine.isInteractionEnabled(), true);

const limestoneHarness = harness();
const [limestone] = limestoneHarness.system.materialize(createItemResult("rock-test", "limestone", 3), source);
assert.ok(limestone, "valid Limestone x3 stack must materialize");
assert.equal(limestone.stack.itemId, "limestone");
assert.equal(limestone.stack.quantity, 3);
assert.equal(pine.interactionId, limestone.interactionId, "independent systems restart deterministic session IDs");

const uniqueHarness = harness();
const first = uniqueHarness.system.materialize(createItemResult("tree-a", "pine-log", 3), source)[0];
const second = uniqueHarness.system.materialize(createItemResult("tree-b", "pine-log", 3), source)[0];
assert.notEqual(first.interactionId, second.interactionId, "same-item Ground Loot entities need unique runtime IDs");
assert.match(first.interactionId, /^ground-loot-\d{4}$/);

const multiHarness = harness();
const multiResult = createItemResult("synthetic", "pine-log", 47);
const multi = multiHarness.system.materialize(multiResult, source);
assert.equal(multi.length, 3, "[20, 20, 7] must create three Ground Loot entities");
assert.deepEqual(multi.map((entity) => entity.stack.quantity), [20, 20, 7]);
assert.notDeepEqual(multi.map((entity) => entity.stack.quantity), Array(47).fill(1), "quantity must not split into unit entities");
assert.equal(multiHarness.system.materialize(multiResult, source).length, 0, "same ItemResult callback must not materialize twice");

const singlePosition = groundLootPosition(source, 0, 1);
assert.equal(singlePosition.y, source.y + GROUND_LOOT_CONFIG.spawnHeight);
assert.notEqual(singlePosition.x, source.x);
assert.deepEqual(singlePosition, groundLootPosition(source, 0, 1), "placement must be deterministic");
assert.notDeepEqual(groundLootPosition(source, 0, 3), groundLootPosition(source, 1, 3), "multiple stacks need independent compact positions");
const groundLootSource = await readFile(new URL("../src/ground-loot/GroundLootSystem.ts", import.meta.url), "utf8");
assert.equal(groundLootSource.includes("Math.random"), false, "gameplay placement must not depend on Math.random");

const pickupHarness = harness();
const pickedEntity = pickupHarness.system.materialize(createItemResult("tree-pickup", "pine-log", 3), source)[0];
const pickupSink = new TemporaryPickupResultSink();
const interactionCalls = { cleared: 0 };
const interaction = {
  clearTarget() { interactionCalls.cleared += 1; },
};
const pickup = new PickupSystem(pickupHarness.system, interaction, new PlayerInventory(), pickupSink);
assert.equal(pickup.tryPickup(pickedEntity, { x: 0, y: 0, z: 0 }), true);
assert.deepEqual(pickupSink.lastResult, { groundLootId: pickedEntity.interactionId, stack: pickedEntity.stack });
assert.equal(pickupSink.lastResult.stack.itemId, "pine-log");
assert.equal(pickupSink.lastResult.stack.quantity, 3);
assert.equal(pickupSink.resultCount, 1);
assert.equal(pickedEntity.state, "removed");
assert.equal(pickedEntity.isInteractionEnabled(), false);
assert.equal(pickupHarness.system.activeCount, 0);
assert.equal(pickupHarness.interactables.includes(pickedEntity), false);
assert.equal(interactionCalls.cleared, 1);
assert.equal(pickup.tryPickup(pickedEntity, { x: 0, y: 0, z: 0 }), false, "second pickup must fail");
assert.equal(pickup.tryPickup(pickedEntity, { x: 0, y: 0, z: 0 }), false, "same-frame duplicate request must fail");
assert.equal(pickupSink.resultCount, 1, "duplicates must not emit another result");

const rockPickupHarness = harness();
const rockEntity = rockPickupHarness.system.materialize(createItemResult("rock-pickup", "limestone", 3), source)[0];
const rockSink = new TemporaryPickupResultSink();
const rockPickup = new PickupSystem(rockPickupHarness.system, interaction, new PlayerInventory(), rockSink);
assert.equal(rockPickup.tryPickup(rockEntity, source), true);
assert.deepEqual(rockSink.lastResult.stack, { itemId: "limestone", quantity: 3 });

const independentHarness = harness();
const entityA = independentHarness.system.materialize(createItemResult("tree-independent-a", "pine-log", 3), source)[0];
const entityB = independentHarness.system.materialize(createItemResult("tree-independent-b", "pine-log", 3), source)[0];
const independentSink = new TemporaryPickupResultSink();
const independentPickup = new PickupSystem(independentHarness.system, interaction, new PlayerInventory(), independentSink);
assert.equal(independentPickup.tryPickup(entityA, source), true);
assert.equal(entityB.isInteractionEnabled(), true, "picking one entity must not affect another");
assert.equal(independentHarness.system.activeCount, 1);
assert.equal(independentPickup.tryPickup(entityB, source), true);
assert.equal(independentSink.resultCount, 2);

const collecting = new GroundLoot("ground-loot-collecting", createItemStack("pine-log", 3), source, 0.3);
const rejectedClaim = new GroundLoot("ground-loot-rejected-claim", createItemStack("pine-log", 3), source, 0.3);
assert.equal(rejectedClaim.claimIfAccepted(() => false), null);
assert.equal(rejectedClaim.state, "active", "rejected destination must leave Ground Loot active");
assert.equal(rejectedClaim.isInteractionEnabled(), true);
assert.ok(collecting.claim());
assert.equal(collecting.state, "collecting");
assert.equal(collecting.claim(), null, "collecting Ground Loot cannot be claimed twice");
assert.equal(collecting.remove(), true);
assert.equal(collecting.state, "removed");
assert.equal(collecting.claim(), null, "removed Ground Loot cannot be picked");
assert.equal(collecting.remove(), false, "removed lifecycle is terminal");

assert.deepEqual(Object.keys(pickupSink.lastResult).sort(), ["groundLootId", "stack"]);
assert.equal("itemId" in pine, false, "Ground Loot must not duplicate ItemStack fields");
assert.equal("quantity" in pine, false, "Ground Loot must not duplicate ItemStack quantity");
assert.equal("inventorySlot" in pickupSink.lastResult, false, "PickupResult must not contain InventorySlot");
assert.equal("items" in pickupSink, false, "temporary pickup sink must not hide an item collection");

console.log("Ground Loot and pickup verification passed (27 boundary groups)");
