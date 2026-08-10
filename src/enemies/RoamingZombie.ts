import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import { HealthPool, type DamageResult } from "../combat/HealthPool.ts";
import { getEnemyArchetype, type EnemyArchetype, type EnemyArchetypeId } from "./EnemyArchetypes.ts";
import { angleFromFacingToTarget, idleEnemyNoticesPlayer } from "./enemyDetection.ts";
import { ROAMING_ZOMBIE_PROFILE } from "./enemyConfig.ts";

export type EnemyState = "idle" | "chase" | "attack" | "recovery" | "dead";
export type EnemyAttackResult = "hit" | "miss" | null;

/** Combat flavor: spitters / marksmen hit from further out. */
export type EnemyCombatRole = "melee" | "spit" | "ranged" | "brute" | "boss";

export interface EnemyUpdateContext {
  readonly playerPosition: CombatPoint;
  readonly playerAlive: boolean;
  /** Crouch / sneak — silences hearing; only frontal vision spots you. */
  readonly playerSneaking: boolean;
  /** Running (standing sprint) — louder footfalls. */
  readonly playerSprinting: boolean;
  readonly move: (position: CombatPoint, displacement: CombatPoint) => CombatPoint;
  readonly damagePlayer: (amount: number) => void;
}

export function combatRoleFor(id: EnemyArchetypeId): EnemyCombatRole {
  if (
    id.includes("warden")
    || id.includes("leviathan")
    || id.includes("sovereign")
    || id.includes("marrow")
    || id === "the-warden"
    || id === "helix-sovereign"
    || id === "metro-leviathan"
    || id === "marrow-warden"
  ) return "boss";
  if (id.includes("screecher") || id.includes("spit") || id.includes("toxic") || id.includes("spore") || id.includes("gas")) {
    return "spit";
  }
  if (id.includes("ranged") || id.includes("sniper") || id.includes("marksman") || id.includes("shotgun")) {
    return "ranged";
  }
  if (id.includes("brute") || id.includes("bloated") || id.includes("bloater") || id.includes("heavy") || id.includes("slag")) {
    return "brute";
  }
  return "melee";
}

function hashFacingYaw(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0x100000000) * Math.PI * 2;
}

export class RoamingZombie implements CombatTarget {
  readonly combatId: string;
  readonly archetypeId: EnemyArchetypeId;
  readonly archetype: EnemyArchetype;
  readonly role: EnemyCombatRole;
  readonly displayName: string;
  readonly health: HealthPool;
  private readonly position: { x: number; y: number; z: number };
  private currentState: EnemyState = "idle";
  private elapsed = 0;
  private impacted = false;
  private provoked = false;
  private yaw = 0;
  private distance = Number.POSITIVE_INFINITY;
  private latestAttack: EnemyAttackResult = null;

  constructor(combatId: string, position: CombatPoint, archetypeId: EnemyArchetypeId = "roaming-zombie") {
    this.combatId = combatId;
    this.archetypeId = archetypeId;
    this.archetype = getEnemyArchetype(archetypeId);
    this.role = combatRoleFor(archetypeId);
    this.displayName = this.archetype.displayName;
    this.health = new HealthPool(this.archetype.maxHealth);
    this.position = { x: position.x, y: position.y, z: position.z };
    this.yaw = hashFacingYaw(combatId);
  }

  get state(): EnemyState { return this.currentState; }
  get facingYaw(): number { return this.yaw; }
  get playerDistance(): number { return this.distance; }
  get lastAttackResult(): EnemyAttackResult { return this.latestAttack; }
  get attackProgress(): number {
    return this.currentState === "attack" || this.currentState === "recovery"
      ? this.elapsed / this.archetype.attackCycle
      : 0;
  }
  get isAggressive(): boolean {
    return this.currentState === "chase" || this.currentState === "attack" || this.currentState === "recovery";
  }

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

    const profile = this.archetype;
    // Spitters / snipers open fire from longer preferred range.
    const startRange = this.role === "spit" || this.role === "ranged"
      ? Math.max(profile.attackStartRange, profile.hitRange * 0.85)
      : profile.attackStartRange;
    const hitRange = this.role === "spit"
      ? Math.max(profile.hitRange, 3.4)
      : this.role === "ranged"
        ? Math.max(profile.hitRange, 5.5)
        : profile.hitRange;

    if (this.currentState === "idle") {
      if (!this.provoked && !this.shouldAcquire(context)) return;
      this.currentState = "chase";
      this.provoked = false;
    }

    if (this.currentState === "chase") {
      if (this.distance > profile.loseRange) { this.disengage(); return; }
      this.face(context.playerPosition, delta);
      if (this.distance <= startRange) { this.startAttack(context.playerPosition); return; }
      const dx = context.playerPosition.x - this.position.x;
      const dz = context.playerPosition.z - this.position.z;
      const inverseDistance = this.distance > 0.0001 ? 1 / this.distance : 0;
      const preferred = this.role === "ranged" ? Math.max(3.2, startRange * 0.9) : startRange;
      const step = Math.min(profile.moveSpeed * delta, Math.max(0, this.distance - preferred));
      const moved = context.move(this.position, {
        x: dx * inverseDistance * step,
        y: 0,
        z: dz * inverseDistance * step,
      });
      this.position.x = moved.x;
      this.position.y = moved.y;
      this.position.z = moved.z;
      this.distance = this.distanceTo(context.playerPosition);
      return;
    }

    if (this.currentState !== "attack" && this.currentState !== "recovery") return;
    this.elapsed = Math.min(profile.attackCycle, this.elapsed + delta);
    const progress = this.elapsed / profile.attackCycle;
    if (!this.impacted && progress >= profile.impactNormalizedTime) {
      this.impacted = true;
      this.currentState = "recovery";
      this.distance = this.distanceTo(context.playerPosition);
      if (this.health.alive && context.playerAlive && this.distance <= hitRange) {
        this.latestAttack = "hit";
        context.damagePlayer(profile.damage);
      } else this.latestAttack = "miss";
    }
    if (this.elapsed < profile.attackCycle) return;
    this.elapsed = 0;
    this.impacted = false;
    this.distance = this.distanceTo(context.playerPosition);
    if (!context.playerAlive || this.distance > profile.loseRange) this.disengage();
    else this.currentState = "chase";
  }

  private shouldAcquire(context: EnemyUpdateContext): boolean {
    const angle = angleFromFacingToTarget(
      this.position.x,
      this.position.z,
      this.yaw,
      context.playerPosition.x,
      context.playerPosition.z,
    );
    return idleEnemyNoticesPlayer({
      distance: this.distance,
      angleFromFacing: angle,
      sneaking: context.playerSneaking,
      sprinting: context.playerSprinting && !context.playerSneaking,
      acquireRange: this.archetype.acquireRange,
    });
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
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    if (Math.abs(dx) + Math.abs(dz) < 0.0001) return;
    const desired = Math.atan2(dx, dz);
    if (!Number.isFinite(delta) || delta === Number.POSITIVE_INFINITY) {
      this.yaw = desired;
      return;
    }
    let diff = desired - this.yaw;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    const maxTurn = 6 * delta;
    this.yaw += Math.max(-maxTurn, Math.min(maxTurn, diff));
  }

  private distanceTo(target: CombatPoint): number {
    const dx = target.x - this.position.x;
    const dz = target.z - this.position.z;
    return Math.hypot(dx, dz);
  }
}

/** @deprecated prefer archetype fields; kept for presentation fallbacks */
export { ROAMING_ZOMBIE_PROFILE };
