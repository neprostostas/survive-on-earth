import { COMBAT_CONFIG, FISTS_COMBAT_PROFILE } from "./combatConfig.ts";
import { combatDistanceSquared, type CombatPoint, type CombatTarget } from "./CombatTarget.ts";
import type { DamageResult } from "./HealthPool.ts";
import type { CombatTargetSystem } from "./CombatTargetSystem.ts";

export type FistSide = "left" | "right";
export type AttackState = "ready" | "attacking" | "recovery";
export type AttackRequestStatus = "started" | "cooldown" | "no-target" | "out-of-range" | "blocked-by-ui";

export interface CombatPlayerAdapter {
  getCombatPosition(): CombatPoint;
  faceCombatTarget(position: CombatPoint): void;
  applyFistAttackPose(progress: number, fist: FistSide): void;
  clearFistAttackPose(): void;
}

export interface CombatImpact {
  readonly target: CombatTarget;
  readonly damage: DamageResult;
}

export class MeleeCombatSystem {
  private readonly targets: CombatTargetSystem;
  private readonly player: CombatPlayerAdapter;
  private readonly beforeAttack: () => void;
  private readonly onImpact: (impact: CombatImpact) => void;
  private elapsed = 0;
  private impacted = false;
  private locked: CombatTarget | null = null;
  private fist: FistSide = "right";
  private nextFist: FistSide = "right";
  private lastStatus: AttackRequestStatus | null = null;
  private impacts = 0;

  constructor(targets: CombatTargetSystem, player: CombatPlayerAdapter, beforeAttack: () => void, onImpact: (impact: CombatImpact) => void) {
    this.targets = targets;
    this.player = player;
    this.beforeAttack = beforeAttack;
    this.onImpact = onImpact;
  }

  get state(): AttackState { return !this.locked ? "ready" : this.impacted ? "recovery" : "attacking"; }
  get movementCommitted(): boolean { return this.locked !== null && !this.impacted; }
  get lockedTarget(): CombatTarget | null { return this.locked; }
  get lastAttackStatus(): AttackRequestStatus | null { return this.lastStatus; }
  get impactCount(): number { return this.impacts; }
  /** 0..1 through the current fist attack cycle; 0 when ready. */
  get attackProgress(): number {
    if (!this.locked) return 0;
    return this.elapsed / FISTS_COMBAT_PROFILE.cycleDuration;
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
    this.locked = target;
    this.elapsed = 0;
    this.impacted = false;
    this.fist = this.nextFist;
    this.nextFist = this.nextFist === "right" ? "left" : "right";
    this.player.faceCombatTarget(target.getCombatPosition());
    this.player.applyFistAttackPose(0, this.fist);
    return this.setStatus("started");
  }

  update(delta: number): void {
    if (!this.locked || delta <= 0) return;
    this.elapsed = Math.min(FISTS_COMBAT_PROFILE.cycleDuration, this.elapsed + delta);
    const progress = this.elapsed / FISTS_COMBAT_PROFILE.cycleDuration;
    this.player.applyFistAttackPose(progress, this.fist);
    if (!this.impacted && progress >= FISTS_COMBAT_PROFILE.impactNormalizedTime) {
      this.impacted = true;
      const target = this.locked;
      if (target.isCombatAlive() && this.targets.isRegistered(target) && this.inHitRange(target)) {
        const damage = target.receiveDamage(FISTS_COMBAT_PROFILE.damage);
        if (damage.applied > 0) {
          this.impacts += 1;
          this.onImpact(Object.freeze({ target, damage }));
        }
      }
    }
    if (this.elapsed >= FISTS_COMBAT_PROFILE.cycleDuration) this.finishAttack();
  }

  private inHitRange(target: CombatTarget): boolean {
    return combatDistanceSquared(this.player.getCombatPosition(), target.getCombatPosition()) <= COMBAT_CONFIG.meleeHitRange ** 2;
  }

  private finishAttack(): void {
    this.player.clearFistAttackPose();
    this.locked = null;
    this.elapsed = 0;
    this.impacted = false;
  }

  private setStatus(status: AttackRequestStatus): AttackRequestStatus {
    this.lastStatus = status;
    return status;
  }
}
