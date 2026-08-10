import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import type { CombatTargetSystem } from "../combat/CombatTargetSystem.ts";
import type { DamageResult, HealthPool } from "../combat/HealthPool.ts";
import type { PlayerIncomingDamageResult } from "../combat/PlayerDamageResolver.ts";
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
    return true;
  }

  update(delta: number, awareness: { sneaking: boolean; sprinting: boolean } = { sneaking: false, sprinting: false }): void {
    const playerPosition = this.player.getPosition();
    for (const enemy of [...this.enemies.values()]) {
      if (!enemy.isCombatAlive()) { this.finalizeDeath(enemy); continue; }
      enemy.update(delta, {
        playerPosition,
        playerAlive: this.player.health.alive,
        playerSneaking: awareness.sneaking,
        playerSprinting: awareness.sprinting,
        move: (position, displacement) => this.movement.move(enemy, position, displacement),
        damagePlayer: (amount) => { this.applyPlayerDamage(enemy, amount); },
      });
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
