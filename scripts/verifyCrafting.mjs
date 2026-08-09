import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { PlayerInventory, planConsumeAndInsert } from "../src/inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, createItemStack } from "../src/items/ItemSystem.ts";

const stackAt = (inventory, index) => inventory.getSlot(index).stack;
const count = (inventory, itemId) => inventory.totalQuantity(itemId);

assert.equal(ITEM_REGISTRY.getAll().length, 8, "M08 item catalog must contain exactly eight definitions");
assert.deepEqual(ITEM_REGISTRY.getAll().map((definition) => definition.id), [
  "pine-log", "limestone", "dad-hat", "shirt", "cargo-pants", "sneakers", "hatchet", "pickaxe",
]);
for (const [id, name] of [["hatchet", "Hatchet"], ["pickaxe", "Pickaxe"]]) {
  const definition = ITEM_REGISTRY.get(id);
  assert.equal(definition.displayName, name);
  assert.equal(definition.category, "tool");
  assert.equal(definition.maxStack, 1);
  assert.equal(definition.iconId, id);
  assert.equal(definition.equipment, undefined);
  assert.equal(definition.maxDurability, 50, `${id} maxDurability must be 50`);
  assert.throws(() => createItemStack(id, 2), RangeError);
}

const recipes = CRAFTING_RECIPES.getAll();
assert.equal(recipes.length, 2, "starter recipe registry must contain exactly two recipes");
assert.equal(Object.isFrozen(recipes), true);
assert.deepEqual(recipes.map((recipe) => recipe.id), ["hatchet", "pickaxe"]);
for (const id of ["hatchet", "pickaxe"]) {
  const recipe = CRAFTING_RECIPES.get(id);
  assert.equal(recipe.id, id);
  assert.deepEqual(recipe.output, { itemId: id, quantity: 1, currentDurability: 50 });
  assert.deepEqual(recipe.ingredients, [
    { itemId: "pine-log", quantity: 3 },
    { itemId: "limestone", quantity: 3 },
  ]);
  assert.equal(Object.isFrozen(recipe), true);
  assert.equal(Object.isFrozen(recipe.output), true);
  assert.equal(Object.isFrozen(recipe.ingredients), true);
  assert.equal(Object.isFrozen(recipe.ingredients[0]), true);
}
assert.equal(CRAFTING_RECIPES.find("unknown"), null);

const empty = new PlayerInventory();
const emptyCrafting = new CraftingSystem(empty);
let state = emptyCrafting.getRecipeState("hatchet");
assert.ok(state);
assert.equal(state.craftable, false);
assert.equal(state.blockedBy, "not-enough-resources");
assert.deepEqual(state.ingredients.map(({ owned }) => owned), [0, 0]);
assert.equal(emptyCrafting.getRecipeState("unknown"), null);
let result = emptyCrafting.craft("unknown");
assert.equal(result.accepted, false);
assert.equal(result.status, "invalid-recipe");
assert.deepEqual(empty.getSlots(), new PlayerInventory().getSlots());

const exact = new PlayerInventory();
exact.tryInsert(createItemStack("pine-log", 3));
exact.tryInsert(createItemStack("limestone", 3));
const exactCrafting = new CraftingSystem(exact);
state = exactCrafting.getRecipeState("hatchet");
assert.equal(state.craftable, true);
assert.deepEqual(state.ingredients.map(({ owned }) => owned), [3, 3]);
result = exactCrafting.craft("hatchet");
assert.equal(result.accepted, true);
assert.equal(result.status, "crafted");
assert.deepEqual(result.output, { itemId: "hatchet", quantity: 1, currentDurability: 50 });
assert.equal(count(exact, "pine-log"), 0);
assert.equal(count(exact, "limestone"), 0);
assert.equal(count(exact, "hatchet"), 1);
assert.deepEqual(stackAt(exact, 0), { itemId: "hatchet", quantity: 1, currentDurability: 50 }, "lowest freed slot receives full-durability output");

const more = new PlayerInventory();
more.tryInsert(createItemStack("pine-log", 8));
more.tryInsert(createItemStack("limestone", 9));
const moreCrafting = new CraftingSystem(more);
assert.equal(moreCrafting.getRecipeState("pickaxe").craftable, true);
assert.equal(moreCrafting.craft("pickaxe").accepted, true);
assert.equal(count(more, "pine-log"), 5);
assert.equal(count(more, "limestone"), 6);
assert.equal(count(more, "pickaxe"), 1);

const split = new PlayerInventory();
split.tryInsert(createItemStack("pine-log", 20));
split.tryInsert(createItemStack("pine-log", 1));
split.tryInsert(createItemStack("limestone", 20));
split.tryInsert(createItemStack("limestone", 1));
assert.equal(split.exchangeWholeStack(0, stackAt(split, 0), createItemStack("pine-log", 2)), true);
assert.equal(split.exchangeWholeStack(2, stackAt(split, 2), createItemStack("limestone", 2)), true);
const splitCrafting = new CraftingSystem(split);
assert.deepEqual(splitCrafting.getRecipeState("hatchet").ingredients.map(({ owned }) => owned), [3, 3]);
assert.equal(splitCrafting.craft("hatchet").accepted, true, "ingredients split across slots must count and craft");
assert.equal(count(split, "pine-log"), 0);
assert.equal(count(split, "limestone"), 0);
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
assert.equal(deterministic.slots[0].itemId, "hatchet", "output uses lowest slot emptied by consumption");
assert.equal(deterministic.slots[1].quantity, 7, "lowest limestone slot is consumed first");
assert.equal(deterministic.slots[4].quantity, 4, "remaining pine requirement comes from next matching slot");
assert.equal(deterministic.slots[6].quantity, 2, "later limestone stack remains untouched");
assert.equal(deterministic.slots[7].quantity, 5, "latest limestone stack remains untouched");

const repeated = new PlayerInventory();
repeated.tryInsert(createItemStack("pine-log", 6));
repeated.tryInsert(createItemStack("limestone", 6));
const repeatedCrafting = new CraftingSystem(repeated);
assert.equal(repeatedCrafting.craft("hatchet").accepted, true);
assert.equal(count(repeated, "hatchet"), 1);
assert.equal(repeatedCrafting.craft("hatchet").accepted, true);
assert.equal(count(repeated, "hatchet"), 2);
assert.equal(repeated.getSlots().filter((slot) => slot.stack?.itemId === "hatchet").length, 2, "non-stackable outputs occupy two slots");
assert.equal(count(repeated, "pine-log"), 0);
assert.equal(count(repeated, "limestone"), 0);
const third = repeatedCrafting.craft("hatchet");
assert.equal(third.accepted, false);
assert.equal(third.status, "not-enough-resources");
assert.equal(count(repeated, "hatchet"), 2, "failed rapid follow-up cannot duplicate output");

for (const [pine, limestone] of [[3, 2], [0, 3], [0, 0]]) {
  const insufficient = new PlayerInventory();
  if (pine) insufficient.tryInsert(createItemStack("pine-log", pine));
  if (limestone) insufficient.tryInsert(createItemStack("limestone", limestone));
  const before = insufficient.getSlots();
  const rejected = new CraftingSystem(insufficient).craft("hatchet");
  assert.equal(rejected.accepted, false);
  assert.equal(rejected.status, "not-enough-resources");
  assert.deepEqual(insufficient.getSlots(), before, "insufficient resources must leave byte-equivalent slot state");
  assert.equal(count(insufficient, "hatchet"), 0);
}

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
const atomicRejected = new CraftingSystem(atomicFull).craft("hatchet");
assert.equal(atomicRejected.accepted, false);
assert.equal(atomicRejected.status, "inventory-full");
assert.deepEqual(atomicFull.getSlots(), atomicBefore, "capacity rejection must not consume ingredients or create output");
assert.equal(count(atomicFull, "pine-log"), 20);
assert.equal(count(atomicFull, "limestone"), 20);
assert.equal(count(atomicFull, "hatchet"), 2);

const freed = new PlayerInventory();
freed.tryInsert(createItemStack("pine-log", 3));
freed.tryInsert(createItemStack("limestone", 20));
fillNonStackableBlockers(freed);
assert.equal(freed.emptySlotCount, 0);
const unrelatedBefore = count(freed, "dad-hat") + count(freed, "shirt") + count(freed, "cargo-pants") + count(freed, "sneakers");
const freedResult = new CraftingSystem(freed).craft("pickaxe");
assert.equal(freedResult.accepted, true, "post-consumption freed slot must allow output in initially full Inventory");
assert.equal(freed.emptySlotCount, 0);
assert.equal(count(freed, "pine-log"), 0);
assert.equal(count(freed, "limestone"), 17);
assert.equal(count(freed, "pickaxe"), 3);
assert.equal(count(freed, "dad-hat") + count(freed, "shirt") + count(freed, "cargo-pants") + count(freed, "sneakers"), unrelatedBefore, "unrelated items are conserved");

const inventorySource = await readFile(new URL("../src/inventory/PlayerInventory.ts", import.meta.url), "utf8");
const craftingSystemSource = await readFile(new URL("../src/crafting/CraftingSystem.ts", import.meta.url), "utf8");
const recipeSource = await readFile(new URL("../src/crafting/CraftingRecipeRegistry.ts", import.meta.url), "utf8");
const craftingTypesSource = await readFile(new URL("../src/crafting/CraftingTypes.ts", import.meta.url), "utf8");
const panelSource = await readFile(new URL("../src/ui/CraftingPanel.ts", import.meta.url), "utf8");
const iconSource = await readFile(new URL("../src/ui/itemIcons.ts", import.meta.url), "utf8");
const hudSource = await readFile(new URL("../src/ui/HUD.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const equipmentTypesSource = await readFile(new URL("../src/equipment/EquipmentTypes.ts", import.meta.url), "utf8");
const harvestToolsSource = await readFile(new URL("../src/harvesting/InventoryHarvestTools.ts", import.meta.url), "utf8");
const harvestSystemSource = await readFile(new URL("../src/harvesting/HarvestingSystem.ts", import.meta.url), "utf8");

for (const source of [craftingSystemSource, recipeSource, craftingTypesSource]) {
  for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "GroundLoot", "HarvestingSystem", "PlayerEquipment", "EquipmentVisualController"]) {
    assert.equal(source.includes(forbidden), false, `Crafting domain must not depend on ${forbidden}`);
  }
}
for (const forbidden of ["CraftingRecipe", "CraftingSystem", "CraftingPanel"]) {
  assert.equal(inventorySource.includes(forbidden), false, `PlayerInventory must not depend on ${forbidden}`);
}
assert.equal(panelSource.includes("ITEM_ICONS"), true, "Crafting UI must reuse shared icons");
assert.equal(panelSource.includes("recipe.ingredients"), true, "Crafting UI must derive ingredient rows from production recipes");
assert.equal(panelSource.includes("getRecipeState"), true, "Craft button state must come from CraftingSystem");
assert.equal(panelSource.includes("Pine Log"), false, "ingredient names must not be hardcoded in UI");
assert.equal(iconSource.includes("hatchet"), true);
assert.equal(iconSource.includes("pickaxe"), true);
assert.equal(hudSource.includes("crafting-toggle"), true, "existing Blueprints shell must be reused");
assert.equal(gameSource.includes('event.code === "KeyB"'), true);
assert.equal(gameSource.includes("this.harvesting.cancel()"), true);
assert.equal(gameSource.includes("this.craftingPanel.close()"), true, "Inventory and Crafting panels must coordinate exclusivity");
assert.equal(equipmentTypesSource.includes('"head", "torso", "legs", "feet"'), true);
assert.equal(/weapon|tool|mainHand|offHand/.test(equipmentTypesSource), false, "M08 must not add a tool/weapon Equipment slot");
assert.equal(harvestToolsSource.includes("PlayerInventory"), true, "production harvest tools read PlayerInventory");
assert.equal(harvestSystemSource.includes("InventoryHarvestTools"), true);
assert.equal(harvestSystemSource.includes("PrototypeToolLoadout"), false, "harvesting must not depend on PrototypeToolLoadout");
assert.equal(gameSource.includes("PrototypeToolLoadout"), false);
assert.equal(craftingSystemSource.includes("PrototypeToolLoadout"), false, "crafting remains inventory-only for tool output");
assert.equal(/durability|maxDurability|craftTime|workbench|stationType|craftAll|craftQueue|remoteStorage/i.test(`${craftingSystemSource}\n${recipeSource}\n${craftingTypesSource}`), false, "M08 domain must stay within starter instant crafting scope");

console.log("Crafting verification passed (starter recipes, atomicity, capacity, and boundaries)");
