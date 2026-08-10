export type FactionId =
  | "frontier-survivors"
  | "ironbound-collective"
  | "wayfarer-network"
  | "ash-jackals";

export type ReputationTier = "unknown" | "accepted" | "trusted" | "ally" | "hostile";

export interface FactionDef {
  readonly id: FactionId;
  readonly title: string;
  readonly philosophy: string;
  readonly hostileByDefault: boolean;
}

export const FACTION_DEFS: readonly FactionDef[] = Object.freeze([
  Object.freeze({
    id: "frontier-survivors" as const,
    title: "Frontier Survivors",
    philosophy: "Community camps, trade, mutual aid.",
    hostileByDefault: false,
  }),
  Object.freeze({
    id: "ironbound-collective" as const,
    title: "Ironbound Collective",
    philosophy: "Industrial fortification, metal scarcity, fort economy.",
    hostileByDefault: false,
  }),
  Object.freeze({
    id: "wayfarer-network" as const,
    title: "Wayfarer Network",
    philosophy: "Scouts, maps, rare trade routes.",
    hostileByDefault: false,
  }),
  Object.freeze({
    id: "ash-jackals" as const,
    title: "Ash Jackals",
    philosophy: "Raiders who tax routes with steel and ambush.",
    hostileByDefault: true,
  }),
]);

export interface FactionState {
  readonly id: FactionId;
  points: number;
}

const FRIENDLY_TIERS: ReadonlyArray<{ tier: ReputationTier; min: number }> = Object.freeze([
  Object.freeze({ tier: "unknown" as const, min: 0 }),
  Object.freeze({ tier: "accepted" as const, min: 25 }),
  Object.freeze({ tier: "trusted" as const, min: 75 }),
  Object.freeze({ tier: "ally" as const, min: 150 }),
]);

export class ReputationSystem {
  private readonly factions = new Map<FactionId, FactionState>(
    FACTION_DEFS.map((f) => [f.id, { id: f.id, points: f.hostileByDefault ? 0 : 0 }]),
  );

  getPoints(id: FactionId): number {
    return this.factions.get(id)?.points ?? 0;
  }

  tier(id: FactionId): ReputationTier {
    const def = FACTION_DEFS.find((f) => f.id === id);
    const points = this.getPoints(id);
    if (def?.hostileByDefault && points < 50) return "hostile";
    let current: ReputationTier = "unknown";
    for (const row of FRIENDLY_TIERS) {
      if (points >= row.min) current = row.tier;
    }
    return current;
  }

  add(id: FactionId, amount: number): void {
    const state = this.factions.get(id);
    if (!state || amount === 0) return;
    state.points = Math.max(0, state.points + amount);
  }

  defs(): readonly FactionDef[] { return FACTION_DEFS; }

  serialize(): Record<string, number> {
    return Object.fromEntries([...this.factions.entries()].map(([id, s]) => [id, s.points]));
  }

  load(data: Record<string, number> | undefined): void {
    for (const state of this.factions.values()) state.points = 0;
    if (!data) return;
    for (const [id, points] of Object.entries(data)) {
      const state = this.factions.get(id as FactionId);
      if (state) state.points = Math.max(0, points);
    }
  }
}
