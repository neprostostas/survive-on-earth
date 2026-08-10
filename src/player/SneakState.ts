/** Sneak posture + LDOE-style combat / detection modifiers. */
export class SneakState {
  private active = false;
  /** Crawl speed vs walk (~LDOE crouch). */
  private readonly moveMultiplier = 0.55;
  /** Crouch melee damage multiplier (LDOE sneak strike). */
  private readonly sneakAttackMultiplier = 3;

  get isSneaking(): boolean { return this.active; }
  get moveMul(): number { return this.active ? this.moveMultiplier : 1; }
  /** Damage scale while crouched (×3). Standing = 1. */
  get attackMul(): number { return this.active ? this.sneakAttackMultiplier : 1; }

  setActive(active: boolean): void {
    this.active = active;
  }

  toggle(): void {
    this.setActive(!this.active);
  }
}
