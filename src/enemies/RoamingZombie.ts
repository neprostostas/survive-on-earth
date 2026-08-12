import type { CombatPoint, CombatTarget } from "../combat/CombatTarget.ts";
import { HealthPool, type DamageResult } from "../combat/HealthPool.ts";
import { getEnemyArchetype, type EnemyArchetype, type EnemyArchetypeId } from "./EnemyArchetypes.ts";
import { angleFromFacingToTarget, computeAwarenessMeter, idleEnemyNoticesPlayer } from "./enemyDetection.ts";
import { ROAMING_ZOMBIE_PROFILE } from "./enemyConfig.ts";

export type EnemyState = "idle" | "alert" | "investigate" | "chase" | "attack" | "recovery" | "dead";
export type EnemyAttackResult = "hit" | "miss" | null;

/** Combat flavor: spitters / marksmen hit from further out. */
export type EnemyCombatRole = "melee" | "spit" | "ranged" | "brute" | "boss";

/** Soft-alert awareness threshold that can start a look-and-listen before walk. */
export const ENEMY_ALERT_AWARENESS = 0.28;
/** After this long in alert with stable interest, walk to last-known. */
export const ENEMY_INVESTIGATE_AFTER_ALERT = 0.55;
/** Max time spent moving to/at a investigation point. */
export const ENEMY_INVESTIGATE_DURATION = 3.6;
/** Walk fraction while investigating a noise / last-known locus. */
export const ENEMY_INVESTIGATE_SPEED_FRACTION = 0.72;

export interface EnemyUpdateContext {
  readonly playerPosition: CombatPoint;
  readonly playerAlive: boolean;
  /** Crouch / sneak — silences hearing; only frontal vision spots you. */
  readonly playerSneaking: boolean;
  /** Running (standing sprint) — louder footfalls. */
  readonly playerSprinting: boolean;
  /**
   * Live player noise hear radius in world units (gait + combat/harvest burst).
   * Combined with acquire profile fractions in detection.
   */
  readonly playerNoiseRadius: number;
  /** 0..1 global noise loudness (for proximity soft-alert only). */
  readonly playerNoiseLevel: number;
  /** Multiplier on archetype acquireRange (night pressure). */
  readonly acquireRangeMul?: number;
  /** Multiplier on playerNoiseRadius hearing (night pressure). */
  readonly hearRangeMul?: number;
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
  /** 0..1 presentation meter (yellow → red bars). */
  private awareness = 0;
  private searchTimer = 0;
  /** Last heard/seen player locus for investigate walks. */
  private lastKnown: { x: number; z: number } | null = null;

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
  /** Soft awareness 0..1 for threat pips / HUD (not gameplay state alone). */
  get alertLevel(): number {
    if (this.currentState === "dead") return 0;
    if (this.isAggressive) return 1;
    if (this.currentState === "investigate") return Math.max(this.awareness, 0.72);
    if (this.currentState === "alert") return Math.max(this.awareness, 0.55);
    return this.awareness;
  }
  /** Snapshot of investigate target (test / debug). */
  get lastKnownPosition(): { x: number; z: number } | null {
    return this.lastKnown ? { ...this.lastKnown } : null;
  }

  getCombatPosition(): CombatPoint { return this.position; }
  isCombatAlive(): boolean { return this.health.alive; }

  receiveDamage(amount: number): DamageResult {
    const result = this.health.applyDamage(amount);
    if (result.applied > 0 && this.health.alive) this.provoked = true;
    if (result.becameDead) this.markDead();
    return result;
  }

  /**
   * Pack call: idle/alert/investigate agents jump straight into chase (shared agro).
   * No-op if already fighting or dead.
   */
  callToArms(): boolean {
    if (!this.health.alive || this.currentState === "dead") return false;
    if (this.currentState === "chase" || this.currentState === "attack" || this.currentState === "recovery") {
      return false;
    }
    this.currentState = "chase";
    this.provoked = false;
    this.awareness = 1;
    this.searchTimer = 0;
    return true;
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

    if (this.currentState === "idle" || this.currentState === "alert" || this.currentState === "investigate") {
      const sample = this.buildDetectionSample(context);
      this.awareness = Math.max(this.awareness * (1 - delta * 0.35), computeAwarenessMeter(sample));

      if (this.provoked || idleEnemyNoticesPlayer(sample)) {
        this.rememberPlayer(context.playerPosition);
        this.currentState = "chase";
        this.provoked = false;
        this.awareness = 1;
        this.searchTimer = 0;
      } else if (this.currentState === "idle" && this.awareness >= ENEMY_ALERT_AWARENESS) {
        // Soft face-only notice (near miss footfall / cone edge).
        this.rememberPlayer(context.playerPosition);
        this.currentState = "alert";
        this.searchTimer = 0;
      }

      if (this.currentState === "alert") {
        this.face(context.playerPosition, delta * 0.55);
        this.searchTimer += delta;
        this.rememberPlayer(context.playerPosition);
        // After a short look, walk to last-known noise locus.
        if (
          this.searchTimer >= ENEMY_INVESTIGATE_AFTER_ALERT
          && this.awareness >= ENEMY_ALERT_AWARENESS
          && this.distance > 1.15
          && this.lastKnown
        ) {
          this.currentState = "investigate";
          this.searchTimer = 0;
          return;
        }
        if (this.searchTimer > 2.4 || this.awareness < 0.15) {
          this.disengage();
        }
        return;
      }

      if (this.currentState === "investigate") {
        this.searchTimer += delta;
        // Refresh last-known while soft-tracking distant player noise.
        if (this.awareness >= 0.4) this.rememberPlayer(context.playerPosition);
        if (this.searchTimer > ENEMY_INVESTIGATE_DURATION || !this.lastKnown) {
          this.disengage();
          return;
        }
        const known = this.lastKnown;
        const dx = known.x - this.position.x;
        const dz = known.z - this.position.z;
        const distKnown = Math.hypot(dx, dz);
        if (distKnown <= 0.55) {
          // Arrived — short scan at the locus, then drop if nothing confirmed.
          this.face({ x: known.x, y: 0, z: known.z }, delta);
          if (this.searchTimer > ENEMY_INVESTIGATE_DURATION * 0.55) this.disengage();
          return;
        }
        this.face({ x: known.x, y: 0, z: known.z }, delta);
        const inv = distKnown > 0.0001 ? 1 / distKnown : 0;
        const speed = profile.moveSpeed * ENEMY_INVESTIGATE_SPEED_FRACTION;
        const step = Math.min(speed * delta, distKnown);
        const moved = context.move(this.position, {
          x: dx * inv * step,
          y: 0,
          z: dz * inv * step,
        });
        this.position.x = moved.x;
        this.position.y = moved.y;
        this.position.z = moved.z;
        this.distance = this.distanceTo(context.playerPosition);
        return;
      }

      if (this.currentState === "idle") return;
    }

    if (this.currentState === "chase") {
      // Instant idle at lose range — combat harness / LDOE hard leash (no linger search).
      if (this.distance > profile.loseRange) { this.disengage(); return; }
      this.rememberPlayer(context.playerPosition);
      this.awareness = 1;
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

  private rememberPlayer(player: CombatPoint): void {
    this.lastKnown = { x: player.x, z: player.z };
  }

  private buildDetectionSample(context: EnemyUpdateContext) {
    const angle = angleFromFacingToTarget(
      this.position.x,
      this.position.z,
      this.yaw,
      context.playerPosition.x,
      context.playerPosition.z,
    );
    return {
      distance: this.distance,
      angleFromFacing: angle,
      sneaking: context.playerSneaking,
      sprinting: context.playerSprinting && !context.playerSneaking,
      acquireRange: this.archetype.acquireRange * (context.acquireRangeMul ?? 1),
      playerNoiseRadius: context.playerNoiseRadius * (context.hearRangeMul ?? 1),
    };
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
    this.awareness = 0;
    this.searchTimer = 0;
    this.lastKnown = null;
  }

  private disengage(): void {
    this.currentState = "idle";
    this.elapsed = 0;
    this.impacted = false;
    this.provoked = false;
    this.awareness = 0;
    this.searchTimer = 0;
    this.lastKnown = null;
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
