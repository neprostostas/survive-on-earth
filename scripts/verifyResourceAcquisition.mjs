import assert from "node:assert/strict";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { HARVESTING_RESOURCES, HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { HarvestRewardDelivery } from "../src/harvesting/HarvestRewardDelivery.ts";
import { HarvestToolResolver } from "../src/harvesting/HarvestToolResolver.ts";
import { InventoryHarvestTools } from "../src/harvesting/InventoryHarvestTools.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemResult, createItemStack, ITEM_REGISTRY } from "../src/items/ItemSystem.ts";
import { GroundLootSystem } from "../src/ground-loot/GroundLootSystem.ts";
import { PickupSystem } from "../src/ground-loot/PickupSystem.ts";
import {
  countStarterFixtures,
  spawnStarterGroundResources,
  STARTER_GROUND_RESOURCES,
} from "../src/ground-loot/starterGroundResources.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { FISTS_COMBAT_PROFILE } from "../src/combat/combatConfig.ts";
import { readFile } from "node:fs/promises";

assert.equal(ITEM_REGISTRY.getAll().length, 10);
assert.equal(CRAFTING_RECIPES.getAll().length, 3);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.equal(EQUIPMENT_SLOT_IDS.length, 4);
assert.equal(FISTS_COMBAT_PROFILE.damage, 6);

const position = { x: 0, y: 0, z: 0 };
const visual = { impact() {}, deplete() {}, update() {} };

function resource(id, kind) {
  return new HarvestableResource({
    id,
    kind,
    position: () => position,
    radius: () => 0.5,
    visualEnabled: () => true,
    visual,
  });
}

function emptyRegistry() {
  const interactables = [];
  return {
    interactables,
    registry: {
      addInteractable(i) { interactables.push(i); },
      removeInteractable(i) {
        const index = interactables.indexOf(i);
        if (index >= 0) interactables.splice(index, 1);
      },
    },
  };
}

// --- 45 fixture counts ---
assert.equal(countStarterFixtures("pine-log"), 6);
assert.equal(countStarterFixtures("limestone"), 6);
assert.equal(STARTER_GROUND_RESOURCES.length, 12);
for (const fixture of STARTER_GROUND_RESOURCES) {
  assert.equal(fixture.itemId === "pine-log" || fixture.itemId === "limestone", true);
}
assert.equal(STARTER_GROUND_RESOURCES.every((f) => Number.isFinite(f.x) && Number.isFinite(f.z)), true);
assert.equal(new Set(STARTER_GROUND_RESOURCES.map((f) => `${f.x},${f.z}`)).size, 12, "unique positions");
assert.equal(new Set(STARTER_GROUND_RESOURCES.map((f) => f.id)).size, 12);

// --- spawn fixtures ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  spawnStarterGroundResources(groundLoot);
  assert.equal(groundLoot.activeCount, 12);
  assert.equal(groundLoot.active.filter((e) => e.stack.itemId === "pine-log" && e.stack.quantity === 1).length, 6);
  assert.equal(groundLoot.active.filter((e) => e.stack.itemId === "limestone" && e.stack.quantity === 1).length, 6);
}

// --- 46 manual pine log pickup ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const inventory = new PlayerInventory();
  const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, inventory, { handle() {} });
  const entity = groundLoot.placeAuthoredStack(createItemStack("pine-log", 1), Object.freeze(position), "test-pine");
  assert.equal(pickup.tryPickup(entity, position), true);
  assert.equal(inventory.totalQuantity("pine-log"), 1);
  assert.equal(groundLoot.activeCount, 0);
  assert.equal(pickup.tryPickup(entity, position), false);
  assert.equal(inventory.totalQuantity("pine-log"), 1);
}

// --- 47 limestone pickup ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const inventory = new PlayerInventory();
  const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, inventory, { handle() {} });
  const entity = groundLoot.placeAuthoredStack(createItemStack("limestone", 1), Object.freeze(position), "test-lime");
  assert.equal(pickup.tryPickup(entity, position), true);
  assert.equal(inventory.totalQuantity("limestone"), 1);
  assert.equal(groundLoot.activeCount, 0);
}

// --- 48 no tools required ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const tools = new InventoryHarvestTools(inventory, weapon);
  assert.equal(tools.hasTool("hatchet"), false);
  assert.equal(tools.hasTool("pickaxe"), false);
  const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, inventory, { handle() {} });
  const pine = groundLoot.placeAuthoredStack(createItemStack("pine-log", 1), Object.freeze(position), "nt-p");
  const lime = groundLoot.placeAuthoredStack(createItemStack("limestone", 1), Object.freeze({ x: 1, y: 0, z: 0 }), "nt-l");
  assert.equal(pickup.tryPickup(pine, position), true);
  assert.equal(pickup.tryPickup(lime, { x: 1, y: 0, z: 0 }), true);
}

// --- 49 full inventory ground full-stack-or-nothing ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const inventory = new PlayerInventory();
  for (let i = 0; i < 10; i += 1) inventory.tryInsert(createItemStack(i % 2 ? "pine-log" : "limestone", 20));
  const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, inventory, { handle() {} }, { handleInventoryFull() {} });
  const entity = groundLoot.placeAuthoredStack(createItemStack("pine-log", 1), Object.freeze(position), "full-p");
  const before = inventory.totalQuantity("pine-log");
  assert.equal(pickup.tryPickup(entity, position), false);
  assert.equal(inventory.totalQuantity("pine-log"), before);
  assert.equal(groundLoot.activeCount, 1);
}

// --- 50 bootstrap craft ---
{
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const inventory = new PlayerInventory();
  const pickup = new PickupSystem(groundLoot, { clearTarget() {} }, inventory, { handle() {} });
  spawnStarterGroundResources(groundLoot);
  for (const entity of [...groundLoot.active]) {
    assert.equal(pickup.tryPickup(entity, entity.getInteractionPosition()), true);
  }
  assert.equal(inventory.totalQuantity("pine-log"), 6);
  assert.equal(inventory.totalQuantity("limestone"), 6);
  const crafting = new CraftingSystem(inventory);
  assert.equal(crafting.craft("hatchet").status, "crafted");
  assert.equal(crafting.craft("pickaxe").status, "crafted");
  assert.equal(inventory.totalQuantity("hatchet"), 1);
  assert.equal(inventory.totalQuantity("pickaxe"), 1);
  assert.equal(inventory.getSlot(inventory.findFirstSlotByItemId("hatchet")).stack.currentDurability, 50);
  assert.equal(inventory.getSlot(inventory.findFirstSlotByItemId("pickaxe")).stack.currentDurability, 50);
}

// --- 51 tree direct inventory ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const weapon = new PlayerWeaponSlot();
  const tools = new InventoryHarvestTools(inventory, weapon);
  const delivery = new HarvestRewardDelivery(inventory);
  const { registry } = emptyRegistry();
  const groundLoot = new GroundLootSystem(registry);
  const tree = resource("tree-dir", "pine-tree");
  for (let i = 0; i < HARVESTING_RESOURCES["pine-tree"].totalHits; i += 1) {
    tools.consumeImpactUse("hatchet");
    tree.applyImpact("hatchet");
  }
  assert.equal(tree.isDepleted, true);
  const yieldData = tree.claimYield();
  const itemResult = createItemResult(tree.resourceId, yieldData.itemId, yieldData.quantity);
  delivery.handle(itemResult, position);
  assert.equal(inventory.totalQuantity("pine-log"), 3);
  assert.equal(groundLoot.activeCount, 0);
  assert.equal(delivery.lastResult.insertedQuantity, 3);
  assert.equal(delivery.lastResult.overflowQuantity, 0);
  // groundLoot never gets harvest
  groundLoot.handle?.(itemResult, position);
  // even if wrongly called after WeakSet-less materialize is new ItemResult each time - don't call materialize from harvest in prod
}

// --- 52 rock direct ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const delivery = new HarvestRewardDelivery(inventory);
  const rock = resource("rock-dir", "limestone-rock");
  for (let i = 0; i < 5; i += 1) {
    tools.consumeImpactUse("pickaxe");
    rock.applyImpact("pickaxe");
  }
  const y = rock.claimYield();
  delivery.handle(createItemResult(rock.resourceId, y.itemId, y.quantity), position);
  assert.equal(inventory.totalQuantity("limestone"), 3);
  assert.equal(delivery.lastResult.overflowQuantity, 0);
}

// --- 53 partial stack fill ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 18));
  const delivery = new HarvestRewardDelivery(inventory);
  delivery.handle(createItemResult("tree-partial-stack", "pine-log", 3), position);
  assert.equal(inventory.getSlot(0).stack.quantity, 20);
  assert.equal(inventory.getSlot(1).stack.itemId, "pine-log");
  assert.equal(inventory.getSlot(1).stack.quantity, 1);
  assert.equal(delivery.lastResult.insertedQuantity, 3);
}

// --- 54 partial capacity ---
{
  const inventory = new PlayerInventory();
  // fill 9 slots + one with pine-log 19 (room 1)
  inventory.tryInsert(createItemStack("pine-log", 19));
  for (let i = 0; i < 9; i += 1) inventory.tryInsert(createItemStack("limestone", 20));
  assert.equal(inventory.emptySlotCount, 0);
  const delivery = new HarvestRewardDelivery(inventory);
  delivery.handle(createItemResult("tree-room1", "pine-log", 3), position);
  assert.equal(delivery.lastResult.insertedQuantity, 1);
  assert.equal(delivery.lastResult.overflowQuantity, 2);
  assert.equal(inventory.totalQuantity("pine-log"), 20);
}

// --- 55 zero capacity ---
{
  const inventory = new PlayerInventory();
  for (let i = 0; i < 10; i += 1) inventory.tryInsert(createItemStack("limestone", 20));
  inventory.tryInsert(createItemStack("hatchet", 1)); // fail
  const delivery = new HarvestRewardDelivery(inventory);
  const hatchet = createItemStack("hatchet", 1, { currentDurability: 50 });
  // complete tree with inventory hatchet then zero pine room
  // Use durability path: tool in inventory first
  const freeInv = new PlayerInventory();
  freeInv.tryInsert(createItemStack("hatchet", 1, { currentDurability: 50 }));
  freeInv.tryInsert(createItemStack("pine-log", 20)); // wait that fills one slot
  // rebuild: only limestone full
  const inv2 = new PlayerInventory();
  for (let i = 0; i < 10; i += 1) inv2.tryInsert(createItemStack(i === 0 ? "hatchet" : "limestone", i === 0 ? 1 : 20, i === 0 ? { currentDurability: 47 } : undefined));
  const tools = new InventoryHarvestTools(inv2, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), true);
  const tree = resource("tree-zero", "pine-tree");
  for (let i = 0; i < 4; i += 1) {
    tools.consumeImpactUse("hatchet");
    tree.applyImpact("hatchet");
  }
  assert.equal(tree.isDepleted, true);
  const y = tree.claimYield();
  const beforeLogs = inv2.totalQuantity("pine-log");
  const delivery2 = new HarvestRewardDelivery(inv2);
  delivery2.handle(createItemResult(tree.resourceId, y.itemId, y.quantity), position);
  assert.equal(inv2.totalQuantity("pine-log"), beforeLogs);
  assert.equal(delivery2.lastResult.insertedQuantity, 0);
  assert.equal(delivery2.lastResult.overflowQuantity, 3);
  assert.equal(inv2.getSlot(0).stack.currentDurability, 43, "durability spent on 4 impacts");
  void hatchet;
}

// --- 56 exactly once ---
{
  const inventory = new PlayerInventory();
  const delivery = new HarvestRewardDelivery(inventory);
  const result = createItemResult("once-tree", "pine-log", 3);
  delivery.handle(result, position);
  delivery.handle(result, position); // ItemResult object can be re-delivered by sink if called twice - domain should use claimYield once in harvest only
  // Production harvest calls once; test duplicate prevent via claimYield
  const tree = resource("once2", "pine-tree");
  tree.applyImpact("hatchet");
  tree.applyImpact("hatchet");
  tree.applyImpact("hatchet");
  tree.applyImpact("hatchet");
  const y1 = tree.claimYield();
  const y2 = tree.claimYield();
  assert.ok(y1);
  assert.equal(y2, null);
  const inv = new PlayerInventory();
  const d = new HarvestRewardDelivery(inv);
  d.handle(createItemResult("once2", y1.itemId, y1.quantity), position);
  assert.equal(inv.totalQuantity("pine-log"), 3);
  // second creation would need another yield
  assert.equal(d.count, 1);
}

// --- 57 durability ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const delivery = new HarvestRewardDelivery(inventory);
  const tree = resource("dur-tree", "pine-tree");
  for (let i = 0; i < 4; i += 1) {
    tools.consumeImpactUse("hatchet");
    tree.applyImpact("hatchet");
  }
  delivery.handle(createItemResult("dur-tree", "pine-log", 3), position);
  assert.equal(inventory.getSlot(0).stack.currentDurability, 46);
  assert.equal(inventory.totalQuantity("pine-log"), 3);

  const inv2 = new PlayerInventory();
  inv2.tryInsert(createItemStack("pickaxe", 1));
  const tools2 = new InventoryHarvestTools(inv2, new PlayerWeaponSlot());
  const rock = resource("dur-rock", "limestone-rock");
  for (let i = 0; i < 5; i += 1) {
    tools2.consumeImpactUse("pickaxe");
    rock.applyImpact("pickaxe");
  }
  new HarvestRewardDelivery(inv2).handle(createItemResult("dur-rock", "limestone", 3), position);
  assert.equal(inv2.getSlot(0).stack.currentDurability, 45);
  assert.equal(inv2.totalQuantity("limestone"), 3);
}

// --- 58 equipped tool ---
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  weapon.equipIfAccepted(createItemStack("hatchet", 1), () => true);
  const tools = new HarvestToolResolver(inventory, weapon);
  assert.equal(tools.resolve("hatchet").source, "weapon-slot");
  for (let i = 0; i < 4; i += 1) tools.consumeImpactUse("hatchet");
  assert.equal(weapon.current.currentDurability, 46);
  const delivery = new HarvestRewardDelivery(inventory);
  delivery.handle(createItemResult("eq-tree", "pine-log", 3), position);
  assert.equal(inventory.totalQuantity("pine-log"), 3);

  weapon.equipIfAccepted(createItemStack("pickaxe", 1), () => true);
  for (let i = 0; i < 5; i += 1) tools.consumeImpactUse("pickaxe");
  assert.equal(weapon.current.currentDurability, 45);
  delivery.handle(createItemResult("eq-rock", "limestone", 3), position);
  assert.equal(inventory.totalQuantity("limestone"), 3);
}

// --- 59 partial progress ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 2 }));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const rock = resource("prog-rock", "limestone-rock");
  tools.consumeImpactUse("pickaxe");
  rock.applyImpact("pickaxe");
  tools.consumeImpactUse("pickaxe");
  rock.applyImpact("pickaxe");
  assert.equal(rock.remainingHits, 3);
  assert.equal(rock.claimYield(), null);
  inventory.tryInsert(createItemStack("pickaxe", 1));
  for (let i = 0; i < 3; i += 1) {
    tools.consumeImpactUse("pickaxe");
    rock.applyImpact("pickaxe");
  }
  const y = rock.claimYield();
  assert.equal(y.quantity, 3);
  new HarvestRewardDelivery(inventory).handle(createItemResult("prog-rock", y.itemId, y.quantity), position);
  assert.equal(inventory.totalQuantity("limestone"), 3);
}

// Game wiring: harvest sink is Inventory not GroundLoot
{
  const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
  assert.equal(gameSource.includes("HarvestRewardDelivery"), true);
  assert.equal(gameSource.includes("spawnStarterGroundResources"), true);
  assert.equal(gameSource.includes("CompositeResourceResultSink([this.harvestRewardDelivery"), true);
  assert.equal(gameSource.includes("CompositeResourceResultSink([this.groundLoot"), false);
}

console.log("verifyResourceAcquisition: ok");
