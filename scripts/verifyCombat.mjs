import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { CombatDummy } from "../src/combat/CombatDummy.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { MeleeCombatSystem } from "../src/combat/MeleeCombatSystem.ts";
import { COMBAT_CONFIG, FISTS_COMBAT_PROFILE } from "../src/combat/combatConfig.ts";
import { CRAFTING_RECIPES } from "../src/crafting/CraftingRecipeRegistry.ts";
import { EQUIPMENT_SLOT_IDS } from "../src/equipment/EquipmentTypes.ts";
import { isIntentionalAttackKey } from "../src/input/attackInputRules.ts";
import { ITEM_REGISTRY } from "../src/items/ItemSystem.ts";

assert.equal(FISTS_COMBAT_PROFILE.damage, 6);
assert.equal(FISTS_COMBAT_PROFILE.attacksPerSecond, 1.8);
assert.equal(FISTS_COMBAT_PROFILE.cycleDuration, 1 / 1.8);
assert.equal(FISTS_COMBAT_PROFILE.impactNormalizedTime, 0.38);
assert.equal(COMBAT_CONFIG.dummyMaxHealth, 40);
assert.equal(COMBAT_CONFIG.meleeHitRange, 1.15);
assert.equal(COMBAT_CONFIG.targetAcquisitionRange, 2.2);
assert.equal(Object.isFrozen(FISTS_COMBAT_PROFILE), true);
assert.equal(Object.isFrozen(COMBAT_CONFIG), true);

const health = new HealthPool(40);
assert.deepEqual(health.getSnapshot(), { maxHealth: 40, currentHealth: 40, alive: true, dead: false });
assert.equal(Object.isFrozen(health.getSnapshot()), true);
let healthNotifications = 0;
health.subscribe(() => { healthNotifications += 1; });
let damage = health.applyDamage(6);
assert.deepEqual(damage, { requested: 6, applied: 6, before: 40, current: 34, becameDead: false });
assert.equal(healthNotifications, 1);
damage = health.applyDamage(100);
assert.equal(damage.current, 0);
assert.equal(damage.applied, 34);
assert.equal(damage.becameDead, true);
assert.equal(health.dead, true);
assert.equal(health.currentHealth, 0);
assert.equal(healthNotifications, 2);
damage = health.applyDamage(6);
assert.equal(damage.applied, 0);
assert.equal(damage.becameDead, false);
assert.equal(health.currentHealth, 0);
assert.equal(healthNotifications, 2, "dead health cannot emit a duplicate death transition");
assert.throws(() => new HealthPool(0), RangeError);
assert.throws(() => health.applyDamage(-1), RangeError);

const freshDummy = new CombatDummy("dummy-health", { x: 0, y: 0, z: 0 });
assert.equal(freshDummy.health.maxHealth, 40);
for (let hit = 0; hit < 6; hit += 1) freshDummy.receiveDamage(FISTS_COMBAT_PROFILE.damage);
assert.equal(freshDummy.health.currentHealth, 4);
assert.equal(freshDummy.isCombatAlive(), true);
const lethal = freshDummy.receiveDamage(FISTS_COMBAT_PROFILE.damage);
assert.equal(lethal.applied, 4);
assert.equal(lethal.becameDead, true);
assert.equal(freshDummy.health.currentHealth, 0);
assert.equal(freshDummy.isCombatAlive(), false, "fresh Combat Dummy dies on exactly the seventh fist impact");
assert.equal(freshDummy.receiveDamage(6).applied, 0);

const origin = Object.freeze({ x: 0, y: 0, z: 0 });
const none = new CombatTargetSystem();
assert.equal(none.update(origin), null);
assert.equal(none.state.targetId, null);

const one = new CombatTargetSystem();
const oneDummy = new CombatDummy("dummy-one", { x: 1, y: 0, z: 0 });
one.register(oneDummy);
assert.equal(one.update(origin), oneDummy);
assert.equal(one.state.candidateCount, 1);
assert.equal(one.state.distance, 1);
assert.equal(one.isRegistered(oneDummy), true);

const nearestSystem = new CombatTargetSystem();
const far = new CombatDummy("dummy-far", { x: 2, y: 0, z: 0 });
const near = new CombatDummy("dummy-near", { x: 0.8, y: 0, z: 0 });
nearestSystem.register(far);
nearestSystem.register(near);
assert.equal(nearestSystem.update(origin), near, "nearest alive target wins");
near.receiveDamage(100);
assert.equal(nearestSystem.update(origin), far, "dead target is excluded immediately on selection update");
assert.equal(nearestSystem.unregister(far), true);
assert.equal(nearestSystem.current, null, "removed current target invalidates immediately");
assert.equal(nearestSystem.update(origin), null);

const rangeSystem = new CombatTargetSystem();
const outside = new CombatDummy("dummy-outside", { x: COMBAT_CONFIG.targetAcquisitionRange + 0.01, y: 0, z: 0 });
rangeSystem.register(outside);
assert.equal(rangeSystem.update(origin), null, "out-of-acquisition-range target is excluded");

for (let run = 0; run < 5; run += 1) {
  const tie = new CombatTargetSystem();
  const b = new CombatDummy("dummy-b", { x: -1, y: 0, z: 0 });
  const a = new CombatDummy("dummy-a", { x: 1, y: 0, z: 0 });
  tie.register(b);
  tie.register(a);
  assert.equal(tie.update(origin), a, "equal-distance tie resolves by runtime ID every run");
}

function combatHarness(targetPosition = { x: 0.8, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const target = new CombatDummy("dummy-attack", targetPosition);
  targets.register(target);
  const player = {
    position: { x: 0, y: 0, z: 0 },
    faced: null,
    poses: [],
    clears: 0,
    getCombatPosition() { return this.position; },
    faceCombatTarget(position) { this.faced = position; },
    applyFistAttackPose(progress, fist) { this.poses.push({ progress, fist }); },
    clearFistAttackPose() { this.clears += 1; },
  };
  let beforeCount = 0;
  const impacts = [];
  const combat = new MeleeCombatSystem(targets, player, () => { beforeCount += 1; }, (impact) => { impacts.push(impact); });
  targets.update(player.position);
  return { targets, target, player, impacts, combat, get beforeCount() { return beforeCount; } };
}

const basic = combatHarness();
assert.equal(basic.combat.state, "ready");
assert.equal(basic.combat.requestAttack(), "started");
assert.equal(basic.beforeCount, 1, "accepted attack invokes existing-action cancellation hook once");
assert.equal(basic.combat.state, "attacking");
assert.equal(basic.combat.movementCommitted, true);
assert.equal(basic.player.faced, basic.target.getCombatPosition());
assert.equal(basic.target.health.currentHealth, 40, "damage does not happen on button press");
assert.equal(basic.combat.requestAttack(), "cooldown", "overlapping attack is rejected");
const impactTime = FISTS_COMBAT_PROFILE.cycleDuration * FISTS_COMBAT_PROFILE.impactNormalizedTime;
basic.combat.update(impactTime - 0.001);
assert.equal(basic.target.health.currentHealth, 40);
assert.equal(basic.combat.movementCommitted, true);
basic.combat.update(0.002);
assert.equal(basic.target.health.currentHealth, 34);
assert.equal(basic.impacts.length, 1);
assert.equal(basic.combat.impactCount, 1);
assert.equal(basic.combat.state, "recovery");
assert.equal(basic.combat.movementCommitted, false, "locomotion commitment ends at impact");
basic.combat.update(0.1);
assert.equal(basic.target.health.currentHealth, 34, "later frames cannot repeat the same impact");
basic.combat.update(FISTS_COMBAT_PROFILE.cycleDuration);
assert.equal(basic.combat.state, "ready");
assert.equal(basic.player.clears, 1);

const largeDelta = combatHarness();
largeDelta.combat.requestAttack();
largeDelta.combat.update(FISTS_COMBAT_PROFILE.cycleDuration * 2);
assert.equal(largeDelta.target.health.currentHealth, 34);
assert.equal(largeDelta.impacts.length, 1, "crossing impact and recovery in one update still applies damage once");
assert.equal(largeDelta.combat.state, "ready");

const cadence = combatHarness();
assert.equal(cadence.combat.requestAttack(), "started");
cadence.combat.update(FISTS_COMBAT_PROFILE.cycleDuration - 0.001);
assert.equal(cadence.combat.requestAttack(), "cooldown");
cadence.combat.update(0.002);
assert.equal(cadence.combat.requestAttack(), "started", "next attack can start only after the full derived cycle");

const outOfRange = combatHarness({ x: 1.5, y: 0, z: 0 });
assert.equal(outOfRange.targets.current, outOfRange.target, "target may be acquired outside hit range");
assert.equal(outOfRange.combat.requestAttack(), "out-of-range");
assert.equal(outOfRange.target.health.currentHealth, 40);
assert.equal(outOfRange.beforeCount, 0);
assert.deepEqual(outOfRange.player.position, { x: 0, y: 0, z: 0 }, "out-of-range attack cannot auto-move or teleport player");
assert.equal(outOfRange.combat.requestAttack(true), "blocked-by-ui");

const deadBeforeImpact = combatHarness();
deadBeforeImpact.combat.requestAttack();
deadBeforeImpact.target.receiveDamage(100);
deadBeforeImpact.targets.unregister(deadBeforeImpact.target);
deadBeforeImpact.combat.update(impactTime + 0.01);
assert.equal(deadBeforeImpact.impacts.length, 0);
assert.equal(deadBeforeImpact.target.health.currentHealth, 0);

const lockTargets = new CombatTargetSystem();
const lockA = new CombatDummy("dummy-a", { x: 0.8, y: 0, z: 0 });
const lockB = new CombatDummy("dummy-b", { x: -0.9, y: 0, z: 0 });
lockTargets.register(lockA);
lockTargets.register(lockB);
const lockPlayer = {
  position: { x: 0, y: 0, z: 0 }, poses: [],
  getCombatPosition() { return this.position; }, faceCombatTarget() {},
  applyFistAttackPose(progress, fist) { this.poses.push({ progress, fist }); }, clearFistAttackPose() {},
};
const lockImpacts = [];
const lockCombat = new MeleeCombatSystem(lockTargets, lockPlayer, () => {}, (impact) => { lockImpacts.push(impact); });
assert.equal(lockTargets.update(lockPlayer.position), lockA);
lockCombat.requestAttack();
lockPlayer.position = { x: -0.2, y: 0, z: 0 };
assert.equal(lockTargets.update(lockPlayer.position), lockB, "selector may change while swing is active");
lockCombat.update(impactTime + 0.01);
assert.equal(lockImpacts[0].target, lockA, "impact remains locked to target captured at attack start");
assert.equal(lockA.health.currentHealth, 34);
assert.equal(lockB.health.currentHealth, 40);

const alternating = combatHarness();
alternating.combat.requestAttack();
assert.equal(alternating.player.poses[0].fist, "right");
alternating.combat.update(FISTS_COMBAT_PROFILE.cycleDuration);
alternating.targets.update(alternating.player.position);
alternating.combat.requestAttack();
assert.equal(alternating.player.poses.at(-1).fist, "left");

const kill = combatHarness();
let deaths = 0;
for (let hit = 0; hit < 7; hit += 1) {
  kill.targets.update(kill.player.position);
  assert.equal(kill.combat.requestAttack(), "started");
  kill.combat.update(FISTS_COMBAT_PROFILE.cycleDuration);
  if (kill.target.health.dead && kill.targets.unregister(kill.target)) deaths += 1;
}
assert.equal(kill.target.health.currentHealth, 0);
assert.equal(kill.combat.impactCount, 7);
assert.equal(deaths, 1);
assert.equal(kill.targets.current, null);
assert.equal(kill.target.receiveDamage(6).applied, 0);

assert.equal(isIntentionalAttackKey("KeyF", false, true), true);
assert.equal(isIntentionalAttackKey("KeyF", true, true), false, "OS key repeat cannot generate attacks");
assert.equal(isIntentionalAttackKey("KeyF", false, false), false, "suppressed UI input cannot generate attacks");
assert.equal(isIntentionalAttackKey("Space", false, true), false);

assert.equal(ITEM_REGISTRY.getAll().length, 8);
assert.equal(ITEM_REGISTRY.has("fists"), false, "Fists are an implicit combat profile, not an ItemDefinition");
assert.deepEqual(EQUIPMENT_SLOT_IDS, ["head", "torso", "legs", "feet"]);
assert.equal(CRAFTING_RECIPES.getAll().length, 2);
assert.deepEqual(CRAFTING_RECIPES.get("hatchet").ingredients, [{ itemId: "pine-log", quantity: 3 }, { itemId: "limestone", quantity: 3 }]);
assert.deepEqual(CRAFTING_RECIPES.get("pickaxe").ingredients, [{ itemId: "pine-log", quantity: 3 }, { itemId: "limestone", quantity: 3 }]);

const healthSource = await readFile(new URL("../src/combat/HealthPool.ts", import.meta.url), "utf8");
const targetSource = await readFile(new URL("../src/combat/CombatTargetSystem.ts", import.meta.url), "utf8");
const meleeSource = await readFile(new URL("../src/combat/MeleeCombatSystem.ts", import.meta.url), "utf8");
const interactionSource = await readFile(new URL("../src/interaction/InteractionSystem.ts", import.meta.url), "utf8");
const gameSource = await readFile(new URL("../src/app/Game.ts", import.meta.url), "utf8");
const hudSource = await readFile(new URL("../src/ui/HUD.ts", import.meta.url), "utf8");
const inputSource = await readFile(new URL("../src/input/InputController.ts", import.meta.url), "utf8");
const keyboardSource = await readFile(new URL("../src/input/KeyboardInput.ts", import.meta.url), "utf8");
const pointerSource = await readFile(new URL("../src/input/PrimaryActionInput.ts", import.meta.url), "utf8");
const debugSource = await readFile(new URL("../src/debug/DebugOverlay.ts", import.meta.url), "utf8");
const equipmentSource = await readFile(new URL("../src/equipment/EquipmentTypes.ts", import.meta.url), "utf8");
const prototypeSource = await readFile(new URL("../src/harvesting/PrototypeToolLoadout.ts", import.meta.url), "utf8");

for (const source of [healthSource, targetSource, meleeSource]) {
  for (const forbidden of ["@babylonjs", "document", "window", "HTMLElement", "PlayerInventory", "CraftingSystem", "PlayerEquipment", "GroundLoot", "InteractionSystem"]) {
    assert.equal(source.includes(forbidden), false, `pure combat domain must not depend on ${forbidden}`);
  }
}
assert.equal(targetSource.includes("Math.random"), false);
assert.equal(targetSource.includes("combatId.localeCompare"), true, "runtime ID must break equal-distance ties");
assert.equal(interactionSource.includes("CombatTarget"), false, "InteractionSystem must remain contextual-interaction-only");
assert.equal(meleeSource.includes("InteractionSystem"), false, "combat must not use contextual target truth");
assert.equal(gameSource.includes("new CombatDummy"), true);
assert.equal((gameSource.match(/Object\.freeze\(\{ x: [\d.]+, y: 0, z: [\d.]+ \}\)/g) ?? []).length >= 3, true, "three deterministic dummy fixture positions must exist");
assert.equal(gameSource.includes("this.harvesting.cancel()"), true, "accepted combat start must reuse harvesting cancellation");
assert.equal(gameSource.includes("this.collision.remove(`CombatTarget:"), true, "lethal hit must remove dummy collision");
assert.equal(gameSource.includes("this.combatTargets.unregister(target)"), true, "lethal hit must unregister once");
assert.equal(hudSource.includes('class="action attack-action"'), true, "existing Attack shell must become active");
assert.equal(hudSource.includes("setAttackState"), true);
assert.equal(inputSource.includes("consumeAttackPressed"), true);
assert.equal(keyboardSource.includes("isIntentionalAttackKey"), true);
assert.equal(pointerSource.includes("setInterval"), false, "holding HUD Attack cannot auto-generate requests");
assert.equal(pointerSource.includes("this.pointerId !== null"), true, "one pointer hold queues at most one press");
assert.equal(debugSource.includes('"COMBAT"'), true);
assert.equal(/weapon|tool|mainHand|offHand/.test(equipmentSource), false, "equipment slots remain armor-only");
assert.equal(prototypeSource.includes("durability"), false);
assert.equal(meleeSource.includes("hatchet"), false);
assert.equal(meleeSource.includes("pickaxe"), false);
assert.equal(/critical|sneak|combo|autoAttack|enemyAI|pathfinding|playerDamage|lootTable/i.test(meleeSource), false, "M09 melee domain must stay unarmed and deterministic");

console.log("Combat verification passed (health, targeting, timing, locking, input, and boundaries)");
