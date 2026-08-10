export type StatusEffectId = "regeneration" | "bleeding" | "slow";

export interface StatusEffectDef {
  readonly id: StatusEffectId;
  readonly title: string;
  readonly duration: number;
  readonly stackPolicy: "refresh" | "ignore";
  readonly tickInterval: number;
  readonly healthPerTick?: number;
  readonly moveSpeedMul?: number;
}

export const STATUS_EFFECT_DEFS: Readonly<Record<StatusEffectId, StatusEffectDef>> = Object.freeze({
  regeneration: Object.freeze({
    id: "regeneration",
    title: "Regeneration",
    duration: 8,
    stackPolicy: "refresh" as const,
    tickInterval: 1,
    healthPerTick: 2,
  }),
  bleeding: Object.freeze({
    id: "bleeding",
    title: "Bleeding",
    duration: 6,
    stackPolicy: "refresh" as const,
    tickInterval: 1,
    healthPerTick: -3,
  }),
  slow: Object.freeze({
    id: "slow",
    title: "Slow",
    duration: 4,
    stackPolicy: "refresh" as const,
    tickInterval: 0.5,
    moveSpeedMul: 0.7,
  }),
});

interface ActiveStatus {
  id: StatusEffectId;
  remaining: number;
  tickAccum: number;
}

export interface StatusTickResult {
  readonly healthDelta: number;
  readonly moveSpeedMul: number;
  readonly active: readonly StatusEffectId[];
}

/** Lightweight timed status effects (player). Deterministic via delta-time. */
export class StatusEffectSystem {
  private readonly active = new Map<StatusEffectId, ActiveStatus>();

  apply(id: StatusEffectId): void {
    const def = STATUS_EFFECT_DEFS[id];
    const existing = this.active.get(id);
    if (existing && def.stackPolicy === "ignore") return;
    this.active.set(id, { id, remaining: def.duration, tickAccum: 0 });
  }

  clear(): void { this.active.clear(); }

  ids(): readonly StatusEffectId[] { return Object.freeze([...this.active.keys()]); }

  tick(delta: number): StatusTickResult {
    let healthDelta = 0;
    let moveSpeedMul = 1;
    for (const [id, state] of [...this.active.entries()]) {
      const def = STATUS_EFFECT_DEFS[id];
      state.remaining -= delta;
      state.tickAccum += delta;
      while (state.tickAccum >= def.tickInterval) {
        state.tickAccum -= def.tickInterval;
        if (def.healthPerTick) healthDelta += def.healthPerTick;
      }
      if (def.moveSpeedMul !== undefined) moveSpeedMul *= def.moveSpeedMul;
      if (state.remaining <= 0) this.active.delete(id);
    }
    return Object.freeze({
      healthDelta,
      moveSpeedMul,
      active: Object.freeze([...this.active.keys()]),
    });
  }
}
