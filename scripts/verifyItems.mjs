import assert from "node:assert/strict";
import {
  ITEM_REGISTRY,
  createItemResult,
  createItemStack,
  createItemStacks,
  mergeItemStacks,
} from "../src/items/ItemSystem.ts";
import { HarvestableResource } from "../src/harvesting/HarvestableResource.ts";

const definitions = ITEM_REGISTRY.getAll();
assert.equal(definitions.length, 2, "initial registry must contain exactly two item definitions");
assert.equal(ITEM_REGISTRY.has("pine-log"), true, "pine-log definition must exist");
assert.equal(ITEM_REGISTRY.has("limestone"), true, "limestone definition must exist");
assert.equal(ITEM_REGISTRY.get("pine-log").maxStack, 20, "Pine Log max stack must be 20");
assert.equal(ITEM_REGISTRY.get("limestone").maxStack, 20, "Limestone max stack must be 20");
assert.throws(() => ITEM_REGISTRY.get("unknown-item"), /Unknown item definition/, "unknown item must fail predictably");

assert.deepEqual(createItemStack("pine-log", 3), { itemId: "pine-log", quantity: 3 });
assert.deepEqual(createItemStack("limestone", 3), { itemId: "limestone", quantity: 3 });
for (const invalid of [0, -5, 21, 1.5]) assert.throws(() => createItemStack("pine-log", invalid), RangeError);

for (const [quantity, expected] of [[1, [1]], [20, [20]], [21, [20, 1]], [40, [20, 20]], [47, [20, 20, 7]]]) {
  assert.deepEqual(createItemStacks("pine-log", quantity).map((stack) => stack.quantity), expected, `pine-log split ${quantity}`);
  assert.deepEqual(createItemStacks("limestone", quantity).map((stack) => stack.quantity), expected, `limestone split ${quantity}`);
}

let merged = mergeItemStacks(createItemStack("pine-log", 7), createItemStack("pine-log", 5));
assert.deepEqual(merged.stack, { itemId: "pine-log", quantity: 12 });
assert.equal(merged.remainder, null, "merge below max stack must have no remainder");
merged = mergeItemStacks(createItemStack("pine-log", 18), createItemStack("pine-log", 5));
assert.deepEqual(merged.stack, { itemId: "pine-log", quantity: 20 });
assert.deepEqual(merged.remainder, { itemId: "pine-log", quantity: 3 });
assert.throws(() => mergeItemStacks(createItemStack("pine-log", 1), createItemStack("limestone", 1)), /different item types/);

const position = { x: 0, y: 0, z: 0 };
const visual = { impact() {}, deplete() {}, update() {} };
const resource = (id, kind) => new HarvestableResource({ id, kind, position: () => position, radius: () => 0.5, visualEnabled: () => true, visual });

const partialTree = resource("tree-partial", "pine-tree");
partialTree.applyImpact("hatchet");
partialTree.applyImpact("hatchet");
assert.equal(partialTree.claimYield(), null, "interrupted partial tree must not generate a result");
assert.equal(resource("tree-wrong-tool", "pine-tree").applyImpact("pickaxe").accepted, false, "wrong tool must not harvest");
assert.equal(resource("tree-wrong-tool-result", "pine-tree").claimYield(), null, "wrong or missing tool must not generate a result");

const tree = resource("tree-result", "pine-tree");
for (let hit = 0; hit < 4; hit += 1) tree.applyImpact("hatchet");
const treeYield = tree.claimYield();
assert.deepEqual(treeYield, { itemId: "pine-log", quantity: 3 }, "pine tree yield must be Pine Log x3");
assert.ok(treeYield);
const treeResult = createItemResult(tree.resourceId, treeYield.itemId, treeYield.quantity);
assert.equal(treeResult.sourceId, "tree-result");
assert.deepEqual(treeResult.stacks.map((stack) => stack.quantity), [3]);
assert.equal(tree.claimYield(), null, "tree yield must be one-shot");
tree.applyImpact("hatchet");
assert.equal(tree.claimYield(), null, "extra impact after depletion must not duplicate result");

const rock = resource("rock-result", "limestone-rock");
for (let hit = 0; hit < 5; hit += 1) rock.applyImpact("pickaxe");
const rockYield = rock.claimYield();
assert.deepEqual(rockYield, { itemId: "limestone", quantity: 3 }, "limestone rock yield must be Limestone x3");
assert.ok(rockYield);
const rockResult = createItemResult(rock.resourceId, rockYield.itemId, rockYield.quantity);
assert.deepEqual(rockResult.stacks.map((stack) => stack.quantity), [3]);
assert.equal(rock.claimYield(), null, "rock yield must be one-shot");

console.log("Item system verification passed");
