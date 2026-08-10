import { ROAMING_ZOMBIE_PROFILE } from "./enemyConfig.ts";

export type EnemyArchetypeId =
  | "roaming-zombie"
  | "runner-infected"
  | "bloated-infected"
  | "armored-infected"
  | "shambler"
  | "brute"
  | "toxic-infected"
  | "screecher"
  | "marauder"
  | "marauder-leader"
  | "the-warden"
  | "stalker"
  | "bloater"
  | "hive-host"
  | "sentinel"
  | "cave-crawler"
  | "tunnel-brute"
  | "ash-jackal"
  | "metro-leviathan"
  | "marrow-warden"
  | "helix-sovereign"
  | "shambler-worker"
  | "shambler-scout"
  | "runner-feral"
  | "runner-waste"
  | "brute-slag"
  | "toxic-mire"
  | "armored-plate"
  | "screecher-tunnel"
  | "stalker-night"
  | "bloater-gas"
  | "hive-tendril"
  | "cave-spore"
  | "tunnel-slate"
  | "spore-infected"
  | "feral-infected"
  | "swamp-infected"
  | "frozen-infected"
  | "desert-infected"
  | "city-infected"
  | "industrial-infected"
  | "hazard-elite"
  | "marauder-melee"
  | "marauder-ranged"
  | "marauder-heavy"
  | "marauder-scout"
  | "marauder-medic"
  | "faction-guard"
  | "bandit-leader"
  | "industrial-raider"
  | "sniper-host"
  | "shotgun-host";

export interface EnemyArchetype {
  readonly id: EnemyArchetypeId;
  readonly displayName: string;
  readonly maxHealth: number;
  readonly damage: number;
  readonly moveSpeed: number;
  readonly attacksPerSecond: number;
  readonly attackCycle: number;
  readonly impactNormalizedTime: number;
  readonly acquireRange: number;
  readonly loseRange: number;
  readonly attackStartRange: number;
  readonly hitRange: number;
  readonly collisionRadius: number;
  readonly deathDuration: number;
  readonly xpReward: number;
  readonly difficultyTier: number;
  /** Procedural silhouette bias: 0 default, 1 tall/thin, 2 bulky, 3 armored. */
  readonly silhouette: 0 | 1 | 2 | 3;
}

function freezeArchetype(partial: Omit<EnemyArchetype, "attackCycle"> & { attacksPerSecond: number }): EnemyArchetype {
  return Object.freeze({
    ...partial,
    attackCycle: 1 / partial.attacksPerSecond,
  });
}

export const ENEMY_ARCHETYPES: ReadonlyMap<EnemyArchetypeId, EnemyArchetype> = new Map([
  [
    "roaming-zombie",
    freezeArchetype({
      id: "roaming-zombie",
      displayName: ROAMING_ZOMBIE_PROFILE.displayName,
      maxHealth: ROAMING_ZOMBIE_PROFILE.maxHealth,
      damage: ROAMING_ZOMBIE_PROFILE.damage,
      moveSpeed: ROAMING_ZOMBIE_PROFILE.moveSpeed,
      attacksPerSecond: ROAMING_ZOMBIE_PROFILE.attacksPerSecond,
      impactNormalizedTime: ROAMING_ZOMBIE_PROFILE.impactNormalizedTime,
      acquireRange: ROAMING_ZOMBIE_PROFILE.acquireRange,
      loseRange: ROAMING_ZOMBIE_PROFILE.loseRange,
      attackStartRange: ROAMING_ZOMBIE_PROFILE.attackStartRange,
      hitRange: ROAMING_ZOMBIE_PROFILE.hitRange,
      collisionRadius: ROAMING_ZOMBIE_PROFILE.collisionRadius,
      deathDuration: ROAMING_ZOMBIE_PROFILE.deathDuration,
      xpReward: 12,
      difficultyTier: 1,
      silhouette: 0,
    }),
  ],
  [
    "runner-infected",
    freezeArchetype({
      id: "runner-infected",
      displayName: "Runner Infected",
      maxHealth: 28,
      damage: 5,
      moveSpeed: 2.6,
      attacksPerSecond: 1.15,
      impactNormalizedTime: 0.36,
      acquireRange: 5.2,
      loseRange: 9.5,
      attackStartRange: 1.0,
      hitRange: 1.1,
      collisionRadius: 0.28,
      deathDuration: 0.4,
      xpReward: 16,
      difficultyTier: 2,
      silhouette: 1,
    }),
  ],
  [
    "bloated-infected",
    freezeArchetype({
      id: "bloated-infected",
      displayName: "Bloated Infected",
      maxHealth: 70,
      damage: 10,
      moveSpeed: 1.15,
      attacksPerSecond: 0.55,
      impactNormalizedTime: 0.48,
      acquireRange: 3.6,
      loseRange: 7.5,
      attackStartRange: 1.2,
      hitRange: 1.3,
      collisionRadius: 0.4,
      deathDuration: 0.55,
      xpReward: 22,
      difficultyTier: 2,
      silhouette: 2,
    }),
  ],
  [
    "armored-infected",
    freezeArchetype({
      id: "armored-infected",
      displayName: "Armored Infected",
      maxHealth: 90,
      damage: 9,
      moveSpeed: 1.35,
      attacksPerSecond: 0.7,
      impactNormalizedTime: 0.42,
      acquireRange: 4.2,
      loseRange: 8.5,
      attackStartRange: 1.1,
      hitRange: 1.2,
      collisionRadius: 0.34,
      deathDuration: 0.5,
      xpReward: 28,
      difficultyTier: 3,
      silhouette: 3,
    }),
  ],
  [
    "shambler",
    freezeArchetype({
      id: "shambler",
      displayName: "Shambler",
      maxHealth: 35,
      damage: 5,
      moveSpeed: 1.1,
      attacksPerSecond: 0.65,
      impactNormalizedTime: 0.45,
      acquireRange: 3.5,
      loseRange: 7,
      attackStartRange: 1.05,
      hitRange: 1.1,
      collisionRadius: 0.3,
      deathDuration: 0.5,
      xpReward: 10,
      difficultyTier: 1,
      silhouette: 0,
    }),
  ],
  [
    "brute",
    freezeArchetype({
      id: "brute",
      displayName: "Brute",
      maxHealth: 110,
      damage: 14,
      moveSpeed: 1.05,
      attacksPerSecond: 0.5,
      impactNormalizedTime: 0.5,
      acquireRange: 3.8,
      loseRange: 7.5,
      attackStartRange: 1.25,
      hitRange: 1.35,
      collisionRadius: 0.42,
      deathDuration: 0.6,
      xpReward: 30,
      difficultyTier: 3,
      silhouette: 2,
    }),
  ],
  [
    "toxic-infected",
    freezeArchetype({
      id: "toxic-infected",
      displayName: "Toxic Infected",
      maxHealth: 48,
      damage: 7,
      moveSpeed: 1.5,
      attacksPerSecond: 0.85,
      impactNormalizedTime: 0.4,
      acquireRange: 4,
      loseRange: 8,
      attackStartRange: 1.1,
      hitRange: 1.2,
      collisionRadius: 0.32,
      deathDuration: 0.48,
      xpReward: 20,
      difficultyTier: 2,
      silhouette: 1,
    }),
  ],
  [
    "screecher",
    freezeArchetype({
      id: "screecher",
      displayName: "Screecher",
      maxHealth: 32,
      damage: 3,
      moveSpeed: 1.9,
      attacksPerSecond: 0.95,
      impactNormalizedTime: 0.35,
      acquireRange: 6,
      loseRange: 11,
      attackStartRange: 2.5,
      hitRange: 2.8,
      collisionRadius: 0.28,
      deathDuration: 0.4,
      xpReward: 18,
      difficultyTier: 2,
      silhouette: 1,
    }),
  ],
  [
    "marauder",
    freezeArchetype({
      id: "marauder",
      displayName: "Marauder",
      maxHealth: 55,
      damage: 9,
      moveSpeed: 2.0,
      attacksPerSecond: 1.0,
      impactNormalizedTime: 0.38,
      acquireRange: 5.5,
      loseRange: 10,
      attackStartRange: 1.1,
      hitRange: 1.15,
      collisionRadius: 0.3,
      deathDuration: 0.42,
      xpReward: 24,
      difficultyTier: 3,
      silhouette: 0,
    }),
  ],
  [
    "marauder-leader",
    freezeArchetype({
      id: "marauder-leader",
      displayName: "Marauder Leader",
      maxHealth: 140,
      damage: 13,
      moveSpeed: 1.75,
      attacksPerSecond: 0.9,
      impactNormalizedTime: 0.4,
      acquireRange: 6,
      loseRange: 11,
      attackStartRange: 1.15,
      hitRange: 1.25,
      collisionRadius: 0.34,
      deathDuration: 0.55,
      xpReward: 55,
      difficultyTier: 4,
      silhouette: 3,
    }),
  ],
  [
    "the-warden",
    freezeArchetype({
      id: "the-warden",
      displayName: "The Warden",
      maxHealth: 420,
      damage: 18,
      moveSpeed: 1.35,
      attacksPerSecond: 0.55,
      impactNormalizedTime: 0.48,
      acquireRange: 7,
      loseRange: 14,
      attackStartRange: 1.4,
      hitRange: 1.5,
      collisionRadius: 0.45,
      deathDuration: 0.8,
      xpReward: 200,
      difficultyTier: 5,
      silhouette: 2,
    }),
  ],
  [
    "stalker",
    freezeArchetype({
      id: "stalker",
      displayName: "Stalker",
      maxHealth: 38,
      damage: 14,
      moveSpeed: 2.4,
      attacksPerSecond: 1.25,
      impactNormalizedTime: 0.32,
      acquireRange: 5.8,
      loseRange: 10,
      attackStartRange: 0.95,
      hitRange: 1.05,
      collisionRadius: 0.26,
      deathDuration: 0.38,
      xpReward: 28,
      difficultyTier: 3,
      silhouette: 1,
    }),
  ],
  [
    "bloater",
    freezeArchetype({
      id: "bloater",
      displayName: "Bloater",
      maxHealth: 110,
      damage: 12,
      moveSpeed: 1.05,
      attacksPerSecond: 0.5,
      impactNormalizedTime: 0.5,
      acquireRange: 3.8,
      loseRange: 8,
      attackStartRange: 1.3,
      hitRange: 1.4,
      collisionRadius: 0.48,
      deathDuration: 0.6,
      xpReward: 34,
      difficultyTier: 3,
      silhouette: 2,
    }),
  ],
  [
    "hive-host",
    freezeArchetype({
      id: "hive-host",
      displayName: "Hive Host",
      maxHealth: 95,
      damage: 8,
      moveSpeed: 1.25,
      attacksPerSecond: 0.7,
      impactNormalizedTime: 0.42,
      acquireRange: 5,
      loseRange: 10,
      attackStartRange: 1.2,
      hitRange: 1.25,
      collisionRadius: 0.4,
      deathDuration: 0.55,
      xpReward: 40,
      difficultyTier: 4,
      silhouette: 2,
    }),
  ],
  [
    "sentinel",
    freezeArchetype({
      id: "sentinel",
      displayName: "Sentinel",
      maxHealth: 130,
      damage: 12,
      moveSpeed: 1.5,
      attacksPerSecond: 0.75,
      impactNormalizedTime: 0.4,
      acquireRange: 5.5,
      loseRange: 11,
      attackStartRange: 1.15,
      hitRange: 1.3,
      collisionRadius: 0.36,
      deathDuration: 0.5,
      xpReward: 48,
      difficultyTier: 4,
      silhouette: 3,
    }),
  ],
  [
    "cave-crawler",
    freezeArchetype({
      id: "cave-crawler",
      displayName: "Cave Crawler",
      maxHealth: 48,
      damage: 8,
      moveSpeed: 2.2,
      attacksPerSecond: 1.1,
      impactNormalizedTime: 0.36,
      acquireRange: 4.5,
      loseRange: 9,
      attackStartRange: 1.0,
      hitRange: 1.1,
      collisionRadius: 0.28,
      deathDuration: 0.4,
      xpReward: 22,
      difficultyTier: 3,
      silhouette: 1,
    }),
  ],
  [
    "tunnel-brute",
    freezeArchetype({
      id: "tunnel-brute",
      displayName: "Tunnel Brute",
      maxHealth: 160,
      damage: 15,
      moveSpeed: 1.2,
      attacksPerSecond: 0.55,
      impactNormalizedTime: 0.48,
      acquireRange: 4,
      loseRange: 9,
      attackStartRange: 1.3,
      hitRange: 1.45,
      collisionRadius: 0.46,
      deathDuration: 0.65,
      xpReward: 50,
      difficultyTier: 4,
      silhouette: 2,
    }),
  ],
  [
    "ash-jackal",
    freezeArchetype({
      id: "ash-jackal",
      displayName: "Ash Jackal",
      maxHealth: 60,
      damage: 10,
      moveSpeed: 2.15,
      attacksPerSecond: 1.05,
      impactNormalizedTime: 0.37,
      acquireRange: 6,
      loseRange: 11,
      attackStartRange: 1.1,
      hitRange: 1.15,
      collisionRadius: 0.3,
      deathDuration: 0.42,
      xpReward: 26,
      difficultyTier: 3,
      silhouette: 0,
    }),
  ],
  [
    "metro-leviathan",
    freezeArchetype({
      id: "metro-leviathan",
      displayName: "Metro Leviathan",
      maxHealth: 380,
      damage: 17,
      moveSpeed: 1.4,
      attacksPerSecond: 0.6,
      impactNormalizedTime: 0.46,
      acquireRange: 7,
      loseRange: 13,
      attackStartRange: 1.4,
      hitRange: 1.55,
      collisionRadius: 0.5,
      deathDuration: 0.85,
      xpReward: 180,
      difficultyTier: 5,
      silhouette: 2,
    }),
  ],
  [
    "marrow-warden",
    freezeArchetype({
      id: "marrow-warden",
      displayName: "Marrow Warden",
      maxHealth: 360,
      damage: 16,
      moveSpeed: 1.45,
      attacksPerSecond: 0.65,
      impactNormalizedTime: 0.44,
      acquireRange: 6.5,
      loseRange: 12,
      attackStartRange: 1.35,
      hitRange: 1.45,
      collisionRadius: 0.44,
      deathDuration: 0.8,
      xpReward: 170,
      difficultyTier: 5,
      silhouette: 3,
    }),
  ],
  [
    "helix-sovereign",
    freezeArchetype({
      id: "helix-sovereign",
      displayName: "Helix Sovereign",
      maxHealth: 650,
      damage: 22,
      moveSpeed: 1.5,
      attacksPerSecond: 0.7,
      impactNormalizedTime: 0.42,
      acquireRange: 8,
      loseRange: 16,
      attackStartRange: 1.5,
      hitRange: 1.65,
      collisionRadius: 0.52,
      deathDuration: 1.0,
      xpReward: 400,
      difficultyTier: 5,
      silhouette: 3,
    }),
  ],
  // ── Pass 5 enemy saturation ──
  ["shambler-worker", freezeArchetype({ id: "shambler-worker", displayName: "Worker Shambler", maxHealth: 48, damage: 7, moveSpeed: 1.05, attacksPerSecond: 0.85, impactNormalizedTime: 0.45, acquireRange: 5, loseRange: 10, attackStartRange: 1.05, hitRange: 1.1, collisionRadius: 0.3, deathDuration: 0.5, xpReward: 10, difficultyTier: 1, silhouette: 0 })],
  ["shambler-scout", freezeArchetype({ id: "shambler-scout", displayName: "Scout Shambler", maxHealth: 40, damage: 6, moveSpeed: 1.25, attacksPerSecond: 0.95, impactNormalizedTime: 0.4, acquireRange: 6, loseRange: 11, attackStartRange: 1.0, hitRange: 1.05, collisionRadius: 0.28, deathDuration: 0.45, xpReward: 11, difficultyTier: 1, silhouette: 1 })],
  ["runner-feral", freezeArchetype({ id: "runner-feral", displayName: "Feral Runner", maxHealth: 36, damage: 9, moveSpeed: 2.55, attacksPerSecond: 1.2, impactNormalizedTime: 0.32, acquireRange: 8, loseRange: 14, attackStartRange: 1.0, hitRange: 1.05, collisionRadius: 0.26, deathDuration: 0.35, xpReward: 18, difficultyTier: 2, silhouette: 1 })],
  ["runner-waste", freezeArchetype({ id: "runner-waste", displayName: "Waste Runner", maxHealth: 42, damage: 10, moveSpeed: 2.35, attacksPerSecond: 1.15, impactNormalizedTime: 0.34, acquireRange: 7.5, loseRange: 13, attackStartRange: 1.05, hitRange: 1.1, collisionRadius: 0.28, deathDuration: 0.38, xpReward: 20, difficultyTier: 2, silhouette: 1 })],
  ["brute-slag", freezeArchetype({ id: "brute-slag", displayName: "Slag Brute", maxHealth: 160, damage: 16, moveSpeed: 1.15, attacksPerSecond: 0.65, impactNormalizedTime: 0.5, acquireRange: 5.5, loseRange: 11, attackStartRange: 1.35, hitRange: 1.45, collisionRadius: 0.45, deathDuration: 0.7, xpReward: 42, difficultyTier: 3, silhouette: 2 })],
  ["toxic-mire", freezeArchetype({ id: "toxic-mire", displayName: "Mire Toxic", maxHealth: 70, damage: 9, moveSpeed: 1.35, attacksPerSecond: 0.9, impactNormalizedTime: 0.4, acquireRange: 6, loseRange: 12, attackStartRange: 1.1, hitRange: 1.2, collisionRadius: 0.32, deathDuration: 0.5, xpReward: 24, difficultyTier: 2, silhouette: 0 })],
  ["armored-plate", freezeArchetype({ id: "armored-plate", displayName: "Plate Infected", maxHealth: 130, damage: 12, moveSpeed: 1.2, attacksPerSecond: 0.75, impactNormalizedTime: 0.46, acquireRange: 5.5, loseRange: 11, attackStartRange: 1.2, hitRange: 1.3, collisionRadius: 0.4, deathDuration: 0.6, xpReward: 36, difficultyTier: 3, silhouette: 3 })],
  ["screecher-tunnel", freezeArchetype({ id: "screecher-tunnel", displayName: "Tunnel Screecher", maxHealth: 45, damage: 8, moveSpeed: 1.9, attacksPerSecond: 1.1, impactNormalizedTime: 0.35, acquireRange: 10, loseRange: 16, attackStartRange: 1.0, hitRange: 1.05, collisionRadius: 0.27, deathDuration: 0.4, xpReward: 22, difficultyTier: 2, silhouette: 1 })],
  ["stalker-night", freezeArchetype({ id: "stalker-night", displayName: "Night Stalker", maxHealth: 55, damage: 11, moveSpeed: 2.05, attacksPerSecond: 1.05, impactNormalizedTime: 0.33, acquireRange: 9, loseRange: 15, attackStartRange: 1.05, hitRange: 1.12, collisionRadius: 0.29, deathDuration: 0.42, xpReward: 28, difficultyTier: 3, silhouette: 1 })],
  ["bloater-gas", freezeArchetype({ id: "bloater-gas", displayName: "Gas Bloater", maxHealth: 110, damage: 14, moveSpeed: 1.0, attacksPerSecond: 0.7, impactNormalizedTime: 0.5, acquireRange: 5, loseRange: 10, attackStartRange: 1.25, hitRange: 1.4, collisionRadius: 0.48, deathDuration: 0.75, xpReward: 34, difficultyTier: 3, silhouette: 2 })],
  ["hive-tendril", freezeArchetype({ id: "hive-tendril", displayName: "Hive Tendril", maxHealth: 95, damage: 12, moveSpeed: 1.3, attacksPerSecond: 0.95, impactNormalizedTime: 0.4, acquireRange: 7, loseRange: 13, attackStartRange: 1.2, hitRange: 1.35, collisionRadius: 0.36, deathDuration: 0.55, xpReward: 38, difficultyTier: 3, silhouette: 2 })],
  ["cave-spore", freezeArchetype({ id: "cave-spore", displayName: "Spore Crawler", maxHealth: 50, damage: 9, moveSpeed: 1.7, attacksPerSecond: 1.05, impactNormalizedTime: 0.36, acquireRange: 6, loseRange: 11, attackStartRange: 1.0, hitRange: 1.1, collisionRadius: 0.28, deathDuration: 0.4, xpReward: 20, difficultyTier: 2, silhouette: 1 })],
  ["tunnel-slate", freezeArchetype({ id: "tunnel-slate", displayName: "Slate Tunnel Brute", maxHealth: 175, damage: 17, moveSpeed: 1.1, attacksPerSecond: 0.6, impactNormalizedTime: 0.5, acquireRange: 5.5, loseRange: 11, attackStartRange: 1.4, hitRange: 1.5, collisionRadius: 0.48, deathDuration: 0.75, xpReward: 48, difficultyTier: 4, silhouette: 2 })],
  ["spore-infected", freezeArchetype({ id: "spore-infected", displayName: "Spore Infected", maxHealth: 65, damage: 10, moveSpeed: 1.4, attacksPerSecond: 0.95, impactNormalizedTime: 0.4, acquireRange: 6.5, loseRange: 12, attackStartRange: 1.1, hitRange: 1.2, collisionRadius: 0.33, deathDuration: 0.5, xpReward: 26, difficultyTier: 2, silhouette: 0 })],
  ["feral-infected", freezeArchetype({ id: "feral-infected", displayName: "Feral Infected", maxHealth: 48, damage: 11, moveSpeed: 2.4, attacksPerSecond: 1.25, impactNormalizedTime: 0.3, acquireRange: 8.5, loseRange: 15, attackStartRange: 1.0, hitRange: 1.08, collisionRadius: 0.27, deathDuration: 0.35, xpReward: 24, difficultyTier: 2, silhouette: 1 })],
  ["swamp-infected", freezeArchetype({ id: "swamp-infected", displayName: "Swamp Infected", maxHealth: 72, damage: 10, moveSpeed: 1.28, attacksPerSecond: 0.88, impactNormalizedTime: 0.42, acquireRange: 5.5, loseRange: 11, attackStartRange: 1.1, hitRange: 1.2, collisionRadius: 0.34, deathDuration: 0.52, xpReward: 25, difficultyTier: 2, silhouette: 0 })],
  ["frozen-infected", freezeArchetype({ id: "frozen-infected", displayName: "Frozen Infected", maxHealth: 85, damage: 12, moveSpeed: 1.15, attacksPerSecond: 0.8, impactNormalizedTime: 0.46, acquireRange: 5.5, loseRange: 11, attackStartRange: 1.15, hitRange: 1.25, collisionRadius: 0.35, deathDuration: 0.55, xpReward: 28, difficultyTier: 3, silhouette: 0 })],
  ["desert-infected", freezeArchetype({ id: "desert-infected", displayName: "Desert Infected", maxHealth: 60, damage: 10, moveSpeed: 1.55, attacksPerSecond: 1.0, impactNormalizedTime: 0.38, acquireRange: 7, loseRange: 13, attackStartRange: 1.1, hitRange: 1.15, collisionRadius: 0.3, deathDuration: 0.45, xpReward: 22, difficultyTier: 2, silhouette: 1 })],
  ["city-infected", freezeArchetype({ id: "city-infected", displayName: "Urban Infected", maxHealth: 58, damage: 9, moveSpeed: 1.5, attacksPerSecond: 1.0, impactNormalizedTime: 0.38, acquireRange: 6.5, loseRange: 12, attackStartRange: 1.05, hitRange: 1.12, collisionRadius: 0.3, deathDuration: 0.45, xpReward: 18, difficultyTier: 2, silhouette: 0 })],
  ["industrial-infected", freezeArchetype({ id: "industrial-infected", displayName: "Industrial Infected", maxHealth: 95, damage: 13, moveSpeed: 1.25, attacksPerSecond: 0.85, impactNormalizedTime: 0.44, acquireRange: 6, loseRange: 11, attackStartRange: 1.2, hitRange: 1.3, collisionRadius: 0.38, deathDuration: 0.55, xpReward: 32, difficultyTier: 3, silhouette: 3 })],
  ["hazard-elite", freezeArchetype({ id: "hazard-elite", displayName: "Hazard Elite", maxHealth: 210, damage: 18, moveSpeed: 1.4, attacksPerSecond: 0.85, impactNormalizedTime: 0.4, acquireRange: 7.5, loseRange: 14, attackStartRange: 1.3, hitRange: 1.4, collisionRadius: 0.42, deathDuration: 0.7, xpReward: 70, difficultyTier: 4, silhouette: 3 })],
  ["marauder-melee", freezeArchetype({ id: "marauder-melee", displayName: "Marauder Blade", maxHealth: 70, damage: 12, moveSpeed: 2.0, attacksPerSecond: 1.1, impactNormalizedTime: 0.35, acquireRange: 7, loseRange: 13, attackStartRange: 1.1, hitRange: 1.2, collisionRadius: 0.3, deathDuration: 0.4, xpReward: 30, difficultyTier: 3, silhouette: 0 })],
  ["marauder-ranged", freezeArchetype({ id: "marauder-ranged", displayName: "Marauder Marksman", maxHealth: 55, damage: 11, moveSpeed: 1.85, attacksPerSecond: 0.9, impactNormalizedTime: 0.4, acquireRange: 12, loseRange: 18, attackStartRange: 1.0, hitRange: 1.1, collisionRadius: 0.29, deathDuration: 0.4, xpReward: 32, difficultyTier: 3, silhouette: 0 })],
  ["marauder-heavy", freezeArchetype({ id: "marauder-heavy", displayName: "Marauder Heavy", maxHealth: 120, damage: 16, moveSpeed: 1.4, attacksPerSecond: 0.7, impactNormalizedTime: 0.48, acquireRange: 6, loseRange: 12, attackStartRange: 1.25, hitRange: 1.35, collisionRadius: 0.4, deathDuration: 0.55, xpReward: 45, difficultyTier: 4, silhouette: 2 })],
  ["marauder-scout", freezeArchetype({ id: "marauder-scout", displayName: "Marauder Scout", maxHealth: 48, damage: 9, moveSpeed: 2.3, attacksPerSecond: 1.15, impactNormalizedTime: 0.32, acquireRange: 10, loseRange: 16, attackStartRange: 1.0, hitRange: 1.08, collisionRadius: 0.28, deathDuration: 0.35, xpReward: 28, difficultyTier: 3, silhouette: 1 })],
  ["marauder-medic", freezeArchetype({ id: "marauder-medic", displayName: "Marauder Medic", maxHealth: 52, damage: 8, moveSpeed: 1.9, attacksPerSecond: 0.95, impactNormalizedTime: 0.38, acquireRange: 7, loseRange: 13, attackStartRange: 1.05, hitRange: 1.1, collisionRadius: 0.29, deathDuration: 0.4, xpReward: 30, difficultyTier: 3, silhouette: 0 })],
  ["faction-guard", freezeArchetype({ id: "faction-guard", displayName: "Hostile Guard", maxHealth: 80, damage: 13, moveSpeed: 1.75, attacksPerSecond: 1.0, impactNormalizedTime: 0.38, acquireRange: 8, loseRange: 14, attackStartRange: 1.1, hitRange: 1.2, collisionRadius: 0.31, deathDuration: 0.45, xpReward: 34, difficultyTier: 3, silhouette: 0 })],
  ["bandit-leader", freezeArchetype({ id: "bandit-leader", displayName: "Bandit Leader", maxHealth: 150, damage: 15, moveSpeed: 1.7, attacksPerSecond: 0.95, impactNormalizedTime: 0.4, acquireRange: 8, loseRange: 14, attackStartRange: 1.2, hitRange: 1.3, collisionRadius: 0.34, deathDuration: 0.55, xpReward: 65, difficultyTier: 4, silhouette: 0 })],
  ["industrial-raider", freezeArchetype({ id: "industrial-raider", displayName: "Industrial Raider", maxHealth: 100, damage: 14, moveSpeed: 1.55, attacksPerSecond: 0.9, impactNormalizedTime: 0.42, acquireRange: 7, loseRange: 13, attackStartRange: 1.15, hitRange: 1.25, collisionRadius: 0.35, deathDuration: 0.5, xpReward: 40, difficultyTier: 3, silhouette: 3 })],
  ["sniper-host", freezeArchetype({ id: "sniper-host", displayName: "Rogue Sniper", maxHealth: 50, damage: 18, moveSpeed: 1.5, attacksPerSecond: 0.55, impactNormalizedTime: 0.5, acquireRange: 16, loseRange: 22, attackStartRange: 0.95, hitRange: 1.05, collisionRadius: 0.28, deathDuration: 0.4, xpReward: 40, difficultyTier: 4, silhouette: 1 })],
  ["shotgun-host", freezeArchetype({ id: "shotgun-host", displayName: "Close-Range Raider", maxHealth: 75, damage: 20, moveSpeed: 1.65, attacksPerSecond: 0.7, impactNormalizedTime: 0.45, acquireRange: 6, loseRange: 11, attackStartRange: 1.15, hitRange: 1.2, collisionRadius: 0.32, deathDuration: 0.45, xpReward: 38, difficultyTier: 3, silhouette: 0 })],
]);

export function getEnemyArchetype(id: EnemyArchetypeId): EnemyArchetype {
  const archetype = ENEMY_ARCHETYPES.get(id);
  if (!archetype) throw new Error(`Unknown enemy archetype: ${id}`);
  return archetype;
}
