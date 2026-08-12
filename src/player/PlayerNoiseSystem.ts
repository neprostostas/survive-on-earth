/**
 * Continuous footfall + short combat/harvest bursts (LDOE noise radius).
 * Domain-only — no rendering.
 */
export type NoiseBurstKind = "melee" | "harvest" | "gun" | "hard-land";

export class PlayerNoiseSystem {
  private continuous = 0;
  private burst = 0;
  private moving = false;
  private sneaking = false;
  private sprinting = false;

  get level(): number {
    return Math.min(1, Math.max(this.continuous, this.burst));
  }

  /**
   * World-unit radius other agents can hear the player from.
   * Combines gait continuous footprint + decaying burst spikes.
   */
  get hearRadius(): number {
    const gait = this.gaitRadius();
    const burstPad = this.burst * 5.2;
    return gait + burstPad;
  }

  setLocomotion(params: {
    readonly moving: boolean;
    readonly sneaking: boolean;
    readonly sprinting: boolean;
  }): void {
    this.moving = params.moving;
    this.sneaking = params.sneaking;
    this.sprinting = params.sprinting && !params.sneaking;
  }

  tick(delta: number): void {
    if (delta <= 0) return;
    this.burst = Math.max(0, this.burst - delta * 2.6);
    this.continuous = this.gaitLevel();
  }

  /** One-shot loud event (swing land, tool impact, firearm). */
  emitBurst(kind: NoiseBurstKind): void {
    const amount: Record<NoiseBurstKind, number> = {
      melee: 0.82,
      harvest: 0.7,
      gun: 1,
      "hard-land": 0.45,
    };
    this.burst = Math.max(this.burst, amount[kind]);
  }

  private gaitLevel(): number {
    if (this.sneaking) return this.moving ? 0.12 : 0.04;
    if (this.sprinting && this.moving) return 1;
    if (this.moving) return 0.48;
    return 0.08;
  }

  private gaitRadius(): number {
    if (this.sneaking) return this.moving ? 0.55 : 0.25;
    if (this.sprinting && this.moving) return 3.85;
    if (this.moving) return 1.7;
    return 0.55;
  }
}
