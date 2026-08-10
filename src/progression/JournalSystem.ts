import type { ItemId } from "../items/ItemId.ts";
import type { LocationId } from "../locations/LocationRegistry.ts";
import type { EnemyArchetypeId } from "../enemies/EnemyArchetypes.ts";

/** Journal / codex discovery log (local, not platform). */
export class JournalSystem {
  private readonly locations = new Set<LocationId>();
  private readonly items = new Set<ItemId>();
  private readonly enemies = new Set<EnemyArchetypeId>();
  private readonly notes = new Map<string, string>();

  discoverLocation(id: LocationId): void { this.locations.add(id); }
  discoverItem(id: ItemId): void { this.items.add(id); }
  discoverEnemy(id: EnemyArchetypeId): void { this.enemies.add(id); }

  addNote(id: string, text: string): void {
    if (!this.notes.has(id)) this.notes.set(id, text);
  }

  hasNote(id: string): boolean { return this.notes.has(id); }
  getNote(id: string): string | null { return this.notes.get(id) ?? null; }

  serialize(): {
    locations: string[];
    items: string[];
    enemies: string[];
    notes: Record<string, string>;
  } {
    return {
      locations: [...this.locations],
      items: [...this.items],
      enemies: [...this.enemies],
      notes: Object.fromEntries(this.notes.entries()),
    };
  }

  load(data: Partial<ReturnType<JournalSystem["serialize"]>>): void {
    this.locations.clear();
    this.items.clear();
    this.enemies.clear();
    this.notes.clear();
    for (const id of data.locations ?? []) this.locations.add(id as LocationId);
    for (const id of data.items ?? []) this.items.add(id as ItemId);
    for (const id of data.enemies ?? []) this.enemies.add(id as EnemyArchetypeId);
    for (const [id, text] of Object.entries(data.notes ?? {})) this.notes.set(id, text);
  }
}
