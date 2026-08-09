import type { HarvestableResource } from "./HarvestableResource";
import type { HarvestPhase } from "./HarvestingTypes";

export interface SwingTiming { duration: number; impactNormalizedTime: number }
export interface HarvestSessionEvents { impact: boolean; completedCycle: boolean; cancelled: boolean }

export class HarvestingSession {
  target: HarvestableResource | null = null;
  phase: HarvestPhase = "idle";
  elapsed = 0;
  impactDelivered = false;
  actionHeld = false;

  get active(): boolean { return this.target !== null; }

  begin(target: HarvestableResource, actionHeld: boolean): void {
    this.target = target;
    this.phase = "aligning";
    this.elapsed = 0;
    this.impactDelivered = false;
    this.actionHeld = actionHeld;
  }

  update(
    delta: number,
    timing: SwingTiming,
    actionHeld: boolean,
    facingAligned: boolean,
    valid: boolean,
    movementMagnitude: number,
    movementCancelThreshold: number,
    toolAvailable: boolean,
  ): HarvestSessionEvents {
    const events = { impact: false, completedCycle: false, cancelled: false };
    if (!this.target) return events;
    this.actionHeld = actionHeld;
    if (!valid || !toolAvailable || movementMagnitude > movementCancelThreshold) {
      this.cancel();
      events.cancelled = true;
      return events;
    }
    if (this.phase === "aligning") {
      if (!facingAligned) return events;
      this.phase = "wind-up";
      this.elapsed = 0;
    }
    this.elapsed = Math.min(timing.duration, this.elapsed + delta);
    const impactTime = timing.duration * timing.impactNormalizedTime;
    if (!this.impactDelivered && this.elapsed >= impactTime) {
      this.impactDelivered = true;
      this.phase = "recovery";
      events.impact = true;
    }
    if (this.elapsed >= timing.duration) {
      events.completedCycle = true;
      if (actionHeld && this.target.isInteractionEnabled()) {
        this.elapsed = 0;
        this.impactDelivered = false;
        this.phase = "wind-up";
      } else this.cancel();
    }
    return events;
  }

  normalizedProgress(timing: SwingTiming): number {
    return timing.duration > 0 ? Math.min(1, this.elapsed / timing.duration) : 0;
  }

  cancel(): void {
    this.target = null;
    this.phase = "idle";
    this.elapsed = 0;
    this.impactDelivered = false;
    this.actionHeld = false;
  }
}
