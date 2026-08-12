/**
 * Crafting domain: transactions, capacity, bench-tier gate.
 * (Replaces legacy M08 frozen-starter-catalog size locks.)
 */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { CRAFT_TIER_ASSEMBLY, CRAFT_TIER_FIELD } from "../src/crafting/CraftBenchTiers.ts";
import { PlayerInventory, planConsumeAndInsert } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

const stackAt = (inventory, index) => inventory.getSlot(index).stack;
const count = (inventory, itemId) => inventory.totalQuantity(itemId);

assert.ok(CRAFTING_RECIPES.find("hatchet"));
assert.ok(CRAFTING_RECIPES.find("pickaxe"));
assert.ok(CRAFTING_RECIPES.find("spear"));
assert.equal(CRAFTING_RECIPES.find("unknown"), null);
assert.equal(Object.isFrozen(CRAFTING_RECIPES.getAll()), true);

const hatchet = CRAFTING_RECIPES.get("hatchet");
assert.equal(hatchet.output.itemId, "hatchet");
assert.equal(hatchet.ingredients.length, 2);

const empty = new PlayerInventory();
const emptyCrafting = new CraftingSystem(empty);
emptyCrafting.setActiveBenchTier(CRAFT_TIER_FIELD);
let state = emptyCrafting.getRecipeState("hatchet");
assert.ok(state);
assert.equal(state.craftable, false);
assert.equal(state.blockedBy, "not-enough-resources");
assert.equal(emptyCrafting.getRecipeState("unknown"), null);
let result = emptyCrafting.craft("unknown");
assert.equal(result.accepted, false);
assert.equal(result.status, "invalid-recipe");

const exact = new PlayerInventory();
exact.tryInsert(createItemStack("pine-log", 3));
exact.tryInsert(createItemStack("limestone", 3));
const exactCrafting = new CraftingSystem(exact);
exactCrafting.setActiveBenchTier(CRAFT_TIER_FIELD);
state = exactCrafting.getRecipeState("hatchet");
assert.equal(state.craftable, true);
result = exactCrafting.craft("hatchet");
assert.equal(result.accepted, true);
assert.equal(result.status, "crafted");
assert.equal(result.output?.itemId, "hatchet");
assert.equal(count(exact, "pine-log"), 0);
assert.equal(count(exact, "limestone"), 0);
assert.equal(count(exact, "hatchet"), 1);
assert.equal(stackAt(exact, 0)?.itemId, "hatchet");

const more = new PlayerInventory();
more.tryInsert(createItemStack("pine-log", 8));
more.tryInsert(createItemStack("limestone", 9));
const moreCrafting = new CraftingSystem(more);
moreCrafting.setActiveBenchTier(CRAFT_TIER_FIELD);
assert.equal(moreCrafting.getRecipeState("pickaxe").craftable, true);
assert.equal(moreCrafting.craft("pickaxe").accepted, true);
assert.equal(count(more, "pine-log"), 5);
assert.equal(count(more, "limestone"), 6);
assert.equal(count(more, "pickaxe"), 1);

// split stacks
const split = new PlayerInventory();
split.tryInsert(createItemStack("pine-log", 20));
split.tryInsert(createItemStack("pine-log", 1));
split.tryInsert(createItemStack("limestone", 20));
split.tryInsert(createItemStack("limestone", 1));
assert.equal(split.exchangeWholeStack(0, stackAt(split, 0), createItemStack("pine-log", 2)), true);
assert.equal(split.exchangeWholeStack(2, stackAt(split, 2), createItemStack("limestone", 2)), true);
const splitCrafting = new CraftingSystem(split);
splitCrafting.setActiveBenchTier(CRAFT_TIER_FIELD);
assert.equal(splitCrafting.craft("hatchet").accepted, true, "ingredients split across slots");
assert.equal(count(split, "hatchet"), 1);

const deterministicSlots = Object.freeze([
  createItemStack("pine-log", 2), createItemStack("limestone", 10), null, null,
  createItemStack("pine-log", 5), null, createItemStack("limestone", 2), createItemStack("limestone", 5), null, null,
]);
const deterministic = planConsumeAndInsert(
  deterministicSlots,
  CRAFTING_RECIPES.get("hatchet").ingredients,
  createItemStack("hatchet", 1),
);
assert.equal(deterministic.accepted, true);
assert.ok(deterministic.slots);
assert.equal(deterministic.slots[0].itemId, "hatchet");

// bench gate
{
  const inv = new PlayerInventory();
  inv.tryInsert(createItemStack("pine-log", 4));
  inv.tryInsert(createItemStack("iron-bar", 4));
  inv.tryInsert(createItemStack("rope", 2));
  const crafts = new CraftingSystem(inv);
  crafts.setActiveBenchTier(CRAFT_TIER_FIELD);
  assert.equal(crafts.getRecipeState("improved-hatchet")?.blockedBy, "need-bench");
  crafts.setActiveBenchTier(CRAFT_TIER_ASSEMBLY);
  assert.equal(crafts.getRecipeState("improved-hatchet")?.craftable, true);
}

// inventory full atomic
function fillNonStackableBlockers(inventory) {
  for (const id of ["dad-hat", "shirt", "cargo-pants", "sneakers", "hatchet", "hatchet", "pickaxe", "pickaxe"]) {
    assert.equal(inventory.tryInsert(createItemStack(id, 1)).accepted, true);
  }
}
const atomicFull = new PlayerInventory();
atomicFull.tryInsert(createItemStack("pine-log", 20));
atomicFull.tryInsert(createItemStack("limestone", 20));
fillNonStackableBlockers(atomicFull);
assert.equal(atomicFull.emptySlotCount, 0);
const atomicBefore = atomicFull.getSlots();
const craftsFull = new CraftingSystem(atomicFull);
craftsFull.setActiveBenchTier(CRAFT_TIER_FIELD);
const atomicRejected = craftsFull.craft("hatchet");
assert.equal(atomicRejected.accepted, false);
assert.equal(atomicRejected.status, "inventory-full");
assert.deepEqual(atomicFull.getSlots(), atomicBefore);

// domain boundaries
const craftingSystemSource = await readFile(new URL("../src/crafting/CraftingSystem.ts", import.meta.url), "utf8");
const recipeSource = await readFile(new URL("../src/crafting/CraftingRecipeRegistry.ts", import.meta.url), "utf8");
const craftingTypesSource = await readFile(new URL("../src/crafting/CraftingTypes.ts", import.meta.url), "utf8");
const inventorySource = await readFile(new URL("../src/inventory/PlayerInventory.ts", import.meta.url), "utf8");
const panelSource = await readFile(new URL("../src/ui/CraftingPanel.ts", import.meta.url), "utf8");

for (const source of [craftingSystemSource, recipeSource, craftingTypesSource]) {
  for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement"]) {
    assert.equal(source.includes(forbidden), false, `Crafting domain must not depend on ${forbidden}`);
  }
}
assert.equal(inventorySource.includes("CraftingSystem"), false);
assert.equal(panelSource.includes("getRecipeState"), true);
assert.equal(panelSource.includes("need-bench") || panelSource.includes("needBench"), true);

console.log("Crafting verification passed (transactions, capacity, bench tier)");
