import assert from "node:assert/strict";
import { CombatDummy } from "../src/combat/CombatDummy.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { MeleeCombatSystem } from "../src/combat/MeleeCombatSystem.ts";
import { UNARMED_MELEE_PROFILE } from "../src/combat/MeleeCombatProfile.ts";
import { resolvePlayerMeleeProfile } from "../src/combat/resolvePlayerMeleeProfile.ts";
import { PlayerWeaponSlot } from "../src/equipment/PlayerWeaponSlot.ts";
import { WeaponEquipSystem } from "../src/equipment/WeaponEquipSystem.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { HarvestToolResolver } from "../src/harvesting/HarvestToolResolver.ts";
import { HARVESTING_RESOURCES, HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack, ITEM_REGISTRY } from "../src/items/ItemSystem.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";

assert.equal(ITEM_REGISTRY.getAll().length, 10);
assert.equal(CRAFTING_RECIPES.getAll().length, 3);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.equal(EQUIPMENT_SLOT_IDS.length, 4);
assert.deepEqual([...EQUIPMENT_SLOT_IDS], ["head", "torso", "legs", "feet"]);
assert.equal(ITEM_REGISTRY.get("hatchet").meleeCombat?.damage, 7);
assert.equal(ITEM_REGISTRY.get("hatchet").meleeCombat?.attacksPerSecond, 0.9);
assert.equal(ITEM_REGISTRY.get("pickaxe").meleeCombat?.damage, 7);
assert.equal(ITEM_REGISTRY.get("pickaxe").meleeCombat?.attacksPerSecond, 1.1);
assert.equal(UNARMED_MELEE_PROFILE.damage, 6);
assert.equal(UNARMED_MELEE_PROFILE.attacksPerSecond, 1.8);

function playerAdapter() {
  return {
    position: { x: 0, y: 0, z: 0 },
    getCombatPosition() { return this.position; },
    faceCombatTarget() {},
    applyMeleeAttackPose() {},
    clearMeleeAttackPose() {},
  };
}

function makeCombat(weaponSlot, targetPosition = { x: 0.8, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const target = new CombatDummy("dummy-weapon", targetPosition);
  targets.register(target);
  const player = playerAdapter();
  const impacts = [];
  const combat = new MeleeCombatSystem(
    targets,
    player,
    () => resolvePlayerMeleeProfile(weaponSlot),
    () => {},
    (impact) => {
      impacts.push(impact);
      if (impact.profile.consumesDurability) {
        weaponSlot.tryConsumeDurability(impact.profile.source, 1);
      }
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

// --- 51 empty weapon slot fists ---
{
  const weaponSlot = new PlayerWeaponSlot();
  assert.equal(weaponSlot.isEmpty, true);
  const profile = resolvePlayerMeleeProfile(weaponSlot);
  assert.equal(profile.source, "fists");
  assert.equal(profile.damage, 6);
  assert.equal(profile.attacksPerSecond, 1.8);
  const h = makeCombat(weaponSlot);
  for (let i = 0; i < 7; i += 1) swingHit(h);
  assert.equal(h.target.health.currentHealth, 0);
  assert.equal(h.impacts.length, 7);
}

// --- 52 hatchet equip ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 37 }));
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(inventory.getSlot(0).stack, null);
  assert.equal(weaponSlot.current?.itemId, "hatchet");
  assert.equal(weaponSlot.current?.currentDurability, 37);
  const profile = resolvePlayerMeleeProfile(weaponSlot);
  assert.equal(profile.damage, 7);
  assert.equal(profile.attacksPerSecond, 0.9);
}

// --- 53 pickaxe equip ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 29 }));
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(weaponSlot.current?.itemId, "pickaxe");
  assert.equal(weaponSlot.current?.currentDurability, 29);
  const profile = resolvePlayerMeleeProfile(weaponSlot);
  assert.equal(profile.damage, 7);
  assert.equal(profile.attacksPerSecond, 1.1);
}

// --- 54 unequip ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 25 }));
  equip.equipFromInventory(0);
  assert.equal(equip.unequipToInventory().accepted, true);
  assert.equal(weaponSlot.isEmpty, true);
  assert.equal(inventory.getSlot(0).stack?.itemId, "hatchet");
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 25);
}

// --- 55 atomic swap ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 12 }));
  equip.equipFromInventory(0);
  inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 43 }));
  // pickaxe land at first empty = 0
  assert.equal(inventory.getSlot(0).stack?.itemId, "pickaxe");
  assert.equal(equip.equipFromInventory(0).accepted, true);
  assert.equal(weaponSlot.current?.itemId, "pickaxe");
  assert.equal(weaponSlot.current?.currentDurability, 43);
  assert.equal(inventory.getSlot(0).stack?.itemId, "hatchet");
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 12);
  assert.equal(inventory.totalQuantity("hatchet"), 1);
  assert.equal(inventory.totalQuantity("pickaxe"), 0);
}

// Force pickaxe into a non-zero source slot for swap fidelity
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  inventory.tryInsert(createItemStack("dad-hat", 1));
  inventory.tryInsert(createItemStack("shirt", 1));
  inventory.tryInsert(createItemStack("cargo-pants", 1));
  inventory.tryInsert(createItemStack("sneakers", 1));
  inventory.tryInsert(createItemStack("pickaxe", 1, { currentDurability: 43 }));
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 12 }));
  const hatchetSlot = inventory.findFirstSlotByItemId("hatchet");
  assert.equal(hatchetSlot, 5);
  assert.equal(equip.equipFromInventory(hatchetSlot).accepted, true);
  const pickaxeSlot = inventory.findFirstSlotByItemId("pickaxe");
  assert.equal(pickaxeSlot, 4);
  assert.equal(equip.equipFromInventory(4).accepted, true);
  assert.equal(weaponSlot.current?.itemId, "pickaxe");
  assert.equal(weaponSlot.current?.currentDurability, 43);
  assert.equal(inventory.getSlot(4).stack?.itemId, "hatchet");
  assert.equal(inventory.getSlot(4).stack?.currentDurability, 12);
}

// --- 56 combat durability hit + miss ---
{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1), () => true);
  const h = makeCombat(weaponSlot);
  swingHit(h);
  assert.equal(h.target.health.currentHealth, 33);
  assert.equal(weaponSlot.current?.currentDurability, 49);

  // miss/out of range before impact
  const h2 = makeCombat(weaponSlot, { x: 0.8, y: 0, z: 0 });
  assert.equal(h2.combat.requestAttack(), "started");
  h2.player.position = { x: 5, y: 0, z: 0 };
  h2.combat.update(resolvePlayerMeleeProfile(weaponSlot).cycleDuration);
  assert.equal(h2.target.health.currentHealth, 40);
  assert.equal(weaponSlot.current?.currentDurability, 49);
}

{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("pickaxe", 1), () => true);
  const h = makeCombat(weaponSlot);
  swingHit(h);
  assert.equal(h.target.health.currentHealth, 33);
  assert.equal(weaponSlot.current?.currentDurability, 49);
}

// --- 57 hatchet kill ---
{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1), () => true);
  const zombie = new RoamingZombie("zombie-hatchet", { x: 0.8, y: 0, z: 0 });
  assert.equal(zombie.health.currentHealth, 40);
  const targets = new CombatTargetSystem();
  targets.register(zombie);
  const player = playerAdapter();
  const combat = new MeleeCombatSystem(
    targets,
    player,
    () => resolvePlayerMeleeProfile(weaponSlot),
    () => {},
    (impact) => {
      if (impact.profile.consumesDurability) weaponSlot.tryConsumeDurability(impact.profile.source, 1);
    },
  );
  for (let i = 0; i < 6; i += 1) {
    targets.update(player.position);
    assert.equal(combat.requestAttack(), "started");
    combat.update(resolvePlayerMeleeProfile(weaponSlot).cycleDuration || 1 / 0.9);
  }
  assert.equal(zombie.health.currentHealth, 0);
  assert.equal(weaponSlot.current?.currentDurability, 44);
  assert.equal(combat.impactCount, 6);
}

// --- 58 pickaxe kill ---
{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("pickaxe", 1), () => true);
  const zombie = new RoamingZombie("zombie-pickaxe", { x: 0.8, y: 0, z: 0 });
  const targets = new CombatTargetSystem();
  targets.register(zombie);
  const player = playerAdapter();
  const combat = new MeleeCombatSystem(
    targets,
    player,
    () => resolvePlayerMeleeProfile(weaponSlot),
    () => {},
    (impact) => {
      if (impact.profile.consumesDurability) weaponSlot.tryConsumeDurability(impact.profile.source, 1);
    },
  );
  for (let i = 0; i < 6; i += 1) {
    targets.update(player.position);
    assert.equal(combat.requestAttack(), "started");
    combat.update(1 / 1.1 + 0.01);
  }
  assert.equal(zombie.health.currentHealth, 0);
  assert.equal(weaponSlot.current?.currentDurability, 44);
  assert.equal(combat.impactCount, 6);
}

// --- 59 last durability combat hit ---
{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1, { currentDurability: 1 }), () => true);
  const h = makeCombat(weaponSlot);
  // set dummy to 7 HP via damage
  h.target.receiveDamage(33);
  assert.equal(h.target.health.currentHealth, 7);
  swingHit(h);
  assert.equal(h.target.health.currentHealth, 0);
  assert.equal(weaponSlot.isEmpty, true);
  // next attack profile fists
  assert.equal(resolvePlayerMeleeProfile(weaponSlot).source, "fists");
  const h2 = makeCombat(weaponSlot);
  assert.equal(resolvePlayerMeleeProfile(weaponSlot).damage, 6);
}

// --- 60 no durability on miss ---
{
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("pickaxe", 1, { currentDurability: 10 }), () => true);
  const h = makeCombat(weaponSlot);
  assert.equal(h.combat.requestAttack(), "started");
  h.player.position = { x: 10, y: 0, z: 0 };
  h.combat.update(1);
  assert.equal(h.target.health.currentHealth, 40);
  assert.equal(weaponSlot.current?.currentDurability, 10);
}

// --- 61 harvest equipped hatchet ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1), () => true);
  const tools = new HarvestToolResolver(inventory, weaponSlot);
  const tree = new HarvestableResource({
    id: "tree-w",
    kind: "pine-tree",
    position: () => ({ x: 0, y: 0, z: 0 }),
    radius: () => 0.5,
    visualEnabled: () => true,
    visual: { impact() {}, deplete() {}, update() {} },
  });
  for (let i = 0; i < HARVESTING_RESOURCES["pine-tree"].totalHits; i += 1) {
    assert.equal(tools.consumeImpactUse("hatchet").accepted, true);
    assert.equal(tree.applyImpact("hatchet").accepted, true);
  }
  assert.equal(tree.isDepleted, true);
  // pine log yield is separate; durability only
  assert.equal(weaponSlot.current?.currentDurability, 46);
}

// --- 62 harvest equipped pickaxe ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("pickaxe", 1), () => true);
  const tools = new HarvestToolResolver(inventory, weaponSlot);
  for (let i = 0; i < 5; i += 1) {
    assert.equal(tools.consumeImpactUse("pickaxe").accepted, true);
  }
  assert.equal(weaponSlot.current?.currentDurability, 45);
}

// --- 63 harvest priority ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1, { currentDurability: 2 }), () => true);
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 50 }));
  const tools = new HarvestToolResolver(inventory, weaponSlot);
  assert.equal(tools.resolve("hatchet")?.source, "weapon-slot");
  tools.consumeImpactUse("hatchet");
  assert.equal(weaponSlot.current?.currentDurability, 1);
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 50);
  tools.consumeImpactUse("hatchet");
  assert.equal(weaponSlot.isEmpty, true);
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 50);
  tools.consumeImpactUse("hatchet");
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 49);
}

// --- 64 wrong equipped tool ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("pickaxe", 1, { currentDurability: 30 }), () => true);
  inventory.tryInsert(createItemStack("hatchet", 1, { currentDurability: 40 }));
  const tools = new HarvestToolResolver(inventory, weaponSlot);
  assert.equal(tools.resolve("hatchet")?.source, "inventory");
  tools.consumeImpactUse("hatchet");
  assert.equal(inventory.getSlot(0).stack?.currentDurability, 39);
  assert.equal(weaponSlot.current?.currentDurability, 30);
  tools.consumeImpactUse("pickaxe");
  assert.equal(weaponSlot.current?.currentDurability, 29);
}

// --- 65 shared durability ---
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1), () => true);
  const tools = new HarvestToolResolver(inventory, weaponSlot);
  tools.consumeImpactUse("hatchet");
  assert.equal(weaponSlot.current?.currentDurability, 49);
  const h = makeCombat(weaponSlot);
  swingHit(h);
  assert.equal(weaponSlot.current?.currentDurability, 48);
  tools.consumeImpactUse("hatchet");
  assert.equal(weaponSlot.current?.currentDurability, 47);
}

// Mid-swing profile lock
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot, () => {});
  inventory.tryInsert(createItemStack("hatchet", 1));
  equip.equipFromInventory(0);
  const h = makeCombat(weaponSlot);
  assert.equal(h.combat.requestAttack(), "started");
  // snap unequip mid-swing via direct mutation (shouldn't change in-flight damage)
  weaponSlot.unequipIfAccepted(weaponSlot.current, () => true);
  h.combat.update(1 / 0.9);
  assert.equal(h.target.health.currentHealth, 33, "locked hatchet damage still applies when unequipped mid-swing");
}

// unequip capacity fail atomic
{
  const inventory = new PlayerInventory();
  const weaponSlot = new PlayerWeaponSlot();
  const equip = new WeaponEquipSystem(inventory, weaponSlot);
  weaponSlot.equipIfAccepted(createItemStack("hatchet", 1, { currentDurability: 11 }), () => true);
  for (let index = 0; index < 10; index += 1) {
    assert.equal(inventory.tryInsert(createItemStack(index % 2 ? "pine-log" : "limestone", 20)).accepted, true);
  }
  assert.equal(inventory.emptySlotCount, 0);
  assert.equal(equip.unequipToInventory().accepted, false);
  assert.equal(weaponSlot.current?.currentDurability, 11);
  assert.equal(inventory.occupiedSlotCount, 10);
}

console.log("verifyWeaponCombat: ok");
