import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import { HealthPool, type DamageResult } from "../combat/HealthPool.ts";
import { ROAMING_ZOMBIE_PROFILE } from "./enemyConfig.ts";

export type EnemyState = "idle" | "chase" | "attack" | "recovery" | "dead";
export type EnemyAttackResult = "hit" | "miss" | null;

export interface EnemyUpdateContext {
  readonly playerPosition: CombatPoint;
  readonly playerAlive: boolean;
  readonly move: (position: CombatPoint, displacement: CombatPoint) => CombatPoint;
  readonly damagePlayer: (amount: number) => void;
}

export class RoamingZombie implements CombatTarget {
  readonly combatId: string;
  readonly displayName = ROAMING_ZOMBIE_PROFILE.displayName;
  readonly health = new HealthPool(ROAMING_ZOMBIE_PROFILE.maxHealth);
  private readonly position: { x: number; y: number; z: number };
  private currentState: EnemyState = "idle";
  private elapsed = 0;
  private impacted = false;
  private provoked = false;
  private yaw = 0;
  private distance = Number.POSITIVE_INFINITY;
  private latestAttack: EnemyAttackResult = null;

  constructor(combatId: string, position: CombatPoint) {
    this.combatId = combatId;
    this.position = { x: position.x, y: position.y, z: position.z };
  }

  get state(): EnemyState { return this.currentState; }
  get facingYaw(): number { return this.yaw; }
  get playerDistance(): number { return this.distance; }
  get lastAttackResult(): EnemyAttackResult { return this.latestAttack; }
  get attackProgress(): number { return this.currentState === "attack" || this.currentState === "recovery" ? this.elapsed / ROAMING_ZOMBIE_PROFILE.attackCycle : 0; }
  get isAggressive(): boolean { return this.currentState === "chase" || this.currentState === "attack" || this.currentState === "recovery"; }

  getCombatPosition(): CombatPoint { return this.position; }
  isCombatAlive(): boolean { return this.health.alive; }

  receiveDamage(amount: number): DamageResult {
    const result = this.health.applyDamage(amount);
    if (result.applied > 0 && this.health.alive) this.provoked = true;
    if (result.becameDead) this.markDead();
    return result;
  }

  update(delta: number, context: EnemyUpdateContext): void {
    if (!this.health.alive) { this.markDead(); return; }
    this.distance = this.distanceTo(context.playerPosition);
    if (!context.playerAlive) { this.disengage(); return; }
    if (delta <= 0) return;

    if (this.currentState === "idle") {
      if (!this.provoked && this.distance > ROAMING_ZOMBIE_PROFILE.acquireRange) return;
      this.currentState = "chase";
      this.provoked = false;
    }

    if (this.currentState === "chase") {
      if (this.distance > ROAMING_ZOMBIE_PROFILE.loseRange) { this.disengage(); return; }
      this.face(context.playerPosition, delta);
      if (this.distance <= ROAMING_ZOMBIE_PROFILE.attackStartRange) { this.startAttack(context.playerPosition); return; }
      const dx = context.playerPosition.x - this.position.x;
      const dz = context.playerPosition.z - this.position.z;
      const inverseDistance = this.distance > 0.0001 ? 1 / this.distance : 0;
      const step = Math.min(ROAMING_ZOMBIE_PROFILE.moveSpeed * delta, Math.max(0, this.distance - ROAMING_ZOMBIE_PROFILE.attackStartRange));
      const moved = context.move(this.position, { x: dx * inverseDistance * step, y: 0, z: dz * inverseDistance * step });
      this.position.x = moved.x;
      this.position.y = moved.y;
      this.position.z = moved.z;
      this.distance = this.distanceTo(context.playerPosition);
      return;
    }

    if (this.currentState !== "attack" && this.currentState !== "recovery") return;
    this.elapsed = Math.min(ROAMING_ZOMBIE_PROFILE.attackCycle, this.elapsed + delta);
    const progress = this.elapsed / ROAMING_ZOMBIE_PROFILE.attackCycle;
    if (!this.impacted && progress >= ROAMING_ZOMBIE_PROFILE.impactNormalizedTime) {
      this.impacted = true;
      this.currentState = "recovery";
      this.distance = this.distanceTo(context.playerPosition);
      if (this.health.alive && context.playerAlive && this.distance <= ROAMING_ZOMBIE_PROFILE.hitRange) {
        this.latestAttack = "hit";
        context.damagePlayer(ROAMING_ZOMBIE_PROFILE.damage);
      } else this.latestAttack = "miss";
    }
    if (this.elapsed < ROAMING_ZOMBIE_PROFILE.attackCycle) return;
    this.elapsed = 0;
    this.impacted = false;
    this.distance = this.distanceTo(context.playerPosition);
    if (!context.playerAlive || this.distance > ROAMING_ZOMBIE_PROFILE.loseRange) this.disengage();
    else this.currentState = "chase";
  }

  private startAttack(playerPosition: CombatPoint): void {
    this.currentState = "attack";
    this.elapsed = 0;
    this.impacted = false;
    this.latestAttack = null;
    this.face(playerPosition, Number.POSITIVE_INFINITY);
  }

  private markDead(): void {
    this.currentState = "dead";
    this.elapsed = 0;
    this.impacted = true;
    this.provoked = false;
  }

  private disengage(): void {
    this.currentState = "idle";
    this.elapsed = 0;
    this.impacted = false;
    this.provoked = false;
  }

  private face(target: CombatPoint, delta: number): void {
    const desired = Math.atan2(target.x - this.position.x, target.z - this.position.z);
    const difference = Math.atan2(Math.sin(desired - this.yaw), Math.cos(desired - this.yaw));
    const blend = Number.isFinite(delta) ? 1 - Math.exp(-8 * delta) : 1;
    this.yaw += difference * blend;
  }

  private distanceTo(point: CombatPoint): number {
    const dx = point.x - this.position.x;
    const dz = point.z - this.position.z;
    return Math.sqrt(dx * dx + dz * dz);
  }
}
