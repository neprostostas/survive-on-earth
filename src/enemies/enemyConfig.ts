export const PLAYER_HEALTH_CONFIG = Object.freeze({ maxHealth: 100 });

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
