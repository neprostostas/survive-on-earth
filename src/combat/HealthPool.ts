export interface HealthSnapshot {
  readonly maxHealth: number;
  readonly currentHealth: number;
  readonly alive: boolean;
  readonly dead: boolean;
}

export interface DamageResult {
  readonly requested: number;
  readonly applied: number;
  readonly before: number;
  readonly current: number;
  readonly becameDead: boolean;
}

export type HealthListener = (snapshot: HealthSnapshot, result: DamageResult) => void;

export class HealthPool {
  private _maxHealth: number;
  private current: number;
  private readonly listeners = new Set<HealthListener>();

  constructor(maxHealth: number) {
    if (!Number.isFinite(maxHealth) || maxHealth <= 0) throw new RangeError(`Invalid max health: ${maxHealth}`);
    this._maxHealth = maxHealth;
    this.current = maxHealth;
  }

  get maxHealth(): number { return this._maxHealth; }
  get currentHealth(): number { return this.current; }
  get alive(): boolean { return this.current > 0; }
  get dead(): boolean { return !this.alive; }

  getSnapshot(): HealthSnapshot {
    return Object.freeze({ maxHealth: this._maxHealth, currentHealth: this.current, alive: this.alive, dead: this.dead });
  }

  /**
   * Update max HP. Positive gains also heal by the delta (LDOE vitality feel).
   * Current is clamped when max shrinks.
   */
  setMaxHealth(next: number): void {
    if (!Number.isFinite(next) || next <= 0) throw new RangeError(`Invalid max health: ${next}`);
    const prev = this._maxHealth;
    this._maxHealth = next;
    if (next > prev && this.alive) {
      this.current = Math.min(this._maxHealth, this.current + (next - prev));
    } else {
      this.current = Math.min(this._maxHealth, this.current);
    }
    const result = Object.freeze({
      requested: 0,
      applied: 0,
      before: this.current,
      current: this.current,
      becameDead: false,
    });
    for (const listener of this.listeners) listener(this.getSnapshot(), result);
  }

  applyDamage(amount: number): DamageResult {
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError(`Invalid damage: ${amount}`);
    const before = this.current;
    const next = Math.max(0, before - amount);
    const applied = before - next;
    if (applied <= 0) return Object.freeze({ requested: amount, applied: 0, before, current: before, becameDead: false });
    this.current = next;
    const result = Object.freeze({ requested: amount, applied, before, current: next, becameDead: before > 0 && next === 0 });
    const snapshot = this.getSnapshot();
    for (const listener of this.listeners) listener(snapshot, result);
    return result;
  }

  /** Restore HP. Does not revive from dead state unless explicitly allowed. */
  heal(amount: number, options?: { readonly allowFromDead?: boolean }): { applied: number; current: number } {
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError(`Invalid heal: ${amount}`);
    if (this.dead && !options?.allowFromDead) return { applied: 0, current: this.current };
    const before = this.current;
    const next = Math.min(this._maxHealth, before + amount);
    const applied = next - before;
    if (applied <= 0) return { applied: 0, current: before };
    this.current = next;
    const result = Object.freeze({ requested: amount, applied, before, current: next, becameDead: false });
    for (const listener of this.listeners) listener(this.getSnapshot(), result);
    return { applied, current: next };
  }

  /** Respawn / revive: set hp and restore alive. */
  restoreFull(): void {
    this.current = this._maxHealth;
    const result = Object.freeze({ requested: this._maxHealth, applied: this._maxHealth, before: 0, current: this._maxHealth, becameDead: false });
    for (const listener of this.listeners) listener(this.getSnapshot(), result);
  }

  setCurrent(value: number): void {
    this.current = Math.max(0, Math.min(this._maxHealth, value));
  }

  subscribe(listener: HealthListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
