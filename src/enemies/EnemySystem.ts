import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import type { CombatTargetSystem } from "../combat/CombatTargetSystem.ts";
import type { DamageResult, HealthPool } from "../combat/HealthPool.ts";
import { RoamingZombie } from "./RoamingZombie.ts";

export interface EnemyMovementAdapter {
  move(enemy: RoamingZombie, position: CombatPoint, displacement: CombatPoint): CombatPoint;
  remove(enemy: RoamingZombie): void;
}

export interface EnemyPlayerAdapter {
  readonly health: HealthPool;
  getPosition(): CombatPoint;
}

export interface EnemySystemCallbacks {
  readonly onPlayerDamage: (enemy: RoamingZombie, result: DamageResult) => void;
  readonly onEnemyHit: (enemy: RoamingZombie, result: DamageResult) => void;
  readonly onEnemyDeath: (enemy: RoamingZombie) => void;
}

export class EnemySystem {
  private readonly enemies = new Map<string, RoamingZombie>();
  private readonly targets: CombatTargetSystem;
  private readonly player: EnemyPlayerAdapter;
  private readonly movement: EnemyMovementAdapter;
  private readonly callbacks: EnemySystemCallbacks;
  private lastDamage = 0;
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
  get lastPlayerDamage(): number { return this.lastDamage; }
  get playerDefeatTransitions(): number { return this.defeatedTransitions; }

  register(enemy: RoamingZombie): void {
    if (this.enemies.has(enemy.combatId)) throw new Error(`Duplicate enemy: ${enemy.combatId}`);
    this.enemies.set(enemy.combatId, enemy);
    this.targets.register(enemy);
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

  update(delta: number): void {
    const playerPosition = this.player.getPosition();
    for (const enemy of [...this.enemies.values()]) {
      if (!enemy.isCombatAlive()) { this.finalizeDeath(enemy); continue; }
      enemy.update(delta, {
        playerPosition,
        playerAlive: this.player.health.alive,
        move: (position, displacement) => this.movement.move(enemy, position, displacement),
        damagePlayer: (amount) => { this.applyPlayerDamage(enemy, amount); },
      });
    }
  }

  private applyPlayerDamage(enemy: RoamingZombie, amount: number): void {
    if (!enemy.isCombatAlive() || !this.player.health.alive) return;
    const result = this.player.health.applyDamage(amount);
    if (result.applied <= 0) return;
    this.lastDamage = result.requested;
    if (result.becameDead) this.defeatedTransitions += 1;
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
