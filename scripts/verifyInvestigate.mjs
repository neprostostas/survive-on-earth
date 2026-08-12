/**
 * Investigate last-known walk when player is outside acquire but soft-aware.
 * Turning to face must NOT instantly FOV-spot (player beyond acquire range).
 * Hard lose-range still drops to idle (verifyEnemies).
 */
import assert from "node:assert/strict";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import {
  ENEMY_ALERT_AWARENESS,
  ENEMY_INVESTIGATE_SPEED_FRACTION,
  RoamingZombie,
} from "../src/enemies/RoamingZombie.ts";
import { PLAYER_HEALTH_CONFIG, ROAMING_ZOMBIE_PROFILE } from "../src/enemies/enemyConfig.ts";
import { EnemySystem } from "../src/enemies/EnemySystem.ts";
import { computeAwarenessMeter, idleEnemyNoticesPlayer } from "../src/enemies/enemyDetection.ts";

assert.ok(ENEMY_INVESTIGATE_SPEED_FRACTION > 0.5 && ENEMY_INVESTIGATE_SPEED_FRACTION < 1);

function harness(enemyPos = { x: 0, y: 0, z: 0 }, playerPos = { x: 10, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  const moves = [];
  const player = {
    position: { ...playerPos },
    health,
    getPosition() { return this.position; },
    applyIncomingDamage(raw) {
      const r = health.applyDamage(raw);
      return Object.freeze({
        rawDamage: raw,
        armor: 0,
        damageReduction: 0,
        finalDamage: r.applied > 0 ? r.requested : 0,
        previousHealth: r.before,
        currentHealth: r.current,
        becameDefeated: r.becameDead,
      });
    },
  };
  const system = new EnemySystem(targets, player, {
    move(_e, position, displacement) {
      moves.push({ ...displacement });
      return {
        x: position.x + displacement.x,
        y: position.y + displacement.y,
        z: position.z + displacement.z,
      };
    },
    remove() {},
  }, {
    onPlayerDamage() {},
    onEnemyHit() {},
    onEnemyDeath() {},
  });
  const enemy = new RoamingZombie("inv-zombie", enemyPos);
  system.register(enemy);
  return { system, player, enemy, moves };
}

function ahead(enemy, distance) {
  const p = enemy.getCombatPosition();
  const yaw = enemy.facingYaw;
  return { x: p.x + Math.sin(yaw) * distance, y: 0, z: p.z + Math.cos(yaw) * distance };
}

// Far-side noise: beyond acquire, loud burst/noise soft-awakens (not full instant chase).
// acquire=4; place at 4.6 with noise radius 4.4 → outside notice but soft horizon
{
  const acquire = ROAMING_ZOMBIE_PROFILE.acquireRange;
  const sample = {
    distance: 4.55,
    angleFromFacing: Math.PI / 2,
    sneaking: false,
    sprinting: false,
    acquireRange: acquire,
    playerNoiseRadius: 4.2,
  };
  assert.equal(idleEnemyNoticesPlayer(sample), false, "beyond acquire without burst-over-range");
  const meter = computeAwarenessMeter(sample);
  assert.ok(meter >= ENEMY_ALERT_AWARENESS || meter === 0, `meter ${meter}`);
  // If soft meter weak at this distance, still allow investigate via continuum below
}

// Ensure soft path can raise awareness slightly outside acquire when noise large
// After enemyDetection: distance > range*1.4 zeros out — 4*1.4=5.6 so 4.55 ok
// hear = 4.2, horizon = 4.2*1.65 ≈ 6.93, proximity = 1-4.55/6.93 ≈ 0.34 * 1.35 ≈ 0.46
{
  const meter = computeAwarenessMeter({
    distance: 4.55,
    angleFromFacing: Math.PI / 2,
    sneaking: false,
    sprinting: false,
    acquireRange: 4,
    playerNoiseRadius: 4.2,
  });
  assert.ok(meter >= ENEMY_ALERT_AWARENESS, `far soft meter ${meter}`);
}

const walk = harness();
// Place player far-side so facing noise won't FOV-spot (distance > acquire)
{
  const p = walk.enemy.getCombatPosition();
  const yaw = walk.enemy.facingYaw + Math.PI / 2;
  walk.player.position = {
    x: p.x + Math.sin(yaw) * 4.55,
    y: 0,
    z: p.z + Math.cos(yaw) * 4.55,
  };
}
const noise = { sneaking: false, sprinting: false, noiseRadius: 4.25, noiseLevel: 0.8 };
let sawAlert = false;
let sawInvestigate = false;
for (let i = 0; i < 40; i += 1) {
  walk.system.update(0.1, noise);
  if (walk.enemy.state === "alert") sawAlert = true;
  if (walk.enemy.state === "investigate") {
    sawInvestigate = true;
    break;
  }
  assert.notEqual(
    walk.enemy.state,
    "chase",
    `should not chase before investigate when outside acquire (t=${i} d=${walk.enemy.playerDistance.toFixed(2)})`,
  );
}
assert.ok(sawAlert, "alert first");
assert.ok(sawInvestigate, "then investigate");
assert.ok(walk.enemy.lastKnownPosition);

walk.moves.length = 0;
const before = { ...walk.enemy.getCombatPosition() };
const known = walk.enemy.lastKnownPosition;
walk.system.update(0.3, noise);
const after = walk.enemy.getCombatPosition();
const traveled = Math.hypot(after.x - before.x, after.z - before.z);
assert.ok(traveled > 0.08, `walk step ${traveled}`);
assert.ok(walk.moves.length > 0);
assert.ok(
  traveled <= ROAMING_ZOMBIE_PROFILE.moveSpeed * ENEMY_INVESTIGATE_SPEED_FRACTION * 0.3 + 0.06,
  "reduced investigate speed",
);
if (known) {
  assert.ok(
    Math.hypot(known.x - after.x, known.z - after.z)
      < Math.hypot(known.x - before.x, known.z - before.z),
    "closes last-known",
  );
}

// callToArms from investigate
if (walk.enemy.state === "investigate") {
  assert.equal(walk.enemy.callToArms(), true);
  assert.equal(walk.enemy.state, "chase");
}

// Front acquire = chase
const front = harness();
front.player.position = ahead(front.enemy, 2.5);
front.system.update(0.1);
assert.equal(front.enemy.state, "chase");

// Side close still insta-chase (standing hear)
const side = harness();
{
  const p = side.enemy.getCombatPosition();
  const yaw = side.enemy.facingYaw + Math.PI / 2;
  side.player.position = {
    x: p.x + Math.sin(yaw) * 1.2,
    y: 0,
    z: p.z + Math.cos(yaw) * 1.2,
  };
}
side.system.update(0.1, { sneaking: false, sprinting: false });
assert.equal(side.enemy.state, "chase");

// Lose → idle
const lose = harness();
lose.player.position = ahead(lose.enemy, 3.5);
lose.system.update(0.1);
assert.equal(lose.enemy.state, "chase");
lose.player.position = ahead(lose.enemy, 9.5);
lose.system.update(0.01);
assert.equal(lose.enemy.state, "idle");

console.log("verifyInvestigate: ok");
