/**
 * Home defense horde domain.
 */
import assert from "node:assert/strict";
import { HordeController } from "../src/combat/HordeController.ts";
import {
  HOME_GATE_DEFENSE,
  homeDefenseSpawnPoint,
  isHomeDefenseContractHint,
} from "../src/combat/HomeDefense.ts";

assert.equal(isHomeDefenseContractHint("home"), true);
assert.equal(isHomeDefenseContractHint("Hold the Gate"), true);
assert.equal(isHomeDefenseContractHint("coastal-power-plant"), false);

const p0 = homeDefenseSpawnPoint(0);
assert.ok(Math.hypot(p0.x, p0.z) >= 11);

const horde = new HordeController();
assert.equal(horde.state, "idle");
horde.start(HOME_GATE_DEFENSE);
assert.equal(horde.active, true);
const wave1 = horde.tick(0);
assert.equal(wave1.length, 3);
assert.equal(wave1[0], "shambler");

// Defeat first wave
for (let i = 0; i < 3; i += 1) horde.onEnemyDefeated();
assert.equal(horde.state, "between");
// Advance delay into wave 2
const mid = horde.tick(6.1);
assert.equal(mid.length, 2);
assert.equal(mid[0], "runner-infected");
for (let i = 0; i < 2; i += 1) horde.onEnemyDefeated();
assert.equal(horde.state, "between");
const last = horde.tick(8.1);
assert.equal(last.length, 2);
for (let i = 0; i < 2; i += 1) horde.onEnemyDefeated();
assert.equal(horde.state, "complete");
assert.equal(HOME_GATE_DEFENSE.waves.length, 3);

console.log("ok home defense horde waves");
