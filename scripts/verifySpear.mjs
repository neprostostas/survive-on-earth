import assert from "node:assert/strict";
import { CombatDummy } from "../src/combat/CombatDummy.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { MeleeCombatSystem } from "../src/combat/MeleeCombatSystem.ts";
import { DEFAULT_MELEE_HIT_RANGE, UNARMED_MELEE_PROFILE } from "../src/combat/MeleeCombatProfile.ts";
import { resolvePlayerMeleeProfile } from "../src/combat/resolvePlayerMeleeProfile.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { WeaponEquipSystem } from "../src/equipment/WeaponEquipSystem.ts";
import { isWeaponCapableItemId } from "../src/equipment/WeaponTypes.ts";
import { HarvestToolResolver } from "../src/harvesting/HarvestToolResolver.ts";
import { HARVESTING_RESOURCES, HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack, ITEM_REGISTRY } from "../src/items/ItemSystem.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { CraftingSystem } from "../src/crafting/CraftingSystem.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";
import { COMBAT_CONFIG } from "../src/combat/combatConfig.ts";

assert.equal(ITEM_REGISTRY.getAll().length, 10);
const spearDef = ITEM_REGISTRY.get("spear");
assert.equal(spearDef.maxStack, 1);
assert.equal(spearDef.maxDurability, 100);
assert.equal(spearDef.meleeCombat?.damage, 10);
assert.equal(spearDef.meleeCombat?.attacksPerSecond, 1.0);
assert.equal(spearDef.meleeCombat?.hitRange, 1.35);
assert.equal(isWeaponCapableItemId("spear"), true);
assert.equal(isWeaponCapableItemId("pine-log"), false);
assert.equal(isWeaponCapableItemId("dad-hat"), false);

assert.equal(CRAFTING_RECIPES.getAll().length, 3);
const spearRecipe = CRAFTING_RECIPES.get("spear");
assert.deepEqual(spearRecipe.ingredients, [{ itemId: "pine-log", quantity: 3 }]);
assert.equal(spearRecipe.output.itemId, "spear");
assert.equal(spearRecipe.output.currentDurability, 100);
assert.deepEqual(CRAFTING_RECIPES.get("hatchet").ingredients, [
  { itemId: "pine-log", quantity: 3 },
  { itemId: "limestone", quantity: 3 },
]);
assert.deepEqual(CRAFTING_RECIPES.get("pickaxe").ingredients, [
  { itemId: "pine-log", quantity: 3 },
  { itemId: "limestone", quantity: 3 },
]);

function playerAdapter(pos = { x: 0, y: 0, z: 0 }) {
  return {
    position: { ...pos },
    getCombatPosition() { return this.position; },
    faceCombatTarget() {},
    applyMeleeAttackPose() {},
    clearMeleeAttackPose() {},
  };
}

function makeCombat(weaponSlot, targetPosition = { x: 0.8, y: 0, z: 0 }, playerPos = { x: 0, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const target = new CombatDummy("dummy-spear", targetPosition);
  targets.register(target);
  const player = playerAdapter(playerPos);
  const impacts = [];
  const combat = new MeleeCombatSystem(
    targets,
    player,
    () => resolvePlayerMeleeProfile(weaponSlot),
    () => {},
    (impact) => {
      impacts.push(impact);
      if (impact.profile.consumesDurability) weaponSlot.tryConsumeDurability(impact.profile.source, 1);
    },
  );
  targets.update(player.position);
  return { targets, target, player, impacts, combat, weaponSlot };
}

function swingHit(harness) {
  harness.targets.update(harness.player.position);
  assert.equal(harness.combat.requestAttack(), "started");
  harness.combat.update(harness.combat.activeProfile.cycleDuration);
}

// Craft success
{
  const inventory = new PlayerInventory();
  assert.equal(inventory.tryInsert(createItemStack("pine-log", 3)).accepted, true);
  const crafting = new CraftingSystem(inventory);
  const result = crafting.craft("spear");
  assert.equal(result.accepted, true);
  assert.equal(result.status, "crafted");
  assert.equal(inventory.totalQuantity("pine-log"), 0);
  assert.equal(inventory.totalQuantity("spear"), 1);
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 100);
}

// Craft insufficient
{
  const inventory = new PlayerInventory();
  assert.equal(inventory.tryInsert(createItemStack("pine-log", 2)).accepted, true);
  const crafting = new CraftingSystem(inventory);
  const result = crafting.craft("spear");
  assert.equal(result.accepted, false);
  assert.equal(result.status, "not-enough-resources");
  assert.equal(inventory.totalQuantity("pine-log"), 2);
  assert.equal(inventory.totalQuantity("spear"), 0);
}

// Craft inventory-full (partial log stack leaves no empty slot for spear)
{
  const inventory = new PlayerInventory();
  assert.equal(inventory.tryInsert(createItemStack("pine-log", 5)).accepted, true);
  for (let i = 0; i < 9; i += 1) {
    assert.equal(inventory.tryInsert(createItemStack("sneakers", 1)).accepted, true);
  }
  const crafting = new CraftingSystem(inventory);
  const result = crafting.craft("spear");
  assert.equal(result.accepted, false);
  assert.equal(result.status, "inventory-full");
  assert.equal(inventory.totalQuantity("pine-log"), 5);
  assert.equal(inventory.totalQuantity("spear"), 0);
}

// Equip / unequip
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  const spear = createItemStack("spear", 1);
  assert.equal(inventory.tryInsert(spear).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(weapon.current?.itemId, "spear");
  assert.equal(weapon.current?.currentDurability, 100);
  assert.equal(inventory.totalQuantity("spear"), 0);
  assert.equal(equip.unequipToInventory().accepted, true);
  assert.equal(weapon.isEmpty, true);
  assert.equal(inventory.totalQuantity("spear"), 1);
}

// Swap hatchet ↔ spear, pickaxe ↔ spear
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  const hatchet = createItemStack("hatchet", 1, { currentDurability: 40 });
  const spear = createItemStack("spear", 1, { currentDurability: 77 });
  assert.equal(inventory.tryInsert(hatchet).accepted, true);
  assert.equal(inventory.tryInsert(spear).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const spearSlot = inventory.getSlots().findIndex((s) => s.stack?.itemId === "spear");
  assert.equal(equip.equipFromInventory(spearSlot).accepted, true);
  assert.equal(weapon.current?.currentDurability, 77);
  assert.equal(inventory.getSlots().find((s) => s.stack?.itemId === "hatchet")?.stack?.currentDurability, 40);
}
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 33 })).accepted, true);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1, { currentDurability: 88 })).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const spearSlot = inventory.getSlots().findIndex((s) => s.stack?.itemId === "spear");
  assert.equal(equip.equipFromInventory(spearSlot).accepted, true);
  assert.equal(weapon.current?.currentDurability, 88);
  assert.equal(inventory.getSlots().find((s) => s.stack?.itemId === "pickaxe")?.stack?.currentDurability, 33);
}

// Unequip rejected if full
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  for (let i = 0; i < 10; i += 1) assert.equal(inventory.tryInsert(createItemStack("sneakers", 1)).accepted, true);
  assert.equal(equip.unequipToInventory().accepted, false);
  assert.equal(weapon.current?.itemId, "spear");
}

// Profile
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const profile = resolvePlayerMeleeProfile(weapon);
  assert.equal(profile.source, "spear");
  assert.equal(profile.damage, 10);
  assert.equal(profile.attacksPerSecond, 1.0);
  assert.equal(profile.cycleDuration, 1.0);
  assert.equal(profile.hitRange, 1.35);
  assert.equal(DEFAULT_MELEE_HIT_RANGE, COMBAT_CONFIG.meleeHitRange);
  assert.equal(UNARMED_MELEE_PROFILE.hitRange, 1.15);
  assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
}

// Zombie 4 hits + durability 96
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const targets = new CombatTargetSystem();
  const zombie = new RoamingZombie("zombie-spear", { x: 0.8, y: 0, z: 0 });
  targets.register(zombie);
  const player = playerAdapter();
  const impacts = [];
  const combat = new MeleeCombatSystem(
    targets,
    player,
    () => resolvePlayerMeleeProfile(weapon),
    () => {},
    (impact) => {
      impacts.push(impact);
      if (impact.profile.consumesDurability) weapon.tryConsumeDurability(impact.profile.source, 1);
    },
  );
  for (let i = 0; i < 4; i += 1) {
    targets.update(player.position);
    assert.equal(combat.requestAttack(), "started");
    combat.update(1.0);
  }
  assert.equal(impacts.length, 4);
  assert.equal(zombie.health.currentHealth, 0);
  assert.equal(weapon.current?.currentDurability, 96);
}

// Miss: flee mid-swing
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const h = makeCombat(weapon, { x: 1.2, y: 0, z: 0 });
  assert.equal(h.combat.requestAttack(), "started");
  h.player.position.x = -10;
  h.combat.update(1.0);
  assert.equal(h.impacts.length, 0);
  assert.equal(weapon.current?.currentDurability, 100);
}

// Range: 1.25 out for fists, in for spear; 1.5 out for spear
{
  const weaponEmpty = new PlayerWeaponSlot();
  const fists = makeCombat(weaponEmpty, { x: 1.25, y: 0, z: 0 });
  assert.equal(fists.combat.requestAttack(), "out-of-range");

  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const inRange = makeCombat(weapon, { x: 1.25, y: 0, z: 0 });
  assert.equal(inRange.combat.requestAttack(), "started");
  inRange.combat.update(1.0);
  assert.equal(inRange.impacts.length, 1);
  assert.equal(weapon.current?.currentDurability, 99);

  const out = makeCombat(weapon, { x: 1.5, y: 0, z: 0 });
  assert.equal(out.combat.requestAttack(), "out-of-range");
  assert.equal(weapon.current?.currentDurability, 99);
}

// Last durability point
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1, { currentDurability: 1 })).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1, { currentDurability: 100 })).accepted, true);
  const h = makeCombat(weapon);
  swingHit(h);
  assert.equal(h.impacts.length, 1);
  assert.equal(h.target.health.currentHealth, 30);
  assert.equal(weapon.isEmpty, true);
  assert.equal(inventory.totalQuantity("spear"), 1, "no auto-equip of inventory spear");
  assert.equal(resolvePlayerMeleeProfile(weapon).source, "fists");
}

// Harvest isolation + fallback
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon);
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  const tools = new HarvestToolResolver(inventory, weapon);
  assert.equal(tools.resolve("hatchet"), null);
  assert.equal(tools.resolve("pickaxe"), null);
  assert.equal(HARVESTING_RESOURCES["pine-tree"].requiredTool, "hatchet");
  assert.equal(new HarvestableResource({
    id: "tree-s",
    kind: "pine-tree",
    position: () => ({ x: 0, y: 0, z: 0 }),
    radius: () => 0.4,
    visualEnabled: () => true,
    visual: { impact() {}, deplete() {}, update() {} },
  }).applyImpact(null).accepted, false);
  assert.equal(weapon.current?.currentDurability, 100);

  assert.equal(inventory.tryInsert(createItemStack("hatchet", 1)).accepted, true);
  assert.equal(inventory.tryInsert(createItemStack("pickaxe", 1)).accepted, true);
  assert.equal(tools.resolve("hatchet")?.source, "inventory");
  tools.consumeImpactUse("hatchet");
  assert.equal(weapon.current?.currentDurability, 100);
  assert.equal(inventory.getSlots().find((s) => s.stack?.itemId === "hatchet")?.stack?.currentDurability, 49);
  assert.equal(tools.resolve("pickaxe")?.source, "inventory");
  tools.consumeImpactUse("pickaxe");
  assert.equal(weapon.current?.currentDurability, 100);
}

// Mid-swing profile snapshot
{
  const inventory = new PlayerInventory();
  const weapon = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weapon, () => {});
  assert.equal(inventory.tryInsert(createItemStack("spear", 1)).accepted, true);
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(inventory.tryInsert(createItemStack("hatchet", 1)).accepted, true);
  const h = makeCombat(weapon);
  assert.equal(h.combat.requestAttack(), "started");
  const hatchetSlot = inventory.getSlots().findIndex((s) => s.stack?.itemId === "hatchet");
  equip.equipFromInventory(hatchetSlot);
  h.combat.update(1.0);
  assert.equal(h.impacts.length, 1);
  assert.equal(h.impacts[0].profile.source, "spear");
  assert.equal(h.impacts[0].damage.requested, 10);
}

console.log("verifySpear: ok");
