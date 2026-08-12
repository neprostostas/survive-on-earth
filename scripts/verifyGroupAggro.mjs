/**
 * Shared pack agro: hitting or spotting one zombie pulls nearby idle mates.
 */
import assert from "node:assert/strict";
import { CombatTargetSystem } from "../src/combat/CombatTargetSystem.ts";
import { HealthPool } from "../src/combat/HealthPool.ts";
import { ENEMY_GROUP_AGGRO_RADIUS, PLAYER_HEALTH_CONFIG, ROAMING_ZOMBIE_PROFILE } from "../src/enemies/enemyConfig.ts";
import { EnemySystem } from "../src/enemies/EnemySystem.ts";
import { RoamingZombie } from "../src/enemies/RoamingZombie.ts";

assert.ok(ENEMY_GROUP_AGGRO_RADIUS >= 4 && ENEMY_GROUP_AGGRO_RADIUS <= 8);

function harness(enemyPositions, playerPosition = { x: 10, y: 0, z: 0 }) {
  const targets = new CombatTargetSystem();
  const health = new HealthPool(PLAYER_HEALTH_CONFIG.maxHealth);
  const player = {
    position: { ...playerPosition },
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
  const enemies = enemyPositions.map((p, i) => new RoamingZombie(`pack-${i}`, p));
  for (const e of enemies) system.register(e);
  return { system, player, enemies };
}

function ahead(enemy, distance) {
  const p = enemy.getCombatPosition();
  const yaw = enemy.facingYaw;
  return { x: p.x + Math.sin(yaw) * distance, y: 0, z: p.z + Math.cos(yaw) * distance };
}

// Spot front → packmate beside within radius also chases
const pack = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }],
  { x: 20, y: 0, z: 0 },
);
pack.player.position = ahead(pack.enemies[0], 2.5);
pack.system.update(0.1);
assert.equal(pack.enemies[0].state, "chase", "front scout engages");
assert.equal(pack.enemies[1].state, "chase", "packmate near fighter joins");

// Far mate beyond group radius stays idle
const far = harness(
  [{ x: 0, y: 0, z: 0 }, { x: ENEMY_GROUP_AGGRO_RADIUS + 2, y: 0, z: 0 }],
  { x: 20, y: 0, z: 0 },
);
far.player.position = ahead(far.enemies[0], 2.5);
far.system.update(0.1);
assert.equal(far.enemies[0].state, "chase");
assert.equal(far.enemies[1].state, "idle", "out of pack radius stays idle");

// Damage-based call-out without personal vision
const hit = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 2.5, y: 0, z: 0 }],
  { x: 5, y: 0, z: 0 },
);
const dmg = hit.enemies[0].receiveDamage(6);
hit.system.handlePlayerCombatImpact(hit.enemies[0], dmg);
// Provoked alone leaves peer idle until pack share (handlePlayerCombatImpact spreads)
assert.equal(hit.enemies[1].state, "chase", "peer joins after packmate takes a hit");
// Damaged agent is still idle until update (provoked) — call packs don't force the injured one
// unless already aggressive. Provoke path: update will set chase.
hit.system.update(0.05);
assert.equal(hit.enemies[0].state, "chase", "injured agent chases on update");

// Peer beyond lose range of player is not pulled in
const leash = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 2, y: 0, z: 0 }],
  { x: ROAMING_ZOMBIE_PROFILE.loseRange + 1, y: 0, z: 0 },
);
const dmg2 = leash.enemies[0].receiveDamage(6);
// Force fighter into chase despite distance: receiveDamage + update with player close first
leash.player.position = { x: 2, y: 0, z: 0 };
leash.system.update(0.05);
assert.equal(leash.enemies[0].state, "chase");
// Move player so peer is outside lose range
leash.player.position = {
  x: leash.enemies[1].getCombatPosition().x + ROAMING_ZOMBIE_PROFILE.loseRange + 0.5,
  y: 0,
  z: 0,
};
// Place peer next to fighter but player far from peer
// Actually after fighter is chasing, share shouldn't pull peer if peer-to-player > loseRange
const peer = harness(
  [
    { x: 0, y: 0, z: 0 },
    { x: 2, y: 0, z: 0 },
  ],
  { x: 1, y: 0, z: 0 },
);
// Start fight with A
peer.system.update(0.05);
assert.ok(peer.enemies[0].isAggressive || peer.enemies[1].isAggressive);
// Teleport B far past lose leash while A still fights near player
// Manual: put player at origin area, put enemy1 at loseRange+1 with A still near player
const leashPack = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 3, y: 0, z: 0 }],
  { x: 1.2, y: 0, z: 0 },
);
leashPack.system.update(0.05);
assert.equal(leashPack.enemies[0].state, "chase");
// Peers: keep enemy1 at x=3 (within pack of A) but set player to x=12 → peer distance 9 > lose 8?
// peer at 3, player at 12: dist=9 > 8 → should not join if not already? After first update both joined.
// Reset: position peer beyond lose first
const gate = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 4, y: 0, z: 0 }],
  { x: 1, y: 0, z: 0 },
);
// Only A acquires (B is 4m side-ish — may hear). Put B at z side with large player dist via facing.
// B at (0,0,4) - player at (1,0,0): dist ~4.1 for B, A at (0) dist 1 — both inside lose
// B at (0,0,10), A at (0), player (1,0,0): B dist~10 > lose, A engagns
const gate2 = harness(
  [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0, z: ENEMY_GROUP_AGGRO_RADIUS - 0.5 }],
  { x: 1.5, y: 0, z: 0 },
);
// Move B far for player distance while close to A: B at (0, 0, 2) after? 
// A at 0, B at ENEMY_GROUP_AGGRO/2 nearby, player very far: if player at (10,0,0), A has dist 10 > lose, won't stay chase
// So: A starts close, then we don't move A. B placed at (x such that pack near, player dist >lose)
// A at 0, player at 1.5 front → chase. B at 4.5 on same axis: A-B dist 4.5 within pack 5.5, B-player dist 3 — joins
// Need B-player > 8: B at (-4,0,0), player at (2,0,0), A at (0,0,0): A-player=2, B-player=6, A-B=4 → joins (6<8)
// B at (-7,0,0), player at (2,0,0): B-player=9 > 8, A-B=7 > 5.5? pack radius fails
// B at (-5,0,0), player at 2: B-player=7 < 8, A-B=5 within radius, joins
// B at (-5.2, 0, 0), player at 3: B-player=8.2 > 8, A-B=5.2 within 5.5 → should NOT join after A chases

const noLeash = harness(
  [{ x: 0, y: 0, z: 0 }, { x: -5.2, y: 0, z: 0 }],
  { x: 3, y: 0, z: 0 },
);
// Force A via damage (behind player still provoked)
const dA = noLeash.enemies[0].receiveDamage(1);
noLeash.system.handlePlayerCombatImpact(noLeash.enemies[0], dA);
noLeash.system.update(0.05);
assert.equal(noLeash.enemies[0].state, "chase");
assert.equal(noLeash.enemies[1].state, "idle", "peer past lose range of player is not pack-pulled");

// Chain of three: A spots → B joins → C near B joins
const chain = harness(
  [
    { x: 0, y: 0, z: 0 },
    { x: 4, y: 0, z: 0 },
    { x: 8, y: 0, z: 0 },
  ],
  { x: 20, y: 0, z: 0 },
);
chain.player.position = ahead(chain.enemies[0], 2.2);
chain.system.update(0.1);
assert.equal(chain.enemies[0].state, "chase");
assert.equal(chain.enemies[1].state, "chase", "first hop");
assert.equal(chain.enemies[2].state, "chase", "second hop within multi-pass");

console.log("verifyGroupAggro: ok");
