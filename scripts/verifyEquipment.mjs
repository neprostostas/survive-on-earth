import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { EquipmentSystem } from "../src/equipment/EquipmentSystem.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { PlayerEquipment } from "../src/equipment/PlayerEquipment.ts";
import { GroundLootSystem } from "../src/ground-loot/GroundLootSystem.ts";
import { PickupSystem } from "../src/ground-loot/PickupSystem.ts";
import { TemporaryPickupResultSink } from "../src/ground-loot/PickupResult.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, createItemResult, createItemStack, createItemStacks } from "../src/items/ItemSystem.ts";

const armorCases = [
  ["dad-hat", "Dad Hat", "head", 2],
  ["shirt", "Shirt", "torso", 3],
  ["cargo-pants", "Cargo Pants", "legs", 3],
  ["sneakers", "Sneakers", "feet", 0],
];

assert.deepEqual(EQUIPMENT_SLOT_IDS, ["head", "torso", "legs", "feet"]);
assert.equal(Object.isFrozen(EQUIPMENT_SLOT_IDS), true);
assert.equal(ITEM_REGISTRY.getAll().length, 10);
assert.deepEqual(ITEM_REGISTRY.getAll().map((definition) => definition.id), ["pine-log", "limestone", "dad-hat", "shirt", "cargo-pants", "sneakers", "hatchet", "pickaxe", "spear"]);
for (const [id, name, slot, armor] of armorCases) {
  const definition = ITEM_REGISTRY.get(id);
  assert.equal(definition.displayName, name);
  assert.equal(definition.category, "armor");
  assert.equal(definition.maxStack, 1);
  assert.equal(definition.iconId, id);
  assert.deepEqual(definition.equipment, { slot, armor });
  assert.equal(Object.isFrozen(definition), true);
  assert.equal(Object.isFrozen(definition.equipment), true);
  assert.deepEqual(createItemStacks(id, 2).map((stack) => stack.quantity), [1, 1]);
  assert.throws(() => createItemStack(id, 2), RangeError);
}
for (const id of ["pine-log", "limestone"]) {
  const definition = ITEM_REGISTRY.get(id);
  assert.equal(definition.category, "resource");
  assert.equal(definition.maxStack, 20);
  assert.equal(definition.equipment, undefined);
}

const initial = new PlayerEquipment();
assert.equal(initial.totalArmor, 0);
assert.equal(initial.getSlots().length, 4);
assert.deepEqual(initial.getSlots().map(({ id, stack }) => [id, stack]), EQUIPMENT_SLOT_IDS.map((id) => [id, null]));
assert.equal(Object.isFrozen(initial.getSlots()), true);
assert.equal(Object.isFrozen(initial.getSlots()[0]), true);
assert.equal(Object.isFrozen(initial.getSnapshot()), true);

let equipmentChanges = 0;
const direct = new PlayerEquipment();
direct.subscribe(() => { equipmentChanges += 1; });
const directHat = createItemStack("dad-hat", 1);
assert.equal(direct.equipIfAccepted("torso", directHat, () => true), false, "wrong slot must reject");
assert.equal(direct.equipIfAccepted("head", createItemStack("pine-log", 1), () => true), false, "resource must reject");
assert.equal(direct.equipIfAccepted("head", directHat, () => false), false, "rejected transaction callback leaves state unchanged");
assert.equal(direct.totalArmor, 0);
assert.equal(equipmentChanges, 0);
assert.equal(direct.equipIfAccepted("head", directHat, (previous) => previous === null), true);
assert.equal(direct.getSlot("head").stack, directHat);
assert.equal(direct.totalArmor, 2);
assert.equal(equipmentChanges, 1);
assert.equal(direct.equipIfAccepted("head", directHat, () => true), false, "no-op equip must not emit a change");
assert.equal(equipmentChanges, 1);
assert.equal(direct.unequipIfAccepted("head", createItemStack("dad-hat", 1), () => true), false, "stale expected reference must reject");
assert.equal(direct.unequipIfAccepted("head", directHat, () => false), false, "rejected unequip callback leaves item equipped");
assert.equal(direct.unequipIfAccepted("head", directHat, () => true), true);
assert.equal(direct.getSlot("head").stack, null);
assert.equal(equipmentChanges, 2);

const inventory = new PlayerInventory();
const equipment = new PlayerEquipment();
const system = new EquipmentSystem(inventory, equipment);
const incoming = {};
for (const [id] of armorCases) {
  assert.equal(inventory.tryInsert(createItemStack(id, 1)).accepted, true);
  incoming[id] = inventory.getSlots().find((slot) => slot.stack?.itemId === id).stack;
}
assert.equal(inventory.occupiedSlotCount, 4);
for (const [id, , slot] of armorCases) {
  const source = inventory.getSlots().find((candidate) => candidate.stack === incoming[id]);
  assert.ok(source);
  const result = system.equipFromInventory(source.index, incoming[id]);
  assert.equal(result.accepted, true);
  assert.equal(result.operation, "equip");
  assert.equal(result.equipmentSlot, slot);
  assert.equal(result.inventorySlot, source.index);
  assert.equal(result.reason, null);
  assert.equal(equipment.getSlot(slot).stack, incoming[id]);
  assert.equal(inventory.getSlot(source.index).stack, null);
}
assert.equal(inventory.occupiedSlotCount, 0);
assert.equal(equipment.totalArmor, 8);
assert.equal(system.lastResult.accepted, true);

const resourceInventory = new PlayerInventory();
const resourceEquipment = new PlayerEquipment();
const resourceSystem = new EquipmentSystem(resourceInventory, resourceEquipment);
resourceInventory.tryInsert(createItemStack("pine-log", 3));
const resource = resourceInventory.getSlot(0).stack;
const resourceBefore = resourceInventory.getSlots();
let rejection = resourceSystem.equipFromInventory(0, resource);
assert.equal(rejection.accepted, false);
assert.equal(rejection.reason, "not-equipment");
assert.deepEqual(resourceInventory.getSlots(), resourceBefore);
assert.equal(resourceEquipment.totalArmor, 0);
assert.equal(resourceSystem.equipFromInventory(1).reason, "empty-source");

const swapInventory = new PlayerInventory();
const swapEquipment = new PlayerEquipment();
const swapSystem = new EquipmentSystem(swapInventory, swapEquipment);
const firstHat = createItemStack("dad-hat", 1);
const secondHat = createItemStack("dad-hat", 1);
swapInventory.tryInsert(firstHat);
swapInventory.tryInsert(secondHat);
const firstStoredHat = swapInventory.getSlot(0).stack;
const secondStoredHat = swapInventory.getSlot(1).stack;
assert.equal(swapSystem.equipFromInventory(0, firstStoredHat).accepted, true);
for (let index = 0; index < 9; index += 1) {
  const id = index % 2 ? "pine-log" : "limestone";
  assert.equal(swapInventory.tryInsert(createItemStack(id, 20)).accepted, true);
}
assert.equal(swapInventory.emptySlotCount, 0, "swap setup uses no empty inventory slot");
const secondSource = swapInventory.getSlots().find((slot) => slot.stack === secondStoredHat);
assert.ok(secondSource);
const swap = swapSystem.equipFromInventory(secondSource.index, secondStoredHat);
assert.equal(swap.accepted, true, "occupied equipment slot swaps into same source slot");
assert.equal(swapEquipment.getSlot("head").stack, secondStoredHat);
assert.equal(swapInventory.getSlot(secondSource.index).stack, firstStoredHat);
assert.equal(swapInventory.emptySlotCount, 0);
assert.equal(swapSystem.equipFromInventory(secondSource.index, secondStoredHat).reason, "stale-source", "duplicate stale action rejects");
assert.equal(swapEquipment.getSlot("head").stack, secondStoredHat);

const unequipInventory = new PlayerInventory();
const unequipEquipment = new PlayerEquipment();
const unequipSystem = new EquipmentSystem(unequipInventory, unequipEquipment);
const shirt = createItemStack("shirt", 1);
unequipInventory.tryInsert(shirt);
const storedShirt = unequipInventory.getSlot(0).stack;
assert.equal(unequipSystem.equipFromInventory(0, storedShirt).accepted, true);
assert.equal(unequipSystem.unequipToInventory("torso", storedShirt).accepted, true);
assert.equal(unequipEquipment.getSlot("torso").stack, null);
assert.equal(unequipInventory.getSlot(0).stack.itemId, "shirt", "deterministic insertion chooses earliest empty slot");
assert.equal(unequipSystem.unequipToInventory("torso", storedShirt).reason, "empty-source", "double unequip rejects");

const fullInventory = new PlayerInventory();
const fullEquipment = new PlayerEquipment();
const fullSystem = new EquipmentSystem(fullInventory, fullEquipment);
const fullHat = createItemStack("dad-hat", 1);
fullInventory.tryInsert(fullHat);
const storedFullHat = fullInventory.getSlot(0).stack;
assert.equal(fullSystem.equipFromInventory(0, storedFullHat).accepted, true);
for (let index = 0; index < 10; index += 1) {
  assert.equal(fullInventory.tryInsert(createItemStack(index % 2 ? "pine-log" : "limestone", 20)).accepted, true);
}
assert.equal(fullInventory.emptySlotCount, 0);
const fullBefore = fullInventory.getSlots();
const failedUnequip = fullSystem.unequipToInventory("head", storedFullHat);
assert.equal(failedUnequip.accepted, false);
assert.equal(failedUnequip.reason, "inventory-full");
assert.equal(fullEquipment.getSlot("head").stack, storedFullHat);
assert.deepEqual(fullInventory.getSlots(), fullBefore);
assert.equal(fullEquipment.totalArmor, 2);

const conservationInventory = new PlayerInventory();
const conservationEquipment = new PlayerEquipment();
const conservationSystem = new EquipmentSystem(conservationInventory, conservationEquipment);
const pants = createItemStack("cargo-pants", 1);
conservationInventory.tryInsert(pants);
const storedPants = conservationInventory.getSlot(0).stack;
const countItem = (id) => conservationInventory.totalQuantity(id) + conservationEquipment.getSlots().reduce((sum, slot) => sum + (slot.stack?.itemId === id ? slot.stack.quantity : 0), 0);
assert.equal(countItem("cargo-pants"), 1);
conservationSystem.equipFromInventory(0, storedPants);
assert.equal(countItem("cargo-pants"), 1);
conservationSystem.unequipToInventory("legs", storedPants);
assert.equal(countItem("cargo-pants"), 1);

const interactables = [];
const groundLoot = new GroundLootSystem({
  addInteractable(entity) { interactables.push(entity); },
  removeInteractable(entity) { const index = interactables.indexOf(entity); if (index >= 0) interactables.splice(index, 1); },
});
const acquisitionInventory = new PlayerInventory();
const acquisitionEquipment = new PlayerEquipment();
const acquisitionSystem = new EquipmentSystem(acquisitionInventory, acquisitionEquipment);
const pickupResults = new TemporaryPickupResultSink();
const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, acquisitionInventory, pickupResults);
for (const [index, [id, , slot]] of armorCases.entries()) {
  const position = Object.freeze({ x: index, y: 0, z: 0 });
  const loot = groundLoot.materialize(createItemResult(`armor-fixture-${id}`, id, 1), position)[0];
  assert.ok(loot);
  assert.equal(pickup.tryPickup(loot, loot.getInteractionPosition()), true);
  const source = acquisitionInventory.getSlots().find((candidate) => candidate.stack?.itemId === id);
  assert.ok(source);
  assert.equal(acquisitionSystem.equipFromInventory(source.index, source.stack).accepted, true);
  assert.equal(acquisitionEquipment.getSlot(slot).stack.itemId, id);
}
assert.equal(acquisitionEquipment.totalArmor, 8);
assert.equal(pickupResults.resultCount, 4);
assert.equal(groundLoot.activeCount, 0);

const equipmentSource = await readFile(new URL("../src/equipment/PlayerEquipment.ts", import.meta.url), "utf8");
for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "GroundLoot", "PlayerVisual"]) {
  assert.equal(equipmentSource.includes(forbidden), false, `Equipment domain must not contain ${forbidden}`);
}
const systemSource = await readFile(new URL("../src/equipment/EquipmentSystem.ts", import.meta.url), "utf8");
for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "GroundLoot", "PlayerVisual"]) {
  assert.equal(systemSource.includes(forbidden), false, `Equipment coordinator must not contain ${forbidden}`);
}
const panelSource = await readFile(new URL("../src/ui/InventoryPanel.ts", import.meta.url), "utf8");
const iconSource = await readFile(new URL("../src/ui/itemIcons.ts", import.meta.url), "utf8");
const visualSource = await readFile(new URL("../src/equipment/EquipmentVisualController.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const debugSource = await readFile(new URL("../src/debug/DebugOverlay.ts", import.meta.url), "utf8");
assert.equal(panelSource.includes("ITEM_ICONS"), true);
assert.equal(panelSource.includes("EQUIPMENT_SLOT_IDS"), true);
assert.equal(panelSource.includes("EQUIP"), true);
assert.equal(panelSource.includes("UNEQUIP"), true);
assert.equal(iconSource.includes('"dad-hat"'), true);
assert.equal(iconSource.includes('"cargo-pants"'), true);
assert.equal(visualSource.includes("equipment.subscribe"), true, "visual projection must subscribe to domain state");
assert.equal(gameSource.includes("spawnEquipmentCalibrationLoot"), true, "deterministic calibration acquisition must be wired");
assert.equal(debugSource.includes('"EQUIPMENT"'), true, "F2 must expose equipment state");
assert.equal(/backpackSlot|pocketSlot|crafting|dragstart|ondrop|drop item/i.test(`${equipmentSource}\n${systemSource}`), false, "equipment domain stays without backpack capacity / crafting / HTML5 DnD");
assert.equal(/backpackSlot|data-drop=["']backpack["']|class PocketSlot/i.test(panelSource), false, "Inventory UI must not treat backpack as droppable capacity slots");
assert.equal(panelSource.includes('dataset.drop = "inventory"') || panelSource.includes('data-drop="inventory"'), true, "real pocket cells remain inventory drop targets");
assert.equal(panelSource.includes("FUTURE_BACKPACK_SHELL_COUNT"), true, "future backpack area is presentation shell count only");
assert.equal(panelSource.includes('dataset.drop = "backpack"') || panelSource.includes('data-drop="backpack"'), false, "no backpack drop kind");
assert.equal(/weapon/.test(equipmentSource), false, "PlayerEquipment domain stays armor-only");
assert.equal(/weapon/.test(systemSource), false, "EquipmentSystem remains armor-only");
assert.equal(panelSource.includes("weapon-slot") || panelSource.includes("WEAPON"), true, "M14 inventory shows separate weapon slot UI");
assert.equal(panelSource.includes("POCKETS"), true, "M17 presentation names base storage POCKETS");
assert.equal(panelSource.includes("data-role=\"backpack-equip\""), true, "M17 backpack equip shell present but non-gameplay");
assert.equal(/currentDurability|maxDurability|tryConsumeDurability/.test(`${equipmentSource}\n${systemSource}`), false, "equipment domain has no armor durability");
assert.equal(panelSource.includes("stackDurability"), true, "inventory UI may show tool durability bars only");
assert.equal(visualSource.includes("EquipmentApparelVisuals"), true, "world clothing reuses shared apparel visuals");

console.log("Equipment verification passed (84 acceptance checks/groups)");
