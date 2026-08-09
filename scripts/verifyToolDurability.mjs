import assert from "node:assert/strict";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { HARVESTING_RESOURCES, HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { InventoryHarvestTools } from "../src/harvesting/InventoryHarvestTools.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { HarvestingSession } from "../src/harvesting/HarvestingSession.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import {
  ITEM_REGISTRY,
  createItemStack,
  mergeItemStacks,
  stackDurability,
} from "../src/items/ItemSystem.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { FISTS_COMBAT_PROFILE } from "../src/combat/combatConfig.ts";

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

function durabilityAt(inventory, index) {
  const stack = inventory.getSlot(index).stack;
  return stack ? stackDurability(stack) : null;
}

/** Production impact rule used by HarvestingSystem: tool use then resource hit. */
function successfulHarvestImpact(tools, target) {
  assert.equal(tools.hasTool(target.requiredTool), true);
  const spent = tools.consumeImpactUse(target.requiredTool);
  assert.ok(spent);
  assert.equal(spent.accepted, true);
  const hit = target.applyImpact(target.requiredTool);
  assert.equal(hit.accepted, true);
  return { spent, hit };
}

// --- A. Metadata ---
assert.equal(ITEM_REGISTRY.get("hatchet").maxDurability, 50);
assert.equal(ITEM_REGISTRY.get("pickaxe").maxDurability, 50);
assert.equal(ITEM_REGISTRY.get("pine-log").maxDurability, undefined);
assert.equal(ITEM_REGISTRY.get("limestone").maxDurability, undefined);
assert.equal(ITEM_REGISTRY.get("dad-hat").maxDurability, undefined);

// --- B. Fresh state ---
assert.deepEqual(createItemStack("hatchet", 1), { itemId: "hatchet", quantity: 1, currentDurability: 50 });
assert.deepEqual(createItemStack("pickaxe", 1), { itemId: "pickaxe", quantity: 1, currentDurability: 50 });

// --- C. One use ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const spent = tools.consumeImpactUse("hatchet");
  assert.equal(spent.accepted, true);
  assert.equal(spent.before, 50);
  assert.equal(spent.after, 49);
  assert.equal(spent.broke, false);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 49, max: 50 });
}

// --- D. No negative / last use removes ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 1 }));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const spent = tools.consumeImpactUse("hatchet");
  assert.equal(spent.accepted, true);
  assert.equal(spent.before, 1);
  assert.equal(spent.after, 0);
  assert.equal(spent.broke, true);
  assert.equal(inventory.getSlot(0).stack, null);
  assert.equal(inventory.totalQuantity("hatchet"), 0);
  assert.equal(tools.hasTool("hatchet"), false);
}

// --- E. Read-only max ---
{
  const before = ITEM_REGISTRY.get("hatchet").maxDurability;
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  new InventoryHarvestTools(inventory, new PlayerWeaponSlot()).consumeImpactUse("hatchet");
  assert.equal(ITEM_REGISTRY.get("hatchet").maxDurability, before);
  assert.equal(ITEM_REGISTRY.get("hatchet").maxDurability, 50);
}

// --- Integration A. Hatchet tree ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-dur", "pine-tree");
  for (let i = 0; i < 4; i += 1) successfulHarvestImpact(tools, tree);
  assert.equal(tree.isDepleted, true);
  assert.deepEqual(tree.claimYield(), { itemId: "pine-log", quantity: 3 });
  assert.deepEqual(durabilityAt(inventory, 0), { current: 46, max: 50 });
  assert.equal(inventory.totalQuantity("hatchet"), 1);
}

// --- Integration B. Pickaxe rock ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const rock = resource("rock-dur", "limestone-rock");
  for (let i = 0; i < 5; i += 1) successfulHarvestImpact(tools, rock);
  assert.equal(rock.isDepleted, true);
  assert.deepEqual(rock.claimYield(), { itemId: "limestone", quantity: 3 });
  assert.deepEqual(durabilityAt(inventory, 0), { current: 45, max: 50 });
}

// --- Integration C. No hatchet ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-no", "pine-tree");
  assert.equal(tools.hasTool("hatchet"), false);
  assert.equal(tree.applyImpact(tools.hasTool("hatchet") ? "hatchet" : null).accepted, false);
  assert.equal(tree.remainingHits, 4);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 50, max: 50 });
  assert.equal(tools.consumeImpactUse("hatchet"), null);
}

// --- Integration D. Wrong tool ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-wrong", "pine-tree");
  assert.equal(tree.applyImpact("pickaxe").accepted, false);
  assert.equal(tree.remainingHits, 4);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 50, max: 50 }, "wrong tool must not spend pickaxe");

  const inventory2 = new PlayerInventory();
  inventory2.tryInsert(createItemStack("hatchet", 1));
  const tools2 = new InventoryHarvestTools(inventory2, new PlayerWeaponSlot());
  const rock = resource("rock-wrong", "limestone-rock");
  assert.equal(rock.applyImpact("hatchet").accepted, false);
  assert.equal(rock.remainingHits, 5);
  assert.deepEqual(durabilityAt(inventory2, 0), { current: 50, max: 50 });
}

// --- Integration E. Last-point tree completion ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 1 }));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-last", "pine-tree");
  tree.applyImpact("hatchet");
  tree.applyImpact("hatchet");
  tree.applyImpact("hatchet");
  assert.equal(tree.remainingHits, 1);
  successfulHarvestImpact(tools, tree);
  assert.equal(tree.isDepleted, true);
  assert.deepEqual(tree.claimYield(), { itemId: "pine-log", quantity: 3 });
  assert.equal(inventory.getSlot(0).stack, null);
  assert.equal(tools.hasTool("hatchet"), false);
}

// --- Integration F. Break mid-resource ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 2 }));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const rock = resource("rock-mid", "limestone-rock");
  successfulHarvestImpact(tools, rock);
  successfulHarvestImpact(tools, rock);
  assert.equal(inventory.totalQuantity("pickaxe"), 0);
  assert.equal(rock.remainingHits, 3); // 5-2 = 3 remaining → progress 2/5
  assert.equal(tools.hasTool("pickaxe"), false);
  assert.equal(rock.applyImpact(tools.hasTool("pickaxe") ? "pickaxe" : null).accepted, false);
  assert.equal(rock.remainingHits, 3);

  inventory.tryInsert(createItemStack("pickaxe", 1));
  assert.equal(tools.hasTool("pickaxe"), true);
  for (let i = 0; i < 3; i += 1) successfulHarvestImpact(tools, rock);
  assert.equal(rock.isDepleted, true);
  assert.deepEqual(rock.claimYield(), { itemId: "limestone", quantity: 3 });
  assert.deepEqual(durabilityAt(inventory, 0), { current: 47, max: 50 });
}

// --- Integration G. Multiple same tools ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 20)); // 0 full — blocked merge
  inventory.tryInsert(createItemStack("limestone", 20)); // 1 full
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 1 })); // 2
  inventory.tryInsert(createItemStack("dad-hat", 1)); // 3
  inventory.tryInsert(createItemStack("shirt", 1)); // 4
  inventory.tryInsert(createItemStack("cargo-pants", 1)); // 5
  inventory.tryInsert(createItemStack("sneakers", 1)); // 6
  inventory.tryInsert(createItemStack("hatchet", 1)); // 7 full
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.findToolSlot("hatchet"), 2);

  const tree = resource("tree-multi", "pine-tree");
  successfulHarvestImpact(tools, tree);
  assert.equal(inventory.getSlot(2).stack, null);
  assert.deepEqual(durabilityAt(inventory, 7), { current: 50, max: 50 }, "second tool untouched on first impact");
  assert.equal(tools.findToolSlot("hatchet"), 7);

  successfulHarvestImpact(tools, tree);
  assert.deepEqual(durabilityAt(inventory, 7), { current: 49, max: 50 });
  assert.equal(inventory.getSlot(2).stack, null);
}

// --- Integration H/I. Craft fresh tools ---
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 3));
  inventory.tryInsert(createItemStack("limestone", 3));
  assert.equal(new CraftingSystem(inventory).craft("hatchet").accepted, true);
  assert.deepEqual(stackDurability(inventory.getSlot(0).stack), { current: 50, max: 50 });
}
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 3));
  inventory.tryInsert(createItemStack("limestone", 3));
  assert.equal(new CraftingSystem(inventory).craft("pickaxe").accepted, true);
  const slot = inventory.findFirstSlotByItemId("pickaxe");
  assert.notEqual(slot, null);
  assert.deepEqual(stackDurability(inventory.getSlot(slot).stack), { current: 50, max: 50 });
}

// --- Integration J. Resources unaffected ---
{
  const log = createItemStack("pine-log", 5);
  const lime = createItemStack("limestone", 8);
  assert.equal(log.currentDurability, undefined);
  assert.equal(lime.currentDurability, undefined);
  assert.equal(stackDurability(log), null);
  assert.equal(stackDurability(lime), null);
}

// Cancel before impact — session only, no inventory mutation
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-cancel", "pine-tree");
  const session = new HarvestingSession();
  const timing = { duration: 1, impactNormalizedTime: 0.5 };
  session.begin(tree, true);
  const event = session.update(0.1, timing, true, true, true, 0.4, 0.18, tools.hasTool("hatchet"));
  assert.equal(event.impact, false);
  assert.equal(event.cancelled, true);
  assert.equal(tree.remainingHits, 4);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 50, max: 50 });
}

// Actual impact timing in session + one durability
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-impact", "pine-tree");
  const session = new HarvestingSession();
  const timing = { duration: 1, impactNormalizedTime: 0.5 };
  session.begin(tree, true);
  const pre = session.update(0.4, timing, true, true, true, 0, 0.18, true);
  assert.equal(pre.impact, false);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 50, max: 50 });
  const atImpact = session.update(0.1, timing, true, true, true, 0, 0.18, true);
  assert.equal(atImpact.impact, true);
  successfulHarvestImpact(tools, tree);
  assert.equal(tree.remainingHits, 3);
  assert.deepEqual(durabilityAt(inventory, 0), { current: 49, max: 50 });
}

// Merge durable tools forbidden; insert preserves instance durability
{
  assert.throws(() => mergeItemStacks(createItemStack("hatchet", 1), createItemStack("hatchet", 1)));
  const inventory = new PlayerInventory();
  const worn = createItemStack("hatchet", 1, { currentDurability: 12 });
  assert.equal(inventory.tryInsert(worn).accepted, true);
  assert.deepEqual(inventory.getSlot(0).stack, { itemId: "hatchet", quantity: 1, currentDurability: 12 });
}

// Counts / boundaries
assert.equal(ITEM_REGISTRY.getAll().length, 8);
assert.equal(CRAFTING_RECIPES.getAll().length, 2);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.deepEqual([...EQUIPMENT_SLOT_IDS], ["head", "torso", "legs", "feet"]);
assert.equal(FISTS_COMBAT_PROFILE.damage, 6);
assert.equal(HARVESTING_RESOURCES["pine-tree"].totalHits, 4);
assert.equal(HARVESTING_RESOURCES["limestone-rock"].totalHits, 5);

console.log("Tool durability verification passed");
