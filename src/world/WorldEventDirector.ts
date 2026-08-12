import { isBarterEventKind } from "../npc/EventCaravan.ts";

export type WorldEventKind =
  | "supply-drop"
  | "trader"
  | "rescue"
  | "horde"
  | "convoy"
  | "elite-hunt"
  | "raid-target"
  | "distress"
  | "rare-resource"
  | "storm"
  | "outbreak"
  | "crash-site"
  | "scavenger-market"
  | "supply-drop-high"
  | "medical-camp"
  | "marauder-camp-event"
  | "lost-caravan"
  | "resource-rush"
  | "infected-nest"
  | "broken-transmitter"
  | "bunker-entrance"
  | "flooded-cache"
  | "frozen-cache"
  | "desert-wreck"
  | "city-evac"
  | "faction-patrol"
  | "faction-conflict"
  | "wandering-survivor"
  | "rare-trader";

export interface WorldEventDef {
  readonly kind: WorldEventKind;
  readonly title: string;
  readonly description: string;
  readonly durationSec: number;
  readonly danger: 1 | 2 | 3 | 4 | 5;
  readonly rewardHint: string;
  readonly lootProfile?: string;
}

export interface ActiveWorldEvent {
  readonly id: string;
  readonly kind: WorldEventKind;
  readonly title: string;
  readonly expiresAtWorldDay: number;
  readonly danger: 1 | 2 | 3 | 4 | 5;
  readonly seed: number;
  readonly lootProfile: string;
  claimed: boolean;
}

const CATALOG: readonly WorldEventDef[] = Object.freeze([
  Object.freeze({ kind: "supply-drop" as const, title: "Supply Drop", description: "Unclaimed aerial cargo.", durationSec: 1800, danger: 2 as const, rewardHint: "materials", lootProfile: "event-supply" }),
  Object.freeze({ kind: "supply-drop-high" as const, title: "High-Risk Drop", description: "Heavily contested cargo pallet.", durationSec: 1500, danger: 4 as const, rewardHint: "high materials", lootProfile: "raid-mid" }),
  Object.freeze({ kind: "trader" as const, title: "Wayfarer Market", description: "Temporary trader convoy.", durationSec: 2400, danger: 1 as const, rewardHint: "barter", lootProfile: "event-supply" }),
  Object.freeze({ kind: "rescue" as const, title: "Distress Call", description: "Survivor needs extraction support.", durationSec: 1500, danger: 3 as const, rewardHint: "reputation", lootProfile: "event-supply" }),
  Object.freeze({ kind: "horde" as const, title: "Infected Wave", description: "Clear a finite wave encounter.", durationSec: 1200, danger: 3 as const, rewardHint: "combat loot", lootProfile: "zombie-basic" }),
  Object.freeze({ kind: "convoy" as const, title: "Abandoned Convoy", description: "Stripped vehicles and cargo.", durationSec: 2000, danger: 3 as const, rewardHint: "vehicle parts", lootProfile: "vehicle-wreck" }),
  Object.freeze({ kind: "elite-hunt" as const, title: "Named Elite", description: "Bounty on a modified infected.", durationSec: 2200, danger: 4 as const, rewardHint: "rare parts", lootProfile: "boss-component" }),
  Object.freeze({ kind: "raid-target" as const, title: "Hostile Compound", description: "PVE raid on a scavenger fort.", durationSec: 3600, danger: 4 as const, rewardHint: "raid loot", lootProfile: "raid-mid" }),
  Object.freeze({ kind: "distress" as const, title: "Radio Beacon", description: "Automated distress signal.", durationSec: 1800, danger: 2 as const, rewardHint: "intel", lootProfile: "junk-salvage" }),
  Object.freeze({ kind: "rare-resource" as const, title: "Resource Bloom", description: "Dense harvest nodes for a short window.", durationSec: 1400, danger: 2 as const, rewardHint: "ores", lootProfile: "rocky-loot" }),
  Object.freeze({ kind: "storm" as const, title: "Front Storm", description: "Weather event with rare post-loot.", durationSec: 900, danger: 2 as const, rewardHint: "storm salvage", lootProfile: "junk-salvage" }),
  Object.freeze({ kind: "outbreak" as const, title: "Local Outbreak", description: "Elevated infection density.", durationSec: 1600, danger: 4 as const, rewardHint: "elite chance", lootProfile: "city-infected" }),
  Object.freeze({ kind: "crash-site" as const, title: "Crash Site", description: "Wreckage contested by infected.", durationSec: 2000, danger: 3 as const, rewardHint: "electronics", lootProfile: "vehicle-wreck" }),
  Object.freeze({ kind: "scavenger-market" as const, title: "Scavenger Market", description: "Roving hostile-neutral traders.", durationSec: 2100, danger: 2 as const, rewardHint: "rare barter", lootProfile: "marauder-gear" }),
  Object.freeze({ kind: "medical-camp" as const, title: "Temporary Medical Camp", description: "Field medics and limited stock.", durationSec: 2000, danger: 1 as const, rewardHint: "medicine", lootProfile: "hospital-loot" }),
  Object.freeze({ kind: "marauder-camp-event" as const, title: "Marauder Camp", description: "Hostile camp spotted nearby.", durationSec: 2200, danger: 4 as const, rewardHint: "weapons chance", lootProfile: "marauder-gear" }),
  Object.freeze({ kind: "lost-caravan" as const, title: "Lost Caravan", description: "Wrecked wagons on the road.", durationSec: 1900, danger: 2 as const, rewardHint: "trade goods", lootProfile: "event-supply" }),
  Object.freeze({ kind: "resource-rush" as const, title: "Resource Rush", description: "Temporary ore veins exposed.", durationSec: 1300, danger: 2 as const, rewardHint: "ores", lootProfile: "rocky-loot" }),
  Object.freeze({ kind: "infected-nest" as const, title: "Infected Nest", description: "Clear a dens of infected.", durationSec: 1700, danger: 3 as const, rewardHint: "combat loot", lootProfile: "zombie-basic" }),
  Object.freeze({ kind: "broken-transmitter" as const, title: "Broken Transmitter", description: "Repair site yields electronics.", durationSec: 1600, danger: 2 as const, rewardHint: "electronics", lootProfile: "industrial-loot" }),
  Object.freeze({ kind: "bunker-entrance" as const, title: "Buried Hatch", description: "Temporary micro-dungeon entrance.", durationSec: 2400, danger: 4 as const, rewardHint: "bunker loot", lootProfile: "bunker-token" }),
  Object.freeze({ kind: "flooded-cache" as const, title: "Flooded Cache", description: "Swamp-side sealed stash.", durationSec: 1700, danger: 3 as const, rewardHint: "rare plants", lootProfile: "swamp-loot" }),
  Object.freeze({ kind: "frozen-cache" as const, title: "Frozen Stash", description: "Snow-buried supply box.", durationSec: 1700, danger: 3 as const, rewardHint: "cold gear", lootProfile: "snow-loot" }),
  Object.freeze({ kind: "desert-wreck" as const, title: "Desert Wreck", description: "Sand-scoured vehicle husk.", durationSec: 1800, danger: 3 as const, rewardHint: "scrap", lootProfile: "desert-loot" }),
  Object.freeze({ kind: "city-evac" as const, title: "Evacuation Site", description: "Urban panic remnants.", durationSec: 2000, danger: 3 as const, rewardHint: "city loot", lootProfile: "city-infected" }),
  Object.freeze({ kind: "faction-patrol" as const, title: "Faction Patrol", description: "Friendly/hostile patrol contact.", durationSec: 1600, danger: 2 as const, rewardHint: "reputation", lootProfile: "event-supply" }),
  Object.freeze({ kind: "faction-conflict" as const, title: "Faction Conflict", description: "Intervene in a skirmish.", durationSec: 1800, danger: 4 as const, rewardHint: "faction rewards", lootProfile: "raid-mid" }),
  Object.freeze({ kind: "wandering-survivor" as const, title: "Wandering Survivor", description: "Dialogue/trade opportunity.", durationSec: 1500, danger: 1 as const, rewardHint: "quest lead", lootProfile: "event-supply" }),
  Object.freeze({ kind: "rare-trader" as const, title: "Rare Trader", description: "High-tier barter caravan.", durationSec: 2000, danger: 2 as const, rewardHint: "rare barter", lootProfile: "raid-high" }),
]);

const MAX_ACTIVE = 4;

/**
 * Local offline event director — advances on world-day / session timers.
 * No server required.
 */
export class WorldEventDirector {
  private readonly active: ActiveWorldEvent[] = [];
  private nextSeed = 1;
  private cooldownDay = 0;

  get events(): readonly ActiveWorldEvent[] { return this.active; }
  get catalog(): readonly WorldEventDef[] { return CATALOG; }

  /** Call with absolute world day float (e.g. clock day). */
  tick(worldDay: number): void {
    this.active.splice(0, this.active.length, ...this.active.filter((e) => {
      if (e.expiresAtWorldDay <= worldDay) return false;
      // Loot pins clear on claim; barter caravans linger until the window ends.
      if (e.claimed && !isBarterEventKind(e.kind)) return false;
      return true;
    }));
    if (this.active.length >= MAX_ACTIVE) return;
    if (worldDay < this.cooldownDay) return;
    if (Math.random() > 0.35) return;
    this.spawnRandom(worldDay);
    this.cooldownDay = worldDay + 0.12;
  }

  spawnRandom(worldDay: number, forced?: WorldEventKind): ActiveWorldEvent | null {
    if (this.active.length >= MAX_ACTIVE) return null;
    const def = forced
      ? CATALOG.find((c) => c.kind === forced)
      : CATALOG[Math.floor(Math.random() * CATALOG.length)];
    if (!def) return null;
    if (this.active.some((e) => e.kind === def.kind)) return null;
    const seed = this.nextSeed++;
    const event: ActiveWorldEvent = {
      id: `evt-${seed}`,
      kind: def.kind,
      title: def.title,
      expiresAtWorldDay: worldDay + def.durationSec / 480,
      danger: def.danger,
      seed,
      lootProfile: def.lootProfile ?? "event-supply",
      claimed: false,
    };
    this.active.push(event);
    return event;
  }

  claim(id: string): { accepted: boolean; lootProfile: string; seed: number } {
    const e = this.active.find((x) => x.id === id);
    if (!e || e.claimed) return { accepted: false, lootProfile: "event-supply", seed: 0 };
    e.claimed = true;
    return { accepted: true, lootProfile: e.lootProfile, seed: e.seed };
  }

  serialize(): readonly {
    id: string;
    kind: WorldEventKind;
    title: string;
    expiresAtWorldDay: number;
    danger: number;
    seed: number;
    lootProfile: string;
    claimed: boolean;
  }[] {
    return this.active.map((e) => ({ ...e }));
  }

  load(rows: readonly {
    id: string;
    kind: WorldEventKind;
    title: string;
    expiresAtWorldDay: number;
    danger: number;
    seed: number;
    lootProfile?: string;
    claimed: boolean;
  }[]): void {
    this.active.length = 0;
    for (const row of rows) {
      this.active.push({
        ...row,
        danger: row.danger as 1 | 2 | 3 | 4 | 5,
        lootProfile: row.lootProfile ?? "event-supply",
      });
      this.nextSeed = Math.max(this.nextSeed, row.seed + 1);
    }
  }
}
