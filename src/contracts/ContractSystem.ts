/**
 * Faction contracts / bounty / raid contracts — offline generator.
 */

import type { FactionId } from "../progression/ReputationSystem.ts";

export type ContractKind =
  | "eliminate"
  | "gather"
  | "deliver"
  | "recover"
  | "explore"
  | "defend"
  | "boss"
  | "raid"
  | "rescue";

export interface ContractDef {
  readonly id: string;
  readonly kind: ContractKind;
  readonly title: string;
  readonly description: string;
  readonly factionId: FactionId;
  readonly difficulty: 1 | 2 | 3 | 4 | 5;
  readonly rewardXp: number;
  readonly rewardReputation: number;
  readonly rewardHint: string;
  readonly targetLocationHint: string;
  completed: boolean;
  claimed: boolean;
}

const TEMPLATES: readonly Omit<ContractDef, "id" | "completed" | "claimed">[] = Object.freeze([
  Object.freeze({ kind: "eliminate" as const, title: "Clear Infected Nest", description: "Eliminate hostiles near the marked ruins.", factionId: "frontier-survivors" as const, difficulty: 2 as const, rewardXp: 40, rewardReputation: 8, rewardHint: "medical supplies", targetLocationHint: "forest edge" }),
  Object.freeze({ kind: "gather" as const, title: "Scrap Drive", description: "Deliver refined metal scraps to the fort.", factionId: "ironbound-collective" as const, difficulty: 2 as const, rewardXp: 35, rewardReputation: 10, rewardHint: "metal plates", targetLocationHint: "industrial" }),
  Object.freeze({ kind: "explore" as const, title: "Map the Transit Hubs", description: "Discover metro access points.", factionId: "wayfarer-network" as const, difficulty: 3 as const, rewardXp: 50, rewardReputation: 12, rewardHint: "map intel", targetLocationHint: "greyhaven-transit" }),
  Object.freeze({ kind: "raid" as const, title: "Break the Stockade", description: "Assault an Ash Jackal compound.", factionId: "frontier-survivors" as const, difficulty: 4 as const, rewardXp: 80, rewardReputation: 15, rewardHint: "raid crate", targetLocationHint: "ash-jackal-outpost" }),
  Object.freeze({ kind: "rescue" as const, title: "Lost Scout", description: "Locate a stranded Wayfarer.", factionId: "wayfarer-network" as const, difficulty: 3 as const, rewardXp: 55, rewardReputation: 14, rewardHint: "trade token", targetLocationHint: "old-highway" }),
  Object.freeze({ kind: "boss" as const, title: "Warden Bounty", description: "Challenge the deep bunker guardian.", factionId: "frontier-survivors" as const, difficulty: 5 as const, rewardXp: 120, rewardReputation: 20, rewardHint: "unique parts", targetLocationHint: "bunker-echo-f3" }),
  Object.freeze({ kind: "defend" as const, title: "Hold the Gate", description: "Survive a local raider probe on Home.", factionId: "frontier-survivors" as const, difficulty: 3 as const, rewardXp: 60, rewardReputation: 10, rewardHint: "defense materials", targetLocationHint: "home" }),
  Object.freeze({ kind: "recover" as const, title: "Salvage Convoy Box", description: "Recover locked cargo from a crash site.", factionId: "ironbound-collective" as const, difficulty: 3 as const, rewardXp: 45, rewardReputation: 9, rewardHint: "electronics", targetLocationHint: "world event" }),
  Object.freeze({ kind: "eliminate" as const, title: "Cull Swamp Nests", description: "Thin toxic infected at the hollow.", factionId: "frontier-survivors" as const, difficulty: 3 as const, rewardXp: 50, rewardReputation: 10, rewardHint: "herbs", targetLocationHint: "swamp-hollow" }),
  Object.freeze({ kind: "gather" as const, title: "Timber Quota", description: "Deliver pine and hardwood stock.", factionId: "frontier-survivors" as const, difficulty: 1 as const, rewardXp: 25, rewardReputation: 6, rewardHint: "nails", targetLocationHint: "pine-woods" }),
  Object.freeze({ kind: "gather" as const, title: "Ore Cart", description: "Haul iron and copper to Ironbound.", factionId: "ironbound-collective" as const, difficulty: 3 as const, rewardXp: 55, rewardReputation: 12, rewardHint: "steel scrap", targetLocationHint: "rocky-outcrop" }),
  Object.freeze({ kind: "explore" as const, title: "Chart Waterfront", description: "Survey Greyhaven waterfront blocks.", factionId: "wayfarer-network" as const, difficulty: 3 as const, rewardXp: 45, rewardReputation: 11, rewardHint: "map fragment", targetLocationHint: "greyhaven-waterfront" }),
  Object.freeze({ kind: "raid" as const, title: "Industrial Compound", description: "Clear a reinforced scavenger fort.", factionId: "ironbound-collective" as const, difficulty: 4 as const, rewardXp: 90, rewardReputation: 16, rewardHint: "machine parts", targetLocationHint: "industrial-yard" }),
  Object.freeze({ kind: "boss" as const, title: "Metro Abomination", description: "Hunt the tunnel titan.", factionId: "wayfarer-network" as const, difficulty: 5 as const, rewardXp: 130, rewardReputation: 18, rewardHint: "rare components", targetLocationHint: "metro-central" }),
  Object.freeze({ kind: "recover" as const, title: "Medical Sample", description: "Retrieve sealed samples from St. Marrow.", factionId: "frontier-survivors" as const, difficulty: 4 as const, rewardXp: 70, rewardReputation: 12, rewardHint: "medkit", targetLocationHint: "abandoned-hospital" }),
  Object.freeze({ kind: "defend" as const, title: "Power Line Relay", description: "Hold a temporary generator site.", factionId: "ironbound-collective" as const, difficulty: 3 as const, rewardXp: 55, rewardReputation: 10, rewardHint: "cables", targetLocationHint: "coastal-power-plant" }),
  Object.freeze({ kind: "eliminate" as const, title: "Marauder Wipe", description: "Clear a marauder patrol.", factionId: "frontier-survivors" as const, difficulty: 3 as const, rewardXp: 60, rewardReputation: 12, rewardHint: "ammo", targetLocationHint: "marauder-camp" }),
  Object.freeze({ kind: "explore" as const, title: "Blacksite Recon", description: "Confirm Blacksite perimeter status.", factionId: "wayfarer-network" as const, difficulty: 5 as const, rewardXp: 100, rewardReputation: 15, rewardHint: "intel", targetLocationHint: "blacksite-ruins" }),
]);

export class ContractSystem {
  private readonly active: ContractDef[] = [];
  private readonly board: ContractDef[] = [];
  private nextId = 1;
  private lastRefreshDay = -1;

  get boardContracts(): readonly ContractDef[] { return this.board; }
  get activeContracts(): readonly ContractDef[] { return this.active; }

  /** Refresh board every world day change. */
  tick(worldDay: number): void {
    const day = Math.floor(worldDay);
    if (day === this.lastRefreshDay) return;
    this.lastRefreshDay = day;
    this.board.length = 0;
    const rng = mulberry(day * 9973 + 13);
    const picks = new Set<number>();
    while (picks.size < 3 && picks.size < TEMPLATES.length) {
      picks.add(Math.floor(rng() * TEMPLATES.length));
    }
    for (const idx of picks) {
      const t = TEMPLATES[idx]!;
      this.board.push({
        ...t,
        id: `board-${this.nextId++}`,
        completed: false,
        claimed: false,
      });
    }
  }

  accept(id: string): boolean {
    const idx = this.board.findIndex((c) => c.id === id);
    if (idx < 0) return false;
    const c = this.board.splice(idx, 1)[0]!;
    this.active.push(c);
    return true;
  }

  complete(id: string): ContractDef | null {
    const c = this.active.find((x) => x.id === id);
    if (!c || c.completed) return null;
    c.completed = true;
    return c;
  }

  claim(id: string): ContractDef | null {
    const c = this.active.find((x) => x.id === id);
    if (!c || !c.completed || c.claimed) return null;
    c.claimed = true;
    return c;
  }

  /** Mark first matching kind complete (gameplay hooks). */
  completeByKind(kind: ContractKind): ContractDef | null {
    const c = this.active.find((x) => x.kind === kind && !x.completed);
    return c ? this.complete(c.id) : null;
  }

  /** Force board fill if empty (after load / first open). */
  ensureBoard(worldDay: number): void {
    if (this.board.length > 0) return;
    this.lastRefreshDay = -1;
    this.tick(worldDay);
  }

  serialize(): { active: ContractDef[]; nextId: number; lastRefreshDay: number } {
    return {
      active: this.active.map((c) => ({ ...c })),
      nextId: this.nextId,
      lastRefreshDay: this.lastRefreshDay,
    };
  }

  load(data: { active?: ContractDef[]; nextId?: number; lastRefreshDay?: number } | undefined): void {
    this.active.length = 0;
    this.board.length = 0;
    if (!data) return;
    for (const c of data.active ?? []) this.active.push({ ...c });
    this.nextId = data.nextId ?? 1;
    this.lastRefreshDay = data.lastRefreshDay ?? -1;
  }
}

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}
