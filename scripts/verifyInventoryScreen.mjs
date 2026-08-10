import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolvePlayerMeleeProfile } from "../src/combat/resolvePlayerMeleeProfile.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EquipmentSystem } from "../src/equipment/EquipmentSystem.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { PlayerEquipment } from "../src/equipment/PlayerEquipment.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { WeaponEquipSystem } from "../src/equipment/WeaponEquipSystem.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { ITEM_REGISTRY, createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(INVENTORY_CONFIG.baseSlotCount, 10, "POCKETS remain 10");
assert.equal(EQUIPMENT_SLOT_IDS.length, 4, "Armor remains 4 slots");
assert.equal(ITEM_REGISTRY.getAll().length, 10, "ItemDefinitions = 10");
assert.equal(CRAFTING_RECIPES.getAll().length, 3, "Recipes = 3");

const panelSource = await readFile(new URL("../src/ui/InventoryPanel.ts", import.meta.url), "utf8");
const previewSource = await readFile(new URL("../src/ui/InventoryCharacterPreview.ts", import.meta.url), "utf8");
const apparelSource = await readFile(new URL("../src/equipment/EquipmentApparelVisuals.ts", import.meta.url), "utf8");
const controllerSource = await readFile(new URL("../src/equipment/EquipmentVisualController.ts", import.meta.url), "utf8");
const cssSource = await readFile(new URL("../src/styles.css", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");

assert.equal(panelSource.includes("POCKETS"), true, "POCKETS section present");
assert.equal(panelSource.includes("dataset.pocketIndex"), true, "POCKET index mapping attrs");
assert.equal(panelSource.includes("dataset.slotIndex"), true, "Inventory slot indexes");
assert.equal(panelSource.includes("INVENTORY_CONFIG.baseSlotCount"), true, "pocket grid from capacity config");
assert.equal(panelSource.includes("INVENTORY_CONFIG.columns"), true, "columns from config");
assert.equal(panelSource.includes("dataset.equipmentSlot"), true, "armor slot mapping");
assert.equal(panelSource.includes('data-role="weapon-slot"'), true, "weapon slot UI");
assert.equal(panelSource.includes('data-role="backpack-equip"'), true, "backpack equip slot");
assert.equal(panelSource.includes('data-role="utility-equip"'), true, "utility shell");
assert.equal(panelSource.includes('data-role="backpack-future"'), true, "backpack storage area");
assert.equal(panelSource.includes("BACKPACK_STORAGE_UI_COUNT"), true, "backpack storage UI count");
assert.equal(panelSource.includes("BackpackEquipSystem"), true, "production backpack equip");
assert.equal(panelSource.includes("EMPTY BACKPACK FIRST"), true, "occupied unequip feedback");
assert.equal(panelSource.includes("inv-character-canvas"), true, "3D preview canvas");
assert.equal(panelSource.includes("InventoryCharacterPreview"), true, "uses dedicated preview");
assert.equal(panelSource.includes("updateLiveFrame"), true, "live HP/stats frame");
assert.equal(panelSource.includes("resolvePlayerMeleeProfile"), true, "stats use production melee profile");
assert.equal(panelSource.includes("USE") && panelSource.includes("SPLIT") && panelSource.includes("DELETE"), true, "action shells");
assert.equal(panelSource.includes("inv-shell-btn"), true, "disabled action strip class");
assert.equal(previewSource.includes("Visual-only"), true, "preview documented visual-only");
assert.equal(previewSource.includes("PlayerVisual"), true, "preview reuses PlayerVisual");
assert.equal(previewSource.includes("EquipmentApparelVisuals"), true, "preview reuses apparel factory");
assert.equal(previewSource.includes("setEquippedBackpack"), true, "preview backpack sync");
assert.equal(apparelSource.includes("class EquipmentApparelVisuals"), true, "shared apparel visuals");
assert.equal(controllerSource.includes("EquipmentApparelVisuals"), true, "world controller reuses apparel");
assert.equal(controllerSource.includes("BackpackEquipPresentation"), true, "world backpack presentation");
assert.equal(cssSource.includes("inventory-screen"), true, "full-screen inventory styles");
assert.equal(cssSource.includes("inv-character-canvas"), true, "preview canvas styles");
assert.equal(cssSource.includes("inv-backpack-future"), true, "backpack storage styles");
assert.equal(cssSource.includes("inventory-drag-ghost"), true, "drag ghost preserved");
assert.equal(gameSource.includes("updateLiveFrame"), true, "Game feeds live inventory frame");
assert.equal(gameSource.includes("motionFrozen"), true, "F3 freeze reaches inventory frame");
assert.equal(gameSource.includes("PlayerBackpackSlot"), true, "Game wires backpack domain");
assert.equal(gameSource.includes("spawnStarterBasicBackpack"), true, "authored Basic Backpack spawn");

const pocketLoop = panelSource.includes("Array.from({ length: INVENTORY_CONFIG.baseSlotCount }");
assert.equal(pocketLoop, true, "exactly baseSlotCount pocket buttons from config");

const inventory = new PlayerInventory();
const equipment = new PlayerEquipment();
const equipmentSystem = new EquipmentSystem(inventory, equipment);
const weaponSlot = new PlayerWeaponSlot();
const weaponEquip = new WeaponEquipSystem(inventory, weaponSlot);

assert.equal(inventory.slotCount, 10);
assert.equal(equipment.getSlots().length, 4);
assert.equal(weaponSlot.isEmpty, true);

const fists = resolvePlayerMeleeProfile(weaponSlot);
assert.equal(fists.damage, 6);
assert.equal(fists.attacksPerSecond, 1.8);
assert.equal(fists.source, "fists");

inventory.tryInsert(createItemStack("spear", 1));
assert.equal(weaponEquip.equipFromInventory(0).accepted, true);
const spear = resolvePlayerMeleeProfile(weaponSlot);
assert.equal(spear.damage, 10);
assert.equal(spear.attacksPerSecond, 1.0);

console.log("verifyInventoryScreen: ok");
