import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { calculateArmorMitigatedDamage, ARMOR_DAMAGE_CONSTANT } from "../src/combat/ArmorMitigation.ts";
import { CombatDummy } from "../src/combat/CombatDummy.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { PlayerDamageResolver } from "../src/combat/PlayerDamageResolver.ts";
import { FISTS_COMBAT_PROFILE } from "../src/combat/combatConfig.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EnemySystem } from "../src/enemies/EnemySystem.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";
import { PLAYER_HEALTH_CONFIG, ROAMING_ZOMBIE_PROFILE } from "../src/enemies/enemyConfig.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { PlayerEquipment } from "../src/equipment/PlayerEquipment.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { ITEM_REGISTRY, createItemStack } from "../src/items/ItemSystem.ts";

// Production armor metadata
assert.equal(ITEM_REGISTRY.get("dad-hat").equipment.armor, 2);
assert.equal(ITEM_REGISTRY.get("shirt").equipment.armor, 3);
assert.equal(ITEM_REGISTRY.get("cargo-pants").equipment.armor, 3);
assert.equal(ITEM_REGISTRY.get("sneakers").equipment.armor, 0);
assert.equal(["dad-hat", "shirt", "cargo-pants", "sneakers"].reduce((t, id) => t + ITEM_REGISTRY.get(id).equipment.armor, 0), 8);
assert.equal(ITEM_REGISTRY.getAll().length, 8);
assert.equal(CRAFTING_RECIPES.getAll().length, 2);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.deepEqual([...EQUIPMENT_SLOT_IDS], ["head", "torso", "legs", "feet"]);
assert.equal(ROAMING_ZOMBIE_PROFILE.damage, 6);
assert.equal(PLAYER_HEALTH_CONFIG.maxHealth, 100);
assert.equal(ARMOR_DAMAGE_CONSTANT, 50 / 3);

// Pure formula matrix (raw 6)
const matrix = [
  [0, 6], [1, 6], [2, 5], [3, 5], [5, 5], [6, 4], [8, 4], [11, 4], [12, 3],
];
for (const [armor, expected] of matrix) {
  const result = calculateArmorMitigatedDamage(6, armor);
  assert.equal(result.finalDamage, expected, `armor ${armor} should yield ${expected}`);
  assert.equal(result.rawDamage, 6);
  assert.equal(result.armorPoints, armor);
  assert.equal(Number.isInteger(result.finalDamage), true);
}

// Exact full-armor references
const zeroArmor = calculateArmorMitigatedDamage(6, 0);
assert.equal(zeroArmor.damageReduction, 0);
assert.equal(zeroArmor.finalDamage, 6);
const fullArmor = calculateArmorMitigatedDamage(6, 8);
assert.ok(Math.abs(fullArmor.damageReduction - 8 / (8 + 50 / 3)) < 1e-12);
assert.ok(Math.abs(6 * (1 - fullArmor.damageReduction) - 4.054054054) < 1e-6);
assert.equal(fullArmor.finalDamage, 4);

// Rounding uses nearest whole number
assert.equal(calculateArmorMitigatedDamage(6, 8).finalDamage, Math.round(6 * 50 / (3 * 8 + 50)));
assert.equal(calculateArmorMitigatedDamage(0, 8).finalDamage, 0);

assert.throws(() => calculateArmorMitigatedDamage(-1, 0), RangeError);
assert.throws(() => calculateArmorMitigatedDamage(6, -1), RangeError);
assert.throws(() => calculateArmorMitigatedDamage(Number.NaN, 0), RangeError);

function equipAllArmor(equipment) {
  assert.equal(equipment.equipIfAccepted("head", createItemStack("dad-hat", 1), () => true), true);
  assert.equal(equipment.equipIfAccepted("torso", createItemStack("shirt", 1), () => true), true);
  assert.equal(equipment.equipIfAccepted("legs", createItemStack("cargo-pants", 1), () => true), true);
  assert.equal(equipment.equipIfAccepted("feet", createItemStack("sneakers", 1), () => true), true);
  assert.equal(equipment.totalArmor, 8);
}

function unequalAll(equipment) {
  for (const slot of EQUIPMENT_SLOT_IDS) {
    const current = equipment.getSlot(slot).stack;
    if (current) assert.equal(equipment.unequipIfAccepted(slot, current, () => true), true);
  }
  assert.equal(equipment.totalArmor, 0);
}

// Metadata/equipment armor sets for production items
const bare = new PlayerEquipment();
assert.equal(bare.totalArmor, 0);
bare.equipIfAccepted("head", createItemStack("dad-hat", 1), () => true);
assert.equal(bare.totalArmor, 2);
assert.equal(calculateArmorMitigatedDamage(6, bare.totalArmor).finalDamage, 5);
const shirtOnly = new PlayerEquipment();
shirtOnly.equipIfAccepted("torso", createItemStack("shirt", 1), () => true);
assert.equal(shirtOnly.totalArmor, 3);
assert.equal(calculateArmorMitigatedDamage(6, shirtOnly.totalArmor).finalDamage, 5);
const pantsOnly = new PlayerEquipment();
pantsOnly.equipIfAccepted("legs", createItemStack("cargo-pants", 1), () => true);
assert.equal(pantsOnly.totalArmor, 3);
const sneakersOnly = new PlayerEquipment();
sneakersOnly.equipIfAccepted("feet", createItemStack("sneakers", 1), () => true);
assert.equal(sneakersOnly.totalArmor, 0);
assert.equal(calculateArmorMitigatedDamage(6, sneakersOnly.totalArmor).finalDamage, 6);
const hatShirt = new PlayerEquipment();
hatShirt.equipIfAccepted("head", createItemStack("dad-hat", 1), () => true);
hatShirt.equipIfAccepted("torso", createItemStack("shirt", 1), () => true);
assert.equal(hatShirt.totalArmor, 5);
assert.equal(calculateArmorMitigatedDamage(6, hatShirt.totalArmor).finalDamage, 5);

// Player damage resolver — no armor
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  const resolver = new PlayerDamageResolver(health, equipment);
  const hit = resolver.applyRawDamage(6);
  assert.equal(hit.rawDamage, 6);
  assert.equal(hit.armor, 0);
  assert.equal(hit.finalDamage, 6);
  assert.equal(hit.previousHealth, 100);
  assert.equal(hit.currentHealth, 94);
  assert.equal(health.currentHealth, 94);
  assert.equal(resolver.lastResult, hit);
}

// Full armor
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const resolver = new PlayerDamageResolver(health, equipment);
  const hit = resolver.applyRawDamage(ROAMING_ZOMBIE_PROFILE.damage);
  assert.equal(hit.rawDamage, 6);
  assert.equal(hit.armor, 8);
  assert.equal(hit.finalDamage, 4);
  assert.equal(hit.currentHealth, 96);
  assert.equal(health.currentHealth, 96);
}

// Partial armor Dad Hat + Shirt
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  equipment.equipIfAccepted("head", createItemStack("dad-hat", 1), () => true);
  equipment.equipIfAccepted("torso", createItemStack("shirt", 1), () => true);
  const hit = new PlayerDamageResolver(health, equipment).applyRawDamage(6);
  assert.equal(hit.armor, 5);
  assert.equal(hit.finalDamage, 5);
  assert.equal(hit.currentHealth, 95);
}

// Live equip between hits
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  const resolver = new PlayerDamageResolver(health, equipment);
  assert.equal(resolver.applyRawDamage(6).currentHealth, 94);
  equipAllArmor(equipment);
  const second = resolver.applyRawDamage(6);
  assert.equal(second.armor, 8);
  assert.equal(second.finalDamage, 4);
  assert.equal(second.currentHealth, 90);
}

// Live unequip between hits
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const resolver = new PlayerDamageResolver(health, equipment);
  assert.equal(resolver.applyRawDamage(6).currentHealth, 96);
  unequalAll(equipment);
  const second = resolver.applyRawDamage(6);
  assert.equal(second.armor, 0);
  assert.equal(second.finalDamage, 6);
  assert.equal(second.currentHealth, 90);
}

// Full armor defeat: 25 hits of final 4
{
  const health = new HealthPool(100);
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const resolver = new PlayerDamageResolver(health, equipment);
  let defeats = 0;
  for (let i = 0; i < 24; i += 1) {
    const hit = resolver.applyRawDamage(6);
    assert.equal(hit.finalDamage, 4);
    assert.equal(hit.becameDefeated, false);
  }
  assert.equal(health.currentHealth, 4);
  assert.equal(health.alive, true);
  const lethal = resolver.applyRawDamage(6);
  assert.equal(lethal.finalDamage, 4);
  assert.equal(lethal.currentHealth, 0);
  assert.equal(lethal.becameDefeated, true);
  defeats += 1;
  const stillDead = resolver.applyRawDamage(6);
  assert.equal(stillDead.currentHealth, 0);
  assert.equal(stillDead.finalDamage, 0);
  assert.equal(stillDead.becameDefeated, false);
  assert.equal(defeats, 1);
  // equipment occupancy conserved
  assert.equal(equipment.totalArmor, 8);
  assert.equal(equipment.getSlot("head").stack?.itemId, "dad-hat");
}

// Enemy integration: impact-time armor resolution
function enemyHarness(equipment = new PlayerEquipment()) {
  const targets = new CombatTargetSystem();
  const health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  const resolver = new PlayerDamageResolver(health, equipment);
  const playerDamage = [];
  const system = new EnemySystem(targets, {
    health,
    getPosition() { return this.position; },
    position: { x: 1, y: 0, z: 0 },
    applyIncomingDamage(raw) { return resolver.applyRawDamage(raw); },
  }, {
    move(_enemy, position, displacement) {
      return { x: position.x + displacement.x, y: position.y + displacement.y, z: position.z + displacement.z };
    },
    remove() {},
  }, {
    onPlayerDamage(_enemy, result) { playerDamage.push(result); },
    onEnemyHit() {},
    onEnemyDeath() {},
  });
  const enemy = new RoamingZombie("armor-zombie", { x: 0, y: 0, z: 0 });
  system.register(enemy);
  return { system, enemy, health, equipment, resolver, playerDamage, player: system };
}

const impactTime = ROAMING_ZOMBIE_PROFILE.attackCycle * ROAMING_ZOMBIE_PROFILE.impactNormalizedTime;

// Armor 0 through full windup (baseline)
{
  const h = enemyHarness();
  h.system.update(0.001);
  h.system.update(impactTime + 0.001);
  assert.equal(h.health.currentHealth, 94);
  assert.equal(h.playerDamage[0].rawDamage, 6);
  assert.equal(h.playerDamage[0].finalDamage, 6);
  assert.equal(h.system.lastPlayerDamage, 6);
  assert.equal(h.system.lastPlayerRawDamage, 6);
  assert.equal(h.system.lastPlayerFinalDamage, 6);
}

// Armor 8 fixed
{
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const h = enemyHarness(equipment);
  h.system.update(0.001);
  h.system.update(impactTime + 0.001);
  assert.equal(h.health.currentHealth, 96);
  assert.equal(h.playerDamage[0].rawDamage, 6);
  assert.equal(h.playerDamage[0].armor, 8);
  assert.equal(h.playerDamage[0].finalDamage, 4);
  assert.equal(h.system.lastPlayerFinalDamage, 4);
}

// Impact-time: start bare, equip before impact → final 4
{
  const equipment = new PlayerEquipment();
  const h = enemyHarness(equipment);
  h.system.update(0.001);
  assert.equal(h.enemy.state, "attack");
  equipAllArmor(equipment);
  h.system.update(impactTime + 0.001);
  assert.equal(h.health.currentHealth, 96);
  assert.equal(h.playerDamage[0].finalDamage, 4);
  assert.equal(h.playerDamage[0].armor, 8);
}

// Impact-time: start armored, unequip before impact → final 6
{
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const h = enemyHarness(equipment);
  h.system.update(0.001);
  unequalAll(equipment);
  h.system.update(impactTime + 0.001);
  assert.equal(h.health.currentHealth, 94);
  assert.equal(h.playerDamage[0].finalDamage, 6);
  assert.equal(h.playerDamage[0].armor, 0);
}

// Two zombies independent final damage under full armor
{
  const equipment = new PlayerEquipment();
  equipAllArmor(equipment);
  const targets = new CombatTargetSystem();
  const health = new HealthPool(100);
  const resolver = new PlayerDamageResolver(health, equipment);
  const system = new EnemySystem(targets, {
    health,
    position: { x: 0, y: 0, z: 0 },
    getPosition() { return this.position; },
    applyIncomingDamage(raw) { return resolver.applyRawDamage(raw); },
  }, {
    move(_e, position, displacement) {
      return { x: position.x + displacement.x, y: position.y + displacement.y, z: position.z + displacement.z };
    },
    remove() {},
  }, {
    onPlayerDamage() {},
    onEnemyHit() {},
    onEnemyDeath() {},
  });
  system.register(new RoamingZombie("z-a", { x: -0.9, y: 0, z: 0 }));
  system.register(new RoamingZombie("z-b", { x: 0.9, y: 0, z: 0 }));
  system.update(0.001);
  system.update(impactTime + 0.001);
  assert.equal(health.currentHealth, 92);
}

// Enemy raw profile unchanged; fists on zombie still 6
assert.equal(ROAMING_ZOMBIE_PROFILE.damage, 6);
const fistZombie = new RoamingZombie("fists", { x: 0, y: 0, z: 0 });
for (let i = 0; i < 6; i += 1) fistZombie.receiveDamage(FISTS_COMBAT_PROFILE.damage);
assert.equal(fistZombie.health.currentHealth, 4);
assert.equal(fistZombie.receiveDamage(FISTS_COMBAT_PROFILE.damage).current, 0);
const dummy = new CombatDummy("d", { x: 0, y: 0, z: 0 });
assert.equal(dummy.health.maxHealth, 40);

// Boundary source checks
const mitigationSource = await readFile(new URL("../src/combat/ArmorMitigation.ts", import.meta.url), "utf8");
const resolverSource = await readFile(new URL("../src/combat/PlayerDamageResolver.ts", import.meta.url), "utf8");
const healthSource = await readFile(new URL("../src/combat/HealthPool.ts", import.meta.url), "utf8");
const enemySource = await readFile(new URL("../src/enemies/RoamingZombie.ts", import.meta.url), "utf8");
const systemSource = await readFile(new URL("../src/enemies/EnemySystem.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const equipmentTypes = await readFile(new URL("../src/equipment/EquipmentTypes.ts", import.meta.url), "utf8");
const itemSystem = await readFile(new URL("../src/items/ItemSystem.ts", import.meta.url), "utf8");
const harvestToolsSource = await readFile(new URL("../src/harvesting/InventoryHarvestTools.ts", import.meta.url), "utf8");

for (const source of [mitigationSource, resolverSource]) {
  for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement"]) {
    assert.equal(source.includes(forbidden), false, `pure armor domain must not depend on ${forbidden}`);
  }
}
assert.equal(mitigationSource.includes("PlayerEquipment"), false);
assert.equal(healthSource.includes("PlayerEquipment"), false);
assert.equal(healthSource.includes("ArmorMitigation"), false);
assert.equal(healthSource.includes("calculateArmorMitigatedDamage"), false);
assert.equal(enemySource.includes("PlayerEquipment"), false);
assert.equal(enemySource.includes("ArmorMitigation"), false);
assert.equal(enemySource.includes("calculateArmorMitigatedDamage"), false);
assert.equal(enemySource.includes("dad-hat"), false);
assert.equal(systemSource.includes("PlayerEquipment"), false);
assert.equal(systemSource.includes("calculateArmorMitigatedDamage"), false);
assert.equal(systemSource.includes("applyIncomingDamage"), true);
assert.equal(gameSource.includes("PlayerDamageResolver"), true);
assert.equal(gameSource.includes("damage.finalDamage"), true);
assert.equal(gameSource.includes("applyIncomingDamage"), true);
// Tool max/current durability is M13 harvest tooling; armor pieces must not wear.
for (const armorId of ["dad-hat", "shirt", "cargo-pants", "sneakers"]) {
  assert.equal(ITEM_REGISTRY.get(armorId).maxDurability, undefined, `${armorId} has no armor durability metadata`);
}
assert.equal(/durabilityLoss|broken|repairCost|repairKit/.test(itemSystem), false);
assert.equal(/durability|maxDurability|currentDurability/.test(equipmentTypes), false);
assert.equal(/tryConsumeDurability|currentDurability/.test(resolverSource), false);
assert.equal(/tryConsumeDurability|currentDurability/.test(mitigationSource), false);
assert.equal(harvestToolsSource.includes("consumeImpactUse"), true);
assert.equal(/weapon|tool|mainHand|offHand/.test(equipmentTypes), false);
for (const forbidden of ["armorPenetration", "damageType", "TrueDamage", "blockChance", "dodgeChance", "respawnPlayer", "enemyArmor"]) {
  assert.equal(mitigationSource.includes(forbidden) || resolverSource.includes(forbidden), false, `M11 scope excludes ${forbidden}`);
}

console.log("Armor verification passed (formula, equipment metadata, live equip, impact-time, integration, boundaries)");
