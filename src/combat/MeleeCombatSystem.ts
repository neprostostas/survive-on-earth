import { COMBAT_CONFIG } from "./combatConfig.ts";
import { combatDistanceSquared, type CombatPoint, type CombatTarget } from "./CombatTarget.ts";
import type { DamageResult } from "./HealthPool.ts";
import type { CombatTargetSystem } from "./CombatTargetSystem.ts";
import type { MeleeCombatProfile } from "./MeleeCombatProfile.ts";
import { UNARMED_MELEE_PROFILE } from "./MeleeCombatProfile.ts";

export type FistSide = "left" | "right";
export type AttackState = "ready" | "attacking" | "recovery";
export type AttackRequestStatus = "started" | "cooldown" | "no-target" | "out-of-range" | "blocked-by-ui";

export interface CombatPlayerAdapter {
  getCombatPosition(): CombatPoint;
  faceCombatTarget(position: CombatPoint): void;
  applyMeleeAttackPose(progress: number, profile: MeleeCombatProfile, fist: FistSide): void;
  clearMeleeAttackPose(): void;
}

export interface CombatImpact {
  readonly target: CombatTarget;
  readonly damage: DamageResult;
  readonly profile: MeleeCombatProfile;
}

export class MeleeCombatSystem {
  private readonly targets: CombatTargetSystem;
  private readonly player: CombatPlayerAdapter;
  private readonly resolveProfile: () => MeleeCombatProfile;
  private readonly beforeAttack: () => void;
  private readonly onImpact: (impact: CombatImpact) => void;
  private elapsed = 0;
  private impacted = false;
  private locked: CombatTarget | null = null;
  /** Profile locked for the entire in-flight swing (no mid-swing weapon changes). */
  private swingProfile: MeleeCombatProfile = UNARMED_MELEE_PROFILE;
  private fist: FistSide = "right";
  private nextFist: FistSide = "right";
  private lastStatus: AttackRequestStatus | null = null;
  private impacts = 0;

  constructor(
    targets: CombatTargetSystem,
    player: CombatPlayerAdapter,
    resolveProfile: () => MeleeCombatProfile,
    beforeAttack: () => void,
    onImpact: (impact: CombatImpact) => void,
  ) {
    this.targets = targets;
    this.player = player;
    this.resolveProfile = resolveProfile;
    this.beforeAttack = beforeAttack;
    this.onImpact = onImpact;
  }

  get state(): AttackState { return !this.locked ? "ready" : this.impacted ? "recovery" : "attacking"; }
  get movementCommitted(): boolean { return this.locked !== null && !this.impacted; }
  get lockedTarget(): CombatTarget | null { return this.locked; }
  get lastAttackStatus(): AttackRequestStatus | null { return this.lastStatus; }
  get impactCount(): number { return this.impacts; }
  get activeProfile(): MeleeCombatProfile { return this.locked ? this.swingProfile : this.resolveProfile(); }
  /** 0..1 through the current attack cycle; 0 when ready. */
  get attackProgress(): number {
    if (!this.locked) return 0;
    return this.elapsed / this.swingProfile.cycleDuration;
  }
  get impactReached(): boolean { return this.impacted; }

  cancelAttack(): void {
    if (!this.locked) return;
    this.finishAttack();
  }

  requestAttack(blockedByUi = false): AttackRequestStatus {
    if (blockedByUi) return this.setStatus("blocked-by-ui");
    if (this.locked) return this.setStatus("cooldown");
    const target = this.targets.current;
    if (!target || !target.isCombatAlive() || !this.targets.isRegistered(target)) return this.setStatus("no-target");
    if (!this.inHitRange(target)) return this.setStatus("out-of-range");
    this.beforeAttack();
    this.swingProfile = this.resolveProfile();
    this.locked = target;
    this.elapsed = 0;
    this.impacted = false;
    this.fist = this.nextFist;
    this.nextFist = this.nextFist === "right" ? "left" : "right";
    this.player.faceCombatTarget(target.getCombatPosition());
    this.player.applyMeleeAttackPose(0, this.swingProfile, this.fist);
    return this.setStatus("started");
  }

  update(delta: number): void {
    if (!this.locked || delta <= 0) return;
    const profile = this.swingProfile;
    this.elapsed = Math.min(profile.cycleDuration, this.elapsed + delta);
    const progress = this.elapsed / profile.cycleDuration;
    this.player.applyMeleeAttackPose(progress, profile, this.fist);
    if (!this.impacted && progress >= profile.impactNormalizedTime) {
      this.impacted = true;
      const target = this.locked;
      if (target.isCombatAlive() && this.targets.isRegistered(target) && this.inHitRange(target)) {
        const damage = target.receiveDamage(profile.damage);
        if (damage.applied > 0) {
          this.impacts += 1;
          this.onImpact(Object.freeze({ target, damage, profile }));
        }
      }
    }
    if (this.elapsed >= profile.cycleDuration) this.finishAttack();
  }

  private inHitRange(target: CombatTarget): boolean {
    return combatDistanceSquared(this.player.getCombatPosition(), target.getCombatPosition()) <= COMBAT_CONFIG.meleeHitRange ** 2;
  }

  private finishAttack(): void {
    this.player.clearMeleeAttackPose();
    this.locked = null;
    this.elapsed = 0;
    this.impacted = false;
    this.swingProfile = UNARMED_MELEE_PROFILE;
  }

  private setStatus(status: AttackRequestStatus): AttackRequestStatus {
    this.lastStatus = status;
    return status;
  }
}
