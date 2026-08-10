/**
 * Offline PvE raid site generator — not multiplayer.
 * Produces threat profile + loot profile for map travel / dungeon hooks.
 */

export type RaidThreat = 1 | 2 | 3 | 4 | 5;
export type RaidWallTier = "wood" | "reinforced" | "metal" | "advanced";

export interface RaidSite {
  readonly id: string;
  readonly title: string;
  readonly seed: number;
  readonly threat: RaidThreat;
  readonly wallTier: RaidWallTier;
  readonly enemyCount: number;
  readonly hasLeader: boolean;
  readonly lootProfile: string;
  readonly noiseEscalation: boolean;
  readonly factionTag: "ash-jackals" | "independent";
  cleared: boolean;
}

const NAMES = [
  "Ridge Fort", "Ash Stockade", "Broken Yard Compound", "Wire Fence Camp",
  "Scrap Bastion", "Red Banner Outpost", "Hilltop Barricade", "Junk Fort",
  "Pipe Yard Hold", "Sawtooth Camp", "Black Banner Depot", "Rusty Gate Fort",
  "Quarry Barracks", "Floodlight Compound", "Silent Silo Camp", "Chainlink Nest",
  "Wreckyard Keep", "Oil Drum Fort", "Concrete Ring", "Smoke Stack Camp",
];

function mulberry(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

export class RaidSystem {
  private readonly sites = new Map<string, RaidSite>();

  list(): readonly RaidSite[] { return [...this.sites.values()]; }

  generate(seed: number, threat: RaidThreat = 3): RaidSite {
    const rng = mulberry(seed);
    const id = `raid-${seed}`;
    const walls: RaidWallTier[] = ["wood", "reinforced", "metal", "advanced"];
    const wallTier = walls[Math.min(walls.length - 1, threat - 1)]!;
    const site: RaidSite = {
      id,
      title: NAMES[Math.floor(rng() * NAMES.length)]!,
      seed,
      threat,
      wallTier,
      enemyCount: 4 + threat * 2 + Math.floor(rng() * 3),
      hasLeader: threat >= 3,
      lootProfile: threat >= 4 ? "raid-high" : threat >= 2 ? "raid-mid" : "raid-low",
      noiseEscalation: true,
      factionTag: rng() > 0.35 ? "ash-jackals" : "independent",
      cleared: false,
    };
    this.sites.set(id, site);
    return site;
  }

  markCleared(id: string): boolean {
    const s = this.sites.get(id);
    if (!s || s.cleared) return false;
    s.cleared = true;
    return true;
  }

  serialize(): readonly RaidSite[] {
    return [...this.sites.values()].map((s) => ({ ...s }));
  }

  load(rows: readonly RaidSite[]): void {
    this.sites.clear();
    for (const r of rows) this.sites.set(r.id, { ...r });
  }
}
