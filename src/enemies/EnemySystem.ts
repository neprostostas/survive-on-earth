import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import type { CombatTargetSystem } from "../combat/CombatTargetSystem.ts";
import type { DamageResult, HealthPool } from "../combat/HealthPool.ts";
import type { PlayerIncomingDamageResult } from "../combat/PlayerDamageResolver.ts";
import { ENEMY_GROUP_AGGRO_RADIUS } from "./enemyConfig.ts";
import { RoamingZombie } from "./RoamingZombie.ts";

export interface EnemyMovementAdapter {
  move(enemy: RoamingZombie, position: CombatPoint, displacement: CombatPoint): CombatPoint;
  remove(enemy: RoamingZombie): void;
}

export interface EnemyPlayerAdapter {
  readonly health: HealthPool;
  getPosition(): CombatPoint;
  /** Apply raw enemy damage through Player-side mitigation at impact time. */
  applyIncomingDamage(rawDamage: number): PlayerIncomingDamageResult;
}

export interface EnemySystemCallbacks {
  readonly onPlayerDamage: (enemy: RoamingZombie, result: PlayerIncomingDamageResult) => void;
  readonly onEnemyHit: (enemy: RoamingZombie, result: DamageResult) => void;
  readonly onEnemyDeath: (enemy: RoamingZombie) => void;
}

export class EnemySystem {
  private readonly enemies = new Map<string, RoamingZombie>();
  private readonly targets: CombatTargetSystem;
  private readonly player: EnemyPlayerAdapter;
  private readonly movement: EnemyMovementAdapter;
  private readonly callbacks: EnemySystemCallbacks;
  private lastRawDamage = 0;
  private lastFinalDamage = 0;
  private defeatedTransitions = 0;

  constructor(
    targets: CombatTargetSystem,
    player: EnemyPlayerAdapter,
    movement: EnemyMovementAdapter,
    callbacks: EnemySystemCallbacks,
  ) {
    this.targets = targets;
    this.player = player;
    this.movement = movement;
    this.callbacks = callbacks;
  }

  get liveCount(): number { return this.enemies.size; }
  get agents(): readonly RoamingZombie[] { return Object.freeze([...this.enemies.values()]); }
  /** Final received damage from the last successful Player hit (after armor). */
  get lastPlayerDamage(): number { return this.lastFinalDamage; }
  get lastPlayerRawDamage(): number { return this.lastRawDamage; }
  get lastPlayerFinalDamage(): number { return this.lastFinalDamage; }
  get playerDefeatTransitions(): number { return this.defeatedTransitions; }

  register(enemy: RoamingZombie): void {
    if (this.enemies.has(enemy.combatId)) throw new Error(`Duplicate enemy: ${enemy.combatId}`);
    this.enemies.set(enemy.combatId, enemy);
    this.targets.register(enemy);
  }

  /** Hard-clear all agents (location travel / new game). Does not call onEnemyDeath loot. */
  clearAll(): void {
    for (const enemy of [...this.enemies.values()]) {
      this.enemies.delete(enemy.combatId);
      this.targets.unregister(enemy);
      this.movement.remove(enemy);
    }
  }

  handles(target: CombatTarget): target is RoamingZombie {
    return this.enemies.get(target.combatId) === target;
  }

  handlePlayerCombatImpact(target: CombatTarget, result: DamageResult): boolean {
    if (!this.handles(target)) return false;
    this.callbacks.onEnemyHit(target, result);
    if (result.becameDead) this.finalizeDeath(target);
    else if (result.applied > 0 && target.isCombatAlive()) {
      // Damage instantly opens chase so pack-share has a live fighter seed this frame.
      if (!target.isAggressive) target.callToArms();
      this.sharePackAggression(this.player.getPosition());
    }
    return true;
  }

  /**
   * Highest soft awareness / aggro among live enemies in acquire bubble (0..1).
   * Used for HUD threat pips — pure domain, no presentation side effects.
   */
  peakThreatLevel(): number {
    let peak = 0;
    for (const enemy of this.enemies.values()) {
      if (!enemy.isCombatAlive()) continue;
      peak = Math.max(peak, enemy.alertLevel);
    }
    return peak;
  }

  /** Count of fully aggressive agents (chase / attack / recovery). */
  aggressiveCount(): number {
    let n = 0;
    for (const enemy of this.enemies.values()) {
      if (enemy.isCombatAlive() && enemy.isAggressive) n += 1;
    }
    return n;
  }

  update(
    delta: number,
    awareness: {
      sneaking: boolean;
      sprinting: boolean;
      noiseRadius?: number;
      noiseLevel?: number;
      acquireRangeMul?: number;
      hearRangeMul?: number;
    } = { sneaking: false, sprinting: false },
  ): void {
    const playerPosition = this.player.getPosition();
    const noiseRadius = awareness.noiseRadius ?? 0;
    const noiseLevel = awareness.noiseLevel ?? 0;
    for (const enemy of [...this.enemies.values()]) {
      if (!enemy.isCombatAlive()) { this.finalizeDeath(enemy); continue; }
      enemy.update(delta, {
        playerPosition,
        playerAlive: this.player.health.alive,
        playerSneaking: awareness.sneaking,
        playerSprinting: awareness.sprinting,
        playerNoiseRadius: noiseRadius,
        playerNoiseLevel: noiseLevel,
        acquireRangeMul: awareness.acquireRangeMul,
        hearRangeMul: awareness.hearRangeMul,
        move: (position, displacement) => this.movement.move(enemy, position, displacement),
        damagePlayer: (amount) => { this.applyPlayerDamage(enemy, amount); },
      });
    }
    if (this.player.health.alive) {
      this.sharePackAggression(playerPosition);
    }
  }

  /**
   * Idle / alert peers near a fighting packmate enter chase.
   * Multi-pass so a chain of clustered zombies can all join in one tick.
   */
  private sharePackAggression(playerPosition: CombatPoint): void {
    const radius = ENEMY_GROUP_AGGRO_RADIUS;
    const radiusSq = radius * radius;
    for (let pass = 0; pass < 4; pass += 1) {
      let joined = 0;
      const fighters = [...this.enemies.values()].filter((e) => e.isCombatAlive() && e.isAggressive);
      if (fighters.length === 0) return;
      for (const peer of this.enemies.values()) {
        if (!peer.isCombatAlive() || peer.isAggressive) continue;
        const peerPos = peer.getCombatPosition();
        const toPlayer = Math.hypot(peerPos.x - playerPosition.x, peerPos.z - playerPosition.z);
        // Skip if already outside lose leash — would snap back to idle next update.
        if (toPlayer > peer.archetype.loseRange) continue;
        let nearFighter = false;
        for (const fighter of fighters) {
          if (fighter.combatId === peer.combatId) continue;
          const fp = fighter.getCombatPosition();
          const dx = peerPos.x - fp.x;
          const dz = peerPos.z - fp.z;
          if (dx * dx + dz * dz <= radiusSq) {
            nearFighter = true;
            break;
          }
        }
        if (!nearFighter) continue;
        if (peer.callToArms()) joined += 1;
      }
      if (joined === 0) return;
    }
  }

  private applyPlayerDamage(enemy: RoamingZombie, amount: number): void {
    if (!enemy.isCombatAlive() || !this.player.health.alive) return;
    const result = this.player.applyIncomingDamage(amount);
    if (result.previousHealth === result.currentHealth) return;
    this.lastRawDamage = result.rawDamage;
    this.lastFinalDamage = result.finalDamage;
    if (result.becameDefeated) this.defeatedTransitions += 1;
    this.callbacks.onPlayerDamage(enemy, result);
  }

  private finalizeDeath(enemy: RoamingZombie): void {
    if (this.enemies.get(enemy.combatId) !== enemy) return;
    this.enemies.delete(enemy.combatId);
    this.targets.unregister(enemy);
    this.movement.remove(enemy);
    this.callbacks.onEnemyDeath(enemy);
  }
}
