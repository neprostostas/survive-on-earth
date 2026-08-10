import assert from "node:assert/strict";
import { access } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { HARVESTING_RESOURCES, HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { InventoryHarvestTools } from "../src/harvesting/InventoryHarvestTools.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack, ITEM_REGISTRY } from "../src/items/ItemSystem.ts";
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

// Pure resource requirements still map correctly
assert.equal(HARVESTING_RESOURCES["pine-tree"].requiredTool, "hatchet");
assert.equal(HARVESTING_RESOURCES["pine-tree"].totalHits, 4);
assert.equal(HARVESTING_RESOURCES["pine-tree"].yield.itemId, "pine-log");
assert.equal(HARVESTING_RESOURCES["pine-tree"].yield.quantity, 3);
assert.equal(HARVESTING_RESOURCES["limestone-rock"].requiredTool, "pickaxe");
assert.equal(HARVESTING_RESOURCES["limestone-rock"].totalHits, 5);
assert.equal(HARVESTING_RESOURCES["limestone-rock"].yield.itemId, "limestone");
assert.equal(HARVESTING_RESOURCES["limestone-rock"].yield.quantity, 3);

// A. Empty inventory
{
  const inventory = new PlayerInventory();
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), false);
  assert.equal(tools.hasTool("pickaxe"), false);
  assert.equal(tools.findToolSlot("hatchet"), null);
  assert.equal(tools.findToolSlot("pickaxe"), null);
  const tree = resource("tree-empty", "pine-tree");
  const rock = resource("rock-empty", "limestone-rock");
  assert.equal(tree.applyImpact(tools.hasTool("hatchet") ? "hatchet" : null).accepted, false);
  assert.equal(rock.applyImpact(tools.hasTool("pickaxe") ? "pickaxe" : null).accepted, false);
  assert.equal(tree.remainingHits, 4);
  assert.equal(rock.remainingHits, 5);
}

// B. Hatchet only
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), true);
  assert.equal(tools.hasTool("pickaxe"), false);
  assert.equal(tools.findToolSlot("hatchet"), 0);
  const tree = resource("tree-hatchet", "pine-tree");
  const rock = resource("rock-hatchet", "limestone-rock");
  assert.equal(tree.applyImpact(tools.hasTool(tree.requiredTool) ? tree.requiredTool : null).accepted, true);
  assert.equal(rock.applyImpact(tools.hasTool(rock.requiredTool) ? rock.requiredTool : null).accepted, false);
  assert.equal(rock.remainingHits, 5);
}

// C. Pickaxe only
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), false);
  assert.equal(tools.hasTool("pickaxe"), true);
  const tree = resource("tree-pick", "pine-tree");
  const rock = resource("rock-pick", "limestone-rock");
  assert.equal(tree.applyImpact(tools.hasTool(tree.requiredTool) ? tree.requiredTool : null).accepted, false);
  assert.equal(rock.applyImpact(tools.hasTool(rock.requiredTool) ? rock.requiredTool : null).accepted, true);
}

// D. Both tools
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), true);
  assert.equal(tools.hasTool("pickaxe"), true);
  assert.equal(tools.findToolSlot("hatchet"), 0);
  assert.equal(tools.findToolSlot("pickaxe"), 1);
}

// E. Lowest slot wins among multiples
{
  const inventory = new PlayerInventory();
  // place hatchets only in slots 2 and 7 via ordered insert fillers
  inventory.tryInsert(createItemStack("pine-log", 1)); // 0
  inventory.tryInsert(createItemStack("limestone", 1)); // 1
  inventory.tryInsert(createItemStack("hatchet", 1)); // 2
  inventory.tryInsert(createItemStack("pine-log", 1)); // 3
  inventory.tryInsert(createItemStack("limestone", 1)); // 4
  inventory.tryInsert(createItemStack("dad-hat", 1)); // 5
  inventory.tryInsert(createItemStack("shirt", 1)); // 6
  inventory.tryInsert(createItemStack("hatchet", 1)); // 7
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.findToolSlot("hatchet"), 2);
  assert.equal(inventory.findFirstSlotByItemId("hatchet"), 2);
}

// F. Craft → harvest recognition without sync/equip
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 3));
  inventory.tryInsert(createItemStack("limestone", 3));
  const crafting = new CraftingSystem(inventory);
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), false);
  const craft = crafting.craft("hatchet");
  assert.equal(craft.accepted, true);
  assert.equal(craft.status, "crafted");
  assert.equal(inventory.totalQuantity("hatchet"), 1);
  assert.equal(tools.hasTool("hatchet"), true, "crafted hatchet is immediately visible via inventory");
  assert.notEqual(tools.findToolSlot("hatchet"), null);
}

{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pine-log", 3));
  inventory.tryInsert(createItemStack("limestone", 3));
  const crafting = new CraftingSystem(inventory);
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("pickaxe"), false);
  assert.equal(crafting.craft("pickaxe").accepted, true);
  assert.equal(tools.hasTool("pickaxe"), true);
}

// G/H/I. Correct requirements, hits, yields with inventory gate
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-full", "pine-tree");
  assert.equal(tree.requiredTool, "hatchet");
  assert.equal(tree.totalHits, 4);
  for (let hit = 0; hit < 4; hit += 1) {
    assert.equal(tools.hasTool("hatchet"), true);
    assert.equal(tree.applyImpact(tools.hasTool(tree.requiredTool) ? tree.requiredTool : null).accepted, true);
  }
  assert.equal(tree.isDepleted, true);
  const treeYield = tree.claimYield();
  assert.deepEqual(treeYield, { itemId: "pine-log", quantity: 3 });
  assert.equal(inventory.totalQuantity("hatchet"), 1, "hatchet remains after full harvest");
}

{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const rock = resource("rock-full", "limestone-rock");
  assert.equal(rock.requiredTool, "pickaxe");
  assert.equal(rock.totalHits, 5);
  for (let hit = 0; hit < 5; hit += 1) {
    assert.equal(rock.applyImpact(tools.hasTool(rock.requiredTool) ? rock.requiredTool : null).accepted, true);
  }
  assert.equal(rock.isDepleted, true);
  assert.deepEqual(rock.claimYield(), { itemId: "limestone", quantity: 3 });
  assert.equal(inventory.totalQuantity("pickaxe"), 1, "pickaxe remains after full harvest");
}

// Live availability: remove tool mid-session blocks acceptance gate
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("hatchet", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  assert.equal(tools.hasTool("hatchet"), true);
  // simulate remove by equipping/clearing: exchange whole stack to remove
  const slot = tools.findToolSlot("hatchet");
  assert.equal(inventory.exchangeWholeStack(slot, inventory.getSlot(slot).stack, null), true);
  assert.equal(tools.hasTool("hatchet"), false);
  const tree = resource("tree-live", "pine-tree");
  assert.equal(tree.applyImpact(tools.hasTool(tree.requiredTool) ? tree.requiredTool : null).accepted, false);
  assert.equal(tree.remainingHits, 4);
}

// Wrong tool explicit
{
  const inventory = new PlayerInventory();
  inventory.tryInsert(createItemStack("pickaxe", 1));
  const tools = new InventoryHarvestTools(inventory, new PlayerWeaponSlot());
  const tree = resource("tree-wrong", "pine-tree");
  assert.equal(tree.applyImpact("pickaxe").accepted, false);
  assert.equal(tree.applyImpact(tools.hasTool("hatchet") ? "hatchet" : null).accepted, false);
}

// Catalog / combat / counts regressions
assert.equal(ITEM_REGISTRY.getAll().length, 10);
assert.equal(ITEM_REGISTRY.get("hatchet").category, "tool");
assert.equal(ITEM_REGISTRY.get("pickaxe").category, "tool");
assert.equal(ITEM_REGISTRY.get("hatchet").maxStack, 1);
assert.equal(ITEM_REGISTRY.get("pickaxe").maxStack, 1);
assert.equal(CRAFTING_RECIPES.getAll().length, 3);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.deepEqual([...EQUIPMENT_SLOT_IDS], ["head", "torso", "legs", "feet"]);
assert.equal(FISTS_COMBAT_PROFILE.damage, 6);

// Architecture: PrototypeToolLoadout removed; production path inventory-backed
await assert.rejects(() => access(new URL("../src/harvesting/PrototypeToolLoadout.ts", import.meta.url), fsConstants.F_OK), "PrototypeToolLoadout must be removed");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const harvestSource = await readFile(new URL("../src/harvesting/HarvestingSystem.ts", import.meta.url), "utf8");
const toolSource = await readFile(new URL("../src/harvesting/InventoryHarvestTools.ts", import.meta.url), "utf8");
const resolverSource = await readFile(new URL("../src/harvesting/HarvestToolResolver.ts", import.meta.url), "utf8");
const calibrationSource = await readFile(new URL("../src/debug/CalibrationPanel.ts", import.meta.url), "utf8");
const debugSource = await readFile(new URL("../src/debug/DebugOverlay.ts", import.meta.url), "utf8");
const inventorySource = await readFile(new URL("../src/inventory/PlayerInventory.ts", import.meta.url), "utf8");
const equipmentTypes = await readFile(new URL("../src/equipment/EquipmentTypes.ts", import.meta.url), "utf8");
const itemSystem = await readFile(new URL("../src/items/ItemSystem.ts", import.meta.url), "utf8");
const meleeSource = await readFile(new URL("../src/combat/MeleeCombatSystem.ts", import.meta.url), "utf8");

assert.equal(gameSource.includes("InventoryHarvestTools"), true);
assert.equal(gameSource.includes("PlayerWeaponSlot"), true);
assert.equal(gameSource.includes("PrototypeToolLoadout"), false);
assert.equal(harvestSource.includes("PrototypeToolLoadout"), false);
assert.equal(harvestSource.includes("InventoryHarvestTools"), true);
assert.equal(resolverSource.includes("findFirstSlotByItemId"), true);
assert.equal(resolverSource.includes("weapon-slot"), true);
assert.equal(toolSource.includes("HarvestToolResolver"), true);
assert.equal(toolSource.includes("consumeImpactUse"), true);
assert.equal(inventorySource.includes("findFirstSlotByItemId"), true);
assert.equal(calibrationSource.includes("PrototypeToolLoadout"), false);
assert.equal(calibrationSource.includes("prototype-tools"), false);
assert.equal(debugSource.includes("HARVEST TOOLS") || debugSource.includes("WEAPON"), true);
assert.equal(debugSource.includes("weapon-slot") || debugSource.includes("lowest"), true);
assert.equal(debugSource.includes("durability"), true);
assert.equal(debugSource.includes("impact cost 1") || debugSource.includes("currentDurability") || debugSource.includes(" / "), true);
assert.equal(debugSource.includes("HarvestToolResolver") || debugSource.includes("weapon-slot"), true);
assert.equal(resolverSource.includes("Math.random"), false);
assert.equal(ITEM_REGISTRY.get("hatchet").maxDurability, 50);
assert.equal(ITEM_REGISTRY.get("pickaxe").maxDurability, 50);
assert.equal(itemSystem.includes("maxDurability"), true);
assert.equal(itemSystem.includes("currentDurability"), true);
assert.equal(toolSource.includes("consumeImpactUse"), true);
assert.equal(/weapon|tool|mainHand|offHand/.test(equipmentTypes), false);
assert.equal(meleeSource.includes("hatchet"), false);
assert.equal(meleeSource.includes("pickaxe"), false);
assert.equal(meleeSource.includes("InventoryHarvestTools"), false);

console.log("Harvesting tools verification passed (inventory source, craft integration, resolution, boundaries)");
