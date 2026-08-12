/**
 * Infection status + infectious hit rules.
 */
import assert from "node:assert/strict";
import {
  STATUS_EFFECT_DEFS,
  StatusEffectSystem,
} from "../src/status/StatusEffectSystem.ts";
import {
  canInfectFromArchetype,
  infectionChanceFromHit,
} from "../src/status/InfectionRules.ts";

assert.ok(STATUS_EFFECT_DEFS.infection);
assert.ok((STATUS_EFFECT_DEFS.infection.healthPerTick ?? 0) < 0);
assert.ok((STATUS_EFFECT_DEFS.infection.moveSpeedMul ?? 1) < 1);

assert.equal(canInfectFromArchetype("roaming-zombie"), true);
assert.equal(canInfectFromArchetype("toxic-mire"), true);
assert.equal(canInfectFromArchetype("stalker-night"), true);
assert.equal(canInfectFromArchetype("marauder-melee"), false);
assert.equal(canInfectFromArchetype("bandit-leader"), false);
assert.equal(canInfectFromArchetype("sniper-host"), false);

assert.equal(infectionChanceFromHit(20, false), 0);
assert.ok(infectionChanceFromHit(20, true) > infectionChanceFromHit(4, true));

const status = new StatusEffectSystem();
assert.equal(status.apply("infection"), true);
assert.equal(status.has("infection"), true);
assert.equal(status.apply("infection"), false);
assert.equal(status.has("infection"), true);

const tick = status.tick(1.05);
assert.ok(tick.healthDelta < 0);
assert.ok(tick.moveSpeedMul < 1);

assert.equal(status.remove("infection"), true);
assert.equal(status.has("infection"), false);

console.log("ok infection status");
