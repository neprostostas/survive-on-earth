export type NeedListener = (current: number, max: number) => void;

/** Generic clamped survival resource used by hunger / thirst / energy. */
export class NeedPool {
  readonly max: number;
  private current: number;
  private readonly listeners = new Set<NeedListener>();

  constructor(max: number, initial: number) {
    if (!Number.isFinite(max) || max <= 0) throw new RangeError(`Invalid need max: ${max}`);
    this.max = max;
    this.current = Math.max(0, Math.min(max, initial));
  }

  get value(): number { return this.current; }
  get ratio(): number { return this.current / this.max; }
  get isEmpty(): boolean { return this.current <= 0; }
  get isFull(): boolean { return this.current >= this.max; }

  set(value: number): void {
    const next = Math.max(0, Math.min(this.max, value));
    if (next === this.current) return;
    this.current = next;
    this.emit();
  }

  restore(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const before = this.current;
    this.set(this.current + amount);
    return this.current - before;
  }

  drain(amount: number): number {
    if (!Number.isFinite(amount) || amount <= 0) return 0;
    const before = this.current;
    this.set(this.current - amount);
    return before - this.current;
  }

  /** Continuous drain: amountPerSecond * deltaSeconds. */
  tickDrain(amountPerSecond: number, deltaSeconds: number): number {
    if (deltaSeconds <= 0 || amountPerSecond <= 0) return 0;
    return this.drain(amountPerSecond * deltaSeconds);
  }

  tickRegen(amountPerSecond: number, deltaSeconds: number): number {
    if (deltaSeconds <= 0 || amountPerSecond <= 0) return 0;
    return this.restore(amountPerSecond * deltaSeconds);
  }

  subscribe(listener: NeedListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private emit(): void {
    for (const listener of this.listeners) listener(this.current, this.max);
  }
}

export class HungerPool extends NeedPool {
  constructor(max = 100, initial = 100) { super(max, initial); }
}
export class ThirstPool extends NeedPool {
  constructor(max = 100, initial = 100) { super(max, initial); }
}
export class EnergyPool extends NeedPool {
  constructor(max = 100, initial = 100) { super(max, initial); }
}
