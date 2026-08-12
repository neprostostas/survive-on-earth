export const PLAYER_HEALTH_CONFIG = Object.freeze({ maxHealth: 100 });

/**
 * When one agent is already fighting, nearby idle packmates within this radius join
 * (LDOE-ish shared agro). Peers beyond their own lose range of the player are skipped
 * so they do not flicker chase→idle.
 */
export const ENEMY_GROUP_AGGRO_RADIUS = 5.5;

export const ROAMING_ZOMBIE_PROFILE = Object.freeze({
  id: "roaming-zombie",
  displayName: "Roaming Zombie",
  maxHealth: 40,
  damage: 6,
  moveSpeed: 1.6,
  attacksPerSecond: 0.8,
  attackCycle: 1 / 0.8,
  impactNormalizedTime: 0.42,
  acquireRange: 4,
  loseRange: 8,
  attackStartRange: 1.05,
  hitRange: 1.15,
  collisionRadius: 0.3,
  deathDuration: 0.46,
});
