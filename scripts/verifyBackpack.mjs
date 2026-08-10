import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolvePlayerMeleeProfile } from "../src/combat/resolvePlayerMeleeProfile.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { BackpackEquipSystem } from "../src/equipment/BackpackEquipSystem.ts";
import { EquipmentSystem } from "../src/equipment/EquipmentSystem.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { PlayerBackpackSlot } from "../src/equipment/PlayerBackpackSlot.ts";
import { PlayerEquipment } from "../src/equipment/PlayerEquipment.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { WeaponEquipSystem } from "../src/equipment/WeaponEquipSystem.ts";
import { GroundLootSystem } from "../src/ground-loot/GroundLootSystem.ts";
import { PickupSystem } from "../src/ground-loot/PickupSystem.ts";
import { TemporaryPickupResultSink } from "../src/ground-loot/PickupResult.ts";
import { STARTER_BASIC_BACKPACK, spawnStarterBasicBackpack } from "../src/ground-loot/starterBasicBackpack.ts";
import { HarvestRewardDelivery } from "../src/harvesting/HarvestRewardDelivery.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, createItemResult, createItemStack } from "../src/items/ItemSystem.ts";

// ——— counts / definition ———
assert.equal(ITEM_REGISTRY.getAll().length, 10);
assert.equal(CRAFTING_RECIPES.getAll().length, 3);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.equal(EQUIPMENT_SLOT_IDS.length, 4);

const packDef = ITEM_REGISTRY.get("basic-backpack");
assert.equal(packDef.displayName, "Basic Backpack");
assert.equal(packDef.maxStack, 1);
assert.equal(packDef.category, "gear");
assert.equal(packDef.backpack?.extraSlots, 5);
assert.equal(packDef.equipment, undefined);
assert.equal(packDef.meleeCombat, undefined);
assert.equal(packDef.maxDurability, undefined);
assert.equal("currentDurability" in createItemStack("basic-backpack", 1), false);

// ——— base capacity ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  assert.equal(inv.slotCount, 10);
  assert.equal(inv.baseSlotCount, 10);
  assert.equal(bag.extraSlots, 0);
  assert.throws(() => inv.getSlot(10), RangeError);
  assert.equal(inv.tryInsert(createItemStack("pine-log", 1)).accepted, true);
  // Cannot activate slots without equip path — setExtra alone expands but inactive content rules via getSlot
  assert.equal(inv.setExtraSlotCount(5), true);
  assert.equal(inv.slotCount, 15);
  assert.equal(inv.getSlot(10).stack, null);
  inv.setExtraSlotCount(0);
  assert.throws(() => inv.getSlot(10), RangeError);
}

// ——— equip identity + capacity ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  const stack = createItemStack("basic-backpack", 1);
  inv.tryInsert(stack);
  // tryInsert clones — locate actual inventory stack
  const live = inv.getSlot(0).stack;
  assert.ok(live);
  assert.equal(sys.equipFromInventory(0, live).accepted, true);
  assert.equal(inv.getSlot(0).stack, null);
  assert.equal(bag.current, live, "equip moves concrete ItemStack (no clone into slot)");
  assert.equal(inv.slotCount, 15);
  for (let i = 10; i <= 14; i += 1) assert.equal(inv.getSlot(i).stack, null);
}

// ——— insertion into backpack region ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.tryInsert(createItemStack("basic-backpack", 1));
  assert.equal(sys.equipFromInventory(0).accepted, true);
  for (let i = 0; i < 10; i += 1) {
    assert.equal(inv.tryInsert(createItemStack("pine-log", 20)).accepted, true);
  }
  assert.equal(inv.emptySlotCount, 5);
  assert.equal(inv.tryInsert(createItemStack("limestone", 1)).accepted, true);
  assert.equal(inv.getSlot(10).stack?.itemId, "limestone");
  // Non-stackable tools ensure ascending empty-slot placement (not merge)
  assert.equal(inv.tryInsert(createItemStack("hatchet", 1)).accepted, true);
  assert.equal(inv.getSlot(11).stack?.itemId, "hatchet");
  assert.equal(inv.tryInsert(createItemStack("pickaxe", 1)).accepted, true);
  assert.equal(inv.getSlot(12).stack?.itemId, "pickaxe");
  assert.equal(inv.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(inv.getSlot(13).stack?.itemId, "spear");
  assert.equal(inv.tryInsert(createItemStack("dad-hat", 1)).accepted, true);
  assert.equal(inv.getSlot(14).stack?.itemId, "dad-hat");
  assert.equal(inv.tryInsert(createItemStack("shirt", 1)).accepted, false);
}

// ——— unequip empty ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.tryInsert(createItemStack("basic-backpack", 1));
  const live = inv.getSlot(0).stack;
  assert.equal(sys.equipFromInventory(0, live).accepted, true);
  const result = sys.unequipToInventory(live);
  assert.equal(result.accepted, true);
  assert.equal(bag.isEmpty, true);
  assert.equal(inv.slotCount, 10);
  assert.throws(() => inv.getSlot(10), RangeError);
  assert.equal(inv.totalQuantity("basic-backpack"), 1);
}

// ——— unequip occupied reject ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  assert.equal(sys.equipFromInventory(0).accepted, true);
  assert.equal(inv.slotCount, 15);
  inv.placeIntoEmptySlot(10, createItemStack("pine-log", 3));
  assert.equal(inv.getSlot(10).stack?.quantity, 3);
  const equipped = bag.current;
  const result = sys.unequipToInventory(equipped);
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "backpack-not-empty");
  assert.equal(bag.current, equipped);
  assert.equal(inv.slotCount, 15);
  assert.equal(inv.getSlot(10).stack?.quantity, 3);
}

// ——— swap empty storage ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  const a = createItemStack("basic-backpack", 1);
  const b = createItemStack("basic-backpack", 1);
  inv.placeIntoEmptySlot(0, a); // identity placement
  // place second into slot 4
  inv.placeIntoEmptySlot(4, b);
  assert.equal(sys.equipFromInventory(0, a).accepted, true);
  assert.equal(bag.current, a);
  assert.equal(sys.equipFromInventory(4, b).accepted, true);
  assert.equal(bag.current, b, "B equipped");
  assert.equal(inv.getSlot(4).stack, a, "A returns to former B pocket");
  assert.equal(inv.slotCount, 15);
}

// ——— swap with content reject ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  inv.placeIntoEmptySlot(4, createItemStack("basic-backpack", 1));
  assert.equal(sys.equipFromInventory(0).accepted, true);
  inv.tryInsert(createItemStack("pine-log", 1)); // goes to slot 0 then after full pockets to backpack
  // fill pockets so pine lands in backpack region more reliably:
  // After equip, slot 0 is empty - pine goes to 0. Put pine manually on 10:
  inv.placeIntoEmptySlot(10, createItemStack("pine-log", 1));
  const a = bag.current;
  const b = inv.getSlot(4).stack;
  assert.equal(sys.equipFromInventory(4, b).accepted, false);
  assert.equal(sys.lastResult?.reason, "backpack-not-empty");
  assert.equal(bag.current, a);
  assert.equal(inv.getSlot(4).stack, b);
  assert.equal(inv.getSlot(10).stack?.itemId, "pine-log");
}

// ——— incoming backpack from backpack storage rejected ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  assert.equal(sys.equipFromInventory(0).accepted, true);
  inv.placeIntoEmptySlot(11, createItemStack("basic-backpack", 1));
  // must empty storage first to even attempt - but rule is source must be pocket;
  // leaving content in 11 for equip attempt of that stack:
  const inner = inv.getSlot(11).stack;
  assert.equal(sys.equipFromInventory(11, inner).accepted, false);
  assert.equal(sys.lastResult?.reason, "source-in-backpack-storage");
  // also when storage empty after moving? place bag only after clearing - put bag in 11 after emptying:
  // Currently backpack-not-empty also applies if we only had empty check before source check
  // Clear storage (remove 11 bag): exchange out is complex — instead clear by moving:
  inv.exchangeWholeStack(11, inner, null);
  inv.placeIntoEmptySlot(3, createItemStack("basic-backpack", 1));
  inv.rearrangeSlots(3, 11);
  const fromStorage = inv.getSlot(11).stack;
  assert.ok(fromStorage);
  assert.equal(sys.equipFromInventory(11, fromStorage).accepted, false);
  assert.equal(sys.lastResult?.reason, "source-in-backpack-storage");
  assert.ok(bag.current);
  assert.equal(inv.getSlot(11).stack, fromStorage);
}

// ——— ground pickup ———
{
  const inv = new PlayerInventory();
  const ground = new GroundLootSystem({ addInteractable() {}, removeInteractable() {} }, { spawn() {}, collect() {}, update: () => [], remove() {} });
  spawnStarterBasicBackpack(ground);
  assert.equal(ground.activeCount, 1);
  assert.equal(ground.active[0].stack.itemId, "basic-backpack");
  assert.equal(ground.active[0].stack.quantity, 1);
  assert.equal(STARTER_BASIC_BACKPACK.x, 1.6);
  assert.equal(STARTER_BASIC_BACKPACK.z, 4.2);
  const interaction = { target: null, clearTarget: () => {} };
  const pickup = new PickupSystem(ground, /** @type {any} */ (interaction), inv, new TemporaryPickupResultSink(), { handleInventoryFull() {} });
  const entity = ground.active[0];
  assert.equal(pickup.tryPickup(entity, { x: STARTER_BASIC_BACKPACK.x, y: 0, z: STARTER_BASIC_BACKPACK.z }), true);
  assert.equal(ground.activeCount, 0);
  assert.equal(inv.totalQuantity("basic-backpack"), 1);
  spawnStarterBasicBackpack(ground);
  assert.equal(ground.activeCount, 1);
}

// full pockets reject ground pack
{
  const inv = new PlayerInventory();
  for (let i = 0; i < 10; i += 1) {
    assert.equal(inv.placeIntoEmptySlot(i, createItemStack("pine-log", 20)), true);
  }
  assert.equal(inv.occupiedSlotCount, 10);
  assert.equal(inv.canInsert(createItemStack("basic-backpack", 1)), false);
  const ground = new GroundLootSystem({ addInteractable() {}, removeInteractable() {} }, { spawn() {}, collect() {}, update: () => [], remove() {} });
  spawnStarterBasicBackpack(ground);
  const interaction = { target: null, clearTarget: () => {} };
  const pickup = new PickupSystem(ground, /** @type {any} */ (interaction), inv, new TemporaryPickupResultSink(), { handleInventoryFull() {} });
  const entity = ground.active[0];
  assert.equal(pickup.tryPickup(entity, { x: 0, y: 0, z: 0 }), false);
  assert.equal(ground.activeCount, 1);
}

// ——— harvest capacity into backpack ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const sys = new BackpackEquipSystem(inv, bag);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  sys.equipFromInventory(0);
  for (let i = 0; i < 10; i += 1) inv.tryInsert(createItemStack("limestone", 20));
  const delivery = new HarvestRewardDelivery(inv);
  const result = createItemResult("tree-test", "pine-log", 3);
  delivery.handle(result, Object.freeze({ x: 0, y: 0, z: 0 }));
  assert.equal(inv.getSlot(10).stack?.itemId, "pine-log");
  assert.ok((inv.getSlot(10).stack?.quantity ?? 0) >= 1);
}

// ——— armor unequip into backpack ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const backpack = new BackpackEquipSystem(inv, bag);
  const equipment = new PlayerEquipment();
  const eq = new EquipmentSystem(inv, equipment);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  backpack.equipFromInventory(0);
  inv.placeIntoEmptySlot(0, createItemStack("dad-hat", 1));
  eq.equipFromInventory(0);
  for (let i = 0; i < 10; i += 1) {
    if (!inv.getSlot(i).stack) inv.tryInsert(createItemStack("pine-log", 1));
  }
  // ensure pockets full
  while (inv.occupiedSlotCount < 10) inv.tryInsert(createItemStack("pine-log", 1));
  // slot 10 empty
  for (let i = 0; i < 10; i += 1) assert.ok(inv.getSlot(i).stack);
  assert.equal(eq.unequipToInventory("head").accepted, true);
  assert.equal(inv.getSlot(10).stack?.itemId, "dad-hat");
}

// ——— weapon unequip into backpack ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const backpack = new BackpackEquipSystem(inv, bag);
  const weaponSlot = new PlayerWeaponSlot();
  const weapon = new WeaponEquipSystem(inv, weaponSlot);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  backpack.equipFromInventory(0);
  inv.placeIntoEmptySlot(0, createItemStack("spear", 1));
  weapon.equipFromInventory(0);
  for (let i = 0; i < 10; i += 1) {
    if (!inv.getSlot(i).stack) inv.tryInsert(createItemStack("pine-log", 1));
  }
  while (inv.getSlots().filter((s) => s.index < 10 && s.stack).length < 10) {
    inv.tryInsert(createItemStack("pine-log", 1));
  }
  assert.equal(weapon.unequipToInventory().accepted, true);
  assert.equal(weaponSlot.isEmpty, true);
  assert.equal(inv.getSlot(10).stack?.itemId, "spear");
}

// ——— craft capacity ———
{
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const backpack = new BackpackEquipSystem(inv, bag);
  inv.placeIntoEmptySlot(0, createItemStack("basic-backpack", 1));
  backpack.equipFromInventory(0);
  // Fill base pockets, leave backpack free; give craft materials that free slots? craft needs consume + insert
  // Hatchet recipe: check registry
  const craft = new CraftingSystem(inv);
  const recipes = CRAFTING_RECIPES.getAll();
  assert.equal(recipes.length, 3);
  // Ensure full base + one backpack free and enough mats: simpler check — with capacity 15 canInsert more
  for (let i = 0; i < 10; i += 1) {
    if (!inv.getSlot(i).stack) inv.tryInsert(createItemStack("limestone", 1));
  }
  while (inv.occupiedSlotCount < 10) inv.tryInsert(createItemStack("limestone", 1));
  assert.equal(inv.canInsert(createItemStack("pine-log", 1)), true, "backpack capacity available for craft output");
  assert.equal(inv.previewConsumeAndInsert([], createItemStack("pine-log", 1)).accepted, true);
}

// ——— stats unchanged ———
{
  const weaponSlot = new PlayerWeaponSlot();
  const equipment = new PlayerEquipment();
  const inv = new PlayerInventory();
  const bag = new PlayerBackpackSlot();
  const eq = new EquipmentSystem(inv, equipment);
  const wep = new WeaponEquipSystem(inv, weaponSlot);
  const bp = new BackpackEquipSystem(inv, bag);
  inv.tryInsert(createItemStack("dad-hat", 1));
  inv.tryInsert(createItemStack("shirt", 1));
  inv.tryInsert(createItemStack("cargo-pants", 1));
  inv.tryInsert(createItemStack("sneakers", 1));
  inv.tryInsert(createItemStack("spear", 1));
  inv.tryInsert(createItemStack("basic-backpack", 1));
  for (const i of [0, 1, 2, 3]) eq.equipFromInventory(i);
  wep.equipFromInventory(4);
  const beforeArmor = equipment.totalArmor;
  const beforeMelee = resolvePlayerMeleeProfile(weaponSlot);
  bp.equipFromInventory(5);
  assert.equal(equipment.totalArmor, beforeArmor);
  assert.equal(beforeArmor, 8);
  const afterMelee = resolvePlayerMeleeProfile(weaponSlot);
  assert.equal(afterMelee.damage, beforeMelee.damage);
  assert.equal(afterMelee.attacksPerSecond, beforeMelee.attacksPerSecond);
  assert.equal(afterMelee.damage, 10);
  assert.equal(afterMelee.attacksPerSecond, 1.0);
}

// architecture smoke
const domainSource = await readFile(new URL("../src/equipment/PlayerBackpackSlot.ts", import.meta.url), "utf8");
assert.equal(domainSource.includes("PlayerEquipment"), false);
const panelSource = await readFile(new URL("../src/ui/InventoryPanel.ts", import.meta.url), "utf8");
assert.equal(panelSource.includes("EMPTY BACKPACK FIRST"), true);
assert.equal(panelSource.includes("BackpackEquipSystem"), true);

console.log("verifyBackpack: ok");
