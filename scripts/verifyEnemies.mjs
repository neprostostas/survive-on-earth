import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CombatDummy } from "../src/combat/CombatDummy.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { FISTS_COMBAT_PROFILE } from "../src/combat/combatConfig.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EnemySystem } from "../src/enemies/EnemySystem.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";
import { PLAYER_HEALTH_CONFIG, ROAMING_ZOMBIE_PROFILE } from "../src/enemies/enemyConfig.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { INVENTORY_CONFIG } from "../src/inventory/inventoryConfig.ts";
import { ITEM_REGISTRY } from "../src/items/ItemSystem.ts";

assert.equal(PLAYER_HEALTH_CONFIG.maxHealth, 100);
assert.equal(ROAMING_ZOMBIE_PROFILE.maxHealth, 40);
assert.equal(ROAMING_ZOMBIE_PROFILE.damage, 6);
assert.equal(ROAMING_ZOMBIE_PROFILE.moveSpeed, 1.6);
assert.equal(ROAMING_ZOMBIE_PROFILE.attacksPerSecond, 0.8);
assert.equal(ROAMING_ZOMBIE_PROFILE.attackCycle, 1 / 0.8);
assert.equal(ROAMING_ZOMBIE_PROFILE.impactNormalizedTime, 0.42);
assert.equal(ROAMING_ZOMBIE_PROFILE.acquireRange, 4);
assert.equal(ROAMING_ZOMBIE_PROFILE.loseRange, 8);
assert.equal(ROAMING_ZOMBIE_PROFILE.attackStartRange, 1.05);
assert.equal(ROAMING_ZOMBIE_PROFILE.hitRange, 1.15);
assert.equal(Object.isFrozen(ROAMING_ZOMBIE_PROFILE), true);

function harness(enemyPositions = [{ x: 0, y: 0, z: 0 }], playerPosition = { x: 10, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  const playerDamage = [];
  const enemyHits = [];
  const deaths = [];
  const removed = [];
  const movementCalls = [];
  const player = {
    position: { ...playerPosition },
    health,
    getPosition() { return this.position; },
    applyIncomingDamage(rawDamage) {
      const result = health.applyDamage(rawDamage);
      return Object.freeze({
        rawDamage,
        armor: 0,
        damageReduction: 0,
        finalDamage: result.applied > 0 ? result.requested : 0,
        previousHealth: result.before,
        currentHealth: result.current,
        becameDefeated: result.becameDead,
      });
    },
  };
  const system = new EnemySystem(targets, player, {
    move(enemy, position, displacement) {
      movementCalls.push({ enemy, position: { ...position }, displacement: { ...displacement } });
      return { x: position.x + displacement.x, y: position.y + displacement.y, z: position.z + displacement.z };
    },
    remove(enemy) { removed.push(enemy.combatId); },
  }, {
    onPlayerDamage(enemy, result) { playerDamage.push({ enemy, result }); },
    onEnemyHit(enemy, result) { enemyHits.push({ enemy, result }); },
    onEnemyDeath(enemy) { deaths.push(enemy.combatId); },
  });
  const enemies = enemyPositions.map((position, index) => new RoamingZombie(`roaming-zombie-${String(index + 1).padStart(2, "0")}`, position));
  for (const enemy of enemies) system.register(enemy);
  return { targets, player, system, enemies, movementCalls, removed, playerDamage, enemyHits, deaths };
}

const playerHealth = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
assert.deepEqual(playerHealth.getSnapshot(), { maxHealth: 100, currentHealth: 100, alive: true, dead: false });
assert.equal(playerHealth.applyDamage(6).current, 94);
assert.equal(playerHealth.applyDamage(6).current, 88);
playerHealth.applyDamage(84);
const playerLethal = playerHealth.applyDamage(6);
assert.equal(playerLethal.before, 4);
assert.equal(playerLethal.current, 0);
assert.equal(playerLethal.becameDead, true);
assert.equal(playerHealth.applyDamage(6).becameDead, false);

const idle = harness();
idle.system.update(0.5);
assert.equal(idle.enemies[0].state, "idle");
assert.equal(idle.movementCalls.length, 0);
idle.player.position = { x: 3.5, y: 0, z: 0 };
idle.system.update(0.1);
assert.equal(idle.enemies[0].state, "chase", "entering acquire range deterministically starts chase");
idle.player.position = { x: 5.5, y: 0, z: 0 };
idle.system.update(0.01);
assert.equal(idle.enemies[0].state, "chase", "aggro persists beyond acquire range but inside lose range");
idle.player.position = { x: 9.5, y: 0, z: 0 };
idle.system.update(0.01);
assert.equal(idle.enemies[0].state, "idle", "lose range ends aggro without returning home");

const provoked = harness([{ x: 0, y: 0, z: 0 }], { x: 5, y: 0, z: 0 });
const provokeDamage = provoked.enemies[0].receiveDamage(6);
provoked.system.handlePlayerCombatImpact(provoked.enemies[0], provokeDamage);
provoked.system.update(0.1);
assert.equal(provoked.enemies[0].state, "chase", "surviving positive damage provokes outside acquire range");

const chase = harness([{ x: 0, y: 0, z: 0 }], { x: 3, y: 0, z: 0 });
chase.system.update(0.5);
assert.equal(chase.enemies[0].getCombatPosition().x, 0.8);
assert.equal(chase.enemies[0].getCombatPosition().z, 0);
assert.equal(chase.movementCalls[0].displacement.x, ROAMING_ZOMBIE_PROFILE.moveSpeed * 0.5);

const attack = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
attack.system.update(0.01);
assert.equal(attack.enemies[0].state, "attack");
assert.equal(attack.movementCalls.length, 0, "attack start cannot slide enemy into Player");
const enemyImpactTime = ROAMING_ZOMBIE_PROFILE.attackCycle * ROAMING_ZOMBIE_PROFILE.impactNormalizedTime;
attack.system.update(enemyImpactTime - 0.001);
assert.equal(attack.player.health.currentHealth, 100, "enemy damage does not happen at attack start");
attack.system.update(0.002);
assert.equal(attack.player.health.currentHealth, 94);
assert.equal(attack.playerDamage.length, 1);
assert.equal(attack.enemies[0].state, "recovery");
attack.system.update(0.2);
assert.equal(attack.player.health.currentHealth, 94, "one attack cannot impact twice");
assert.equal(attack.movementCalls.length, 0, "enemy remains position-stable through recovery");

const largeDelta = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
largeDelta.system.update(0.001);
largeDelta.system.update(ROAMING_ZOMBIE_PROFILE.attackCycle * 2);
assert.equal(largeDelta.player.health.currentHealth, 94, "large delta still creates at most one impact");

const cadence = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
cadence.system.update(0.001);
cadence.system.update(enemyImpactTime);
assert.equal(cadence.player.health.currentHealth, 94);
cadence.system.update(ROAMING_ZOMBIE_PROFILE.attackCycle - enemyImpactTime - 0.001);
assert.equal(cadence.player.health.currentHealth, 94);
cadence.system.update(0.002);
cadence.system.update(0.001);
assert.equal(cadence.enemies[0].state, "attack", "new cycle starts only after derived 1/0.8 cadence");

const miss = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
miss.system.update(0.001);
miss.player.position = { x: 3, y: 0, z: 0 };
miss.system.update(enemyImpactTime + 0.001);
assert.equal(miss.player.health.currentHealth, 100);
assert.equal(miss.enemies[0].lastAttackResult, "miss");

const deadAttacker = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
deadAttacker.system.update(0.001);
const killedDuringWindup = deadAttacker.enemies[0].receiveDamage(100);
assert.equal(deadAttacker.system.handlePlayerCombatImpact(deadAttacker.enemies[0], killedDuringWindup), true);
deadAttacker.system.update(enemyImpactTime + 0.01);
assert.equal(deadAttacker.player.health.currentHealth, 100, "dead enemy cannot produce a pending phantom impact");
assert.equal(deadAttacker.targets.isRegistered(deadAttacker.enemies[0]), false);
assert.deepEqual(deadAttacker.removed, ["roaming-zombie-01"]);
assert.deepEqual(deadAttacker.deaths, ["roaming-zombie-01"]);
assert.equal(deadAttacker.system.handlePlayerCombatImpact(deadAttacker.enemies[0], killedDuringWindup), false, "death cleanup cannot run twice");

const fistTarget = new RoamingZombie("roaming-zombie-fists", { x: 0, y: 0, z: 0 });
for (let hit = 0; hit < 6; hit += 1) fistTarget.receiveDamage(FISTS_COMBAT_PROFILE.damage);
assert.equal(fistTarget.health.currentHealth, 4);
assert.equal(fistTarget.isCombatAlive(), true);
assert.equal(fistTarget.receiveDamage(FISTS_COMBAT_PROFILE.damage).current, 0);
assert.equal(fistTarget.state, "dead");

const passiveDummy = new CombatDummy("passive-dummy", { x: 0, y: 0, z: 0 });
assert.equal("state" in passiveDummy, false);
assert.equal("update" in passiveDummy, false);
assert.equal("isAggressive" in passiveDummy, false, "Combat Dummy remains passive CombatTarget, not Enemy");

const multiple = harness([{ x: -0.9, y: 0, z: 0 }, { x: 0.9, y: 0, z: 0 }], { x: 0, y: 0, z: 0 });
multiple.system.update(0.001);
multiple.system.update(enemyImpactTime + 0.001);
assert.equal(multiple.player.health.currentHealth, 88, "independent simultaneous Zombie impacts both apply 6 damage");
assert.equal(multiple.playerDamage.length, 2);

const defeat = harness([{ x: 0, y: 0, z: 0 }], { x: 1, y: 0, z: 0 });
defeat.player.health.applyDamage(96);
defeat.system.update(0.001);
defeat.system.update(enemyImpactTime + 0.001);
assert.equal(defeat.player.health.currentHealth, 0);
assert.equal(defeat.system.playerDefeatTransitions, 1);
defeat.system.update(ROAMING_ZOMBIE_PROFILE.attackCycle * 3);
assert.equal(defeat.player.health.currentHealth, 0);
assert.equal(defeat.playerDamage.length, 1);
assert.equal(defeat.enemies[0].state, "idle", "enemies disengage from defeated Player");

assert.equal(ITEM_REGISTRY.getAll().length, 8);
assert.equal(CRAFTING_RECIPES.getAll().length, 2);
assert.equal(INVENTORY_CONFIG.baseSlotCount, 10);
assert.deepEqual(EQUIPMENT_SLOT_IDS, ["head", "torso", "legs", "feet"]);
assert.equal(["dad-hat", "shirt", "cargo-pants", "sneakers"].reduce((total, itemId) => total + ITEM_REGISTRY.get(itemId).equipment.armor, 0), 8);
assert.equal(attack.playerDamage[0].result.rawDamage, 6, "enemy delivers raw damage 6");
assert.equal(attack.playerDamage[0].result.finalDamage, 6, "armor 0 leaves final damage equal to raw");
assert.equal(attack.playerDamage[0].result.becameDefeated, false);

const enemySource = await readFile(new URL("../src/enemies/RoamingZombie.ts", import.meta.url), "utf8");
const systemSource = await readFile(new URL("../src/enemies/EnemySystem.ts", import.meta.url), "utf8");
const configSource = await readFile(new URL("../src/enemies/enemyConfig.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const hudSource = await readFile(new URL("../src/ui/HUD.ts", import.meta.url), "utf8");
const interactionSource = await readFile(new URL("../src/interaction/InteractionSystem.ts", import.meta.url), "utf8");
const targetContract = await readFile(new URL("../src/combat/CombatTarget.ts", import.meta.url), "utf8");
const equipmentSource = await readFile(new URL("../src/equipment/EquipmentTypes.ts", import.meta.url), "utf8");
const harvestToolsSource = await readFile(new URL("../src/harvesting/InventoryHarvestTools.ts", import.meta.url), "utf8");

for (const source of [enemySource, systemSource, configSource]) {
  for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "ITEM_ICONS", "CraftingSystem", "GroundLoot", "InventoryPanel", "PlayerEquipment"]) {
    assert.equal(source.includes(forbidden), false, `pure enemy domain must not depend on ${forbidden}`);
  }
}
assert.equal(enemySource.includes("setTimeout"), false);
assert.equal(enemySource.includes("setInterval"), false);
assert.equal(enemySource.includes("Math.random"), false);
assert.equal(interactionSource.includes("RoamingZombie"), false);
assert.equal(targetContract.includes("chase"), false);
assert.equal(targetContract.includes("attackPlayer"), false);
assert.equal(gameSource.includes("this.enemies.update(frameDelta)"), true, "enemy world update uses F3-compatible game delta independently of panels");
assert.equal(gameSource.indexOf("this.combat.update(delta)" ) < gameSource.indexOf("this.enemies.update(frameDelta)"), true, "player melee resolves before enemy AI to prevent phantom hits");
assert.equal(gameSource.includes("this.player.health.alive && attackPressed"), true);
assert.equal(gameSource.includes("this.player.health.alive && this.combat.state"), true);
assert.equal(gameSource.includes("this.inventoryPanel.close()"), true);
assert.equal(gameSource.includes("this.craftingPanel.close()"), true);
assert.equal((gameSource.match(/new RoamingZombie/g) ?? []).length, 1);
assert.equal((gameSource.match(/Object\.freeze\(\{ x: -?[\d.]+, y: 0, z: -?[\d.]+ \}\)/g) ?? []).length >= 6, true, "M09 dummies plus three fixed Zombie spawns remain deterministic");
assert.equal(hudSource.includes("setPlayerHealth"), true);
assert.equal(hudSource.includes("PLAYER DEFEATED"), true);
assert.equal(/weapon|tool|mainHand|offHand/.test(equipmentSource), false);
assert.equal(/durability/.test(harvestToolsSource), false);
for (const forbidden of ["FastBiter", "FloaterBloater", "ToxicSpitter", "lootTable", "experiencePoints", "respawnPlayer", "navmesh", "pathfinding", "healthRegeneration", "armorMitigation"]) {
  assert.equal(enemySource.includes(forbidden) || systemSource.includes(forbidden) || configSource.includes(forbidden), false, `M10 scope excludes ${forbidden}`);
}

console.log("Enemy verification passed (profile, health, AI, attacks, defeat, targeting, and boundaries)");
