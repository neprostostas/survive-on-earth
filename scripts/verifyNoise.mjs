/**
 * Domain tests: player noise gait/bursts + expanded enemy hearing.
 */
import assert from "node:assert/strict";
import { EnemySystem } from "../src/enemies/EnemySystem.ts";
import {
  ENEMY_WALK_HEAR_RANGE_FRACTION,
  effectiveHearRange,
  idleEnemyNoticesPlayer,
} from "../src/enemies/enemyDetection.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";
import { PLAYER_HEALTH_CONFIG, ROAMING_ZOMBIE_PROFILE } from "../src/enemies/enemyConfig.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { PlayerNoiseSystem } from "../src/player/PlayerNoiseSystem.ts";

const noise = new PlayerNoiseSystem();
noise.setLocomotion({ moving: false, sneaking: false, sprinting: false });
noise.tick(0.1);
assert.ok(noise.level < 0.15, "idle footfalls nearly silent");
assert.ok(noise.hearRadius < 1.2, "idle hear radius is tight");

noise.setLocomotion({ moving: true, sneaking: false, sprinting: false });
noise.tick(0.1);
const walkR = noise.hearRadius;
assert.ok(walkR >= 1.5 && walkR <= 2.2, `walk radius ~1.7 got ${walkR}`);

noise.setLocomotion({ moving: true, sneaking: false, sprinting: true });
noise.tick(0.1);
const sprintR = noise.hearRadius;
assert.ok(sprintR >= 3.5, `sprint louder than walk: ${sprintR}`);

noise.setLocomotion({ moving: true, sneaking: true, sprinting: true });
noise.tick(0.1);
assert.ok(noise.hearRadius < 1.0, "sneak gait is near silence");
assert.ok(noise.level < 0.2, "sneak level low");

noise.setLocomotion({ moving: false, sneaking: false, sprinting: false });
noise.tick(0.1);
noise.emitBurst("melee");
assert.ok(noise.level >= 0.8, "melee spike is loud");
assert.ok(noise.hearRadius > 4.5, `melee spike expands radius: ${noise.hearRadius}`);
noise.tick(1.5);
assert.ok(noise.level < 0.2, "burst decays within ~1.5s");

// Detection: burst beyond acquire can wake if radius covers (≤1.35× acquire)
const acquire = ROAMING_ZOMBIE_PROFILE.acquireRange; // 4
const farBurstSample = {
  distance: 5.1,
  angleFromFacing: Math.PI / 2,
  sneaking: false,
  sprinting: false,
  acquireRange: acquire,
  playerNoiseRadius: 5.3,
};
assert.equal(idleEnemyNoticesPlayer(farBurstSample), true, "melee-range noise wakes beyond acquire");
assert.equal(
  idleEnemyNoticesPlayer({ ...farBurstSample, distance: 5.6 }),
  false,
  "cap at 1.35× acquire (~5.4)",
);
assert.equal(
  idleEnemyNoticesPlayer({ ...farBurstSample, sneaking: true }),
  false,
  "sneak silences bursts too",
);

// Legacy side-walk without noise field still acquires near
const sideClose = {
  distance: 1.2,
  angleFromFacing: Math.PI / 2,
  sneaking: false,
  sprinting: false,
  acquireRange: acquire,
};
assert.equal(idleEnemyNoticesPlayer(sideClose), true);
assert.ok(effectiveHearRange(sideClose) >= acquire * ENEMY_WALK_HEAR_RANGE_FRACTION);

// Soft alert then full chase when radius reaches
function harness() {
  const targets = new CombatTargetSystem();
  const health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  const player = {
    position: { x: 10, y: 0, z: 0 },
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
    move(enemy, position, displacement) {
      return { x: position.x + displacement.x, y: position.y + displacement.y, z: position.z + displacement.z };
    },
    remove() {},
  }, {
    onPlayerDamage() {},
    onEnemyHit() {},
    onEnemyDeath() {},
  });
  const enemy = new RoamingZombie("noise-zombie-01", { x: 0, y: 0, z: 0 });
  system.register(enemy);
  return { player, system, enemy };
}

const h = harness();
// Side at 3.0 — outside walk hear (~1.68) but not front vision
const yaw = h.enemy.facingYaw + Math.PI / 2;
const ep = h.enemy.getCombatPosition();
h.player.position = { x: ep.x + Math.sin(yaw) * 3.0, y: 0, z: ep.z + Math.cos(yaw) * 3.0 };
h.system.update(0.1, { sneaking: false, sprinting: false, noiseRadius: 0 });
assert.equal(h.enemy.state, "idle", "quiet side mid-range stays idle");
h.system.update(0.1, { sneaking: false, sprinting: false, noiseRadius: 3.2 });
assert.equal(h.enemy.state, "chase", "expanded walk/sprint-style noise chases at 3m side");

const threat = harness();
assert.equal(threat.system.peakThreatLevel(), 0);
threat.player.position = { x: ep.x + Math.sin(threat.enemy.facingYaw) * 2.5, y: 0, z: ep.z + Math.cos(threat.enemy.facingYaw) * 2.5 };
threat.system.update(0.1);
assert.equal(threat.enemy.state, "chase");
assert.equal(threat.system.peakThreatLevel(), 1);
assert.equal(threat.system.aggressiveCount(), 1);

console.log("verifyNoise: ok");
