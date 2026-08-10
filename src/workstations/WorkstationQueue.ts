export interface QueueEntry {
  readonly id: string;
  readonly recipeKey: string;
  readonly totalTime: number;
  progress: number;
}

export type WorkstationKind = "campfire" | "woodworking" | "furnace" | "recycler";

/**
 * Single-queue timed recipe foundation for stations.
 * Completions emit recipe keys; Game/domain binds outputs.
 */
export class WorkstationQueue {
  readonly kind: WorkstationKind;
  private entries: QueueEntry[] = [];
  private nextId = 1;
  private frozen = false;

  constructor(kind: WorkstationKind) {
    this.kind = kind;
  }

  get queue(): readonly QueueEntry[] { return this.entries; }
  get active(): QueueEntry | null { return this.entries[0] ?? null; }

  setFrozen(frozen: boolean): void { this.frozen = frozen; }

  enqueue(recipeKey: string, totalTime: number): QueueEntry | null {
    if (!Number.isFinite(totalTime) || totalTime <= 0) return null;
    const entry: QueueEntry = {
      id: `${this.kind}-${this.nextId++}`,
      recipeKey,
      totalTime,
      progress: 0,
    };
    this.entries = [...this.entries, entry];
    return entry;
  }

  cancelActive(): QueueEntry | null {
    if (this.entries.length === 0) return null;
    const [head, ...rest] = this.entries;
    this.entries = rest;
    return head ?? null;
  }

  /** Advance world-time; returns finished recipe keys this tick. */
  tick(delta: number): readonly string[] {
    if (this.frozen || delta <= 0 || this.entries.length === 0) return Object.freeze([]);
    const finished: string[] = [];
    let remaining = delta;
    while (remaining > 0 && this.entries.length > 0) {
      const head = this.entries[0];
      const need = head.totalTime - head.progress;
      if (remaining >= need) {
        remaining -= need;
        finished.push(head.recipeKey);
        this.entries = this.entries.slice(1);
      } else {
        head.progress += remaining;
        remaining = 0;
      }
    }
    return Object.freeze(finished);
  }

  serialize(): { kind: WorkstationKind; nextId: number; entries: readonly { id: string; recipeKey: string; totalTime: number; progress: number }[] } {
    return {
      kind: this.kind,
      nextId: this.nextId,
      entries: this.entries.map((e) => ({ id: e.id, recipeKey: e.recipeKey, totalTime: e.totalTime, progress: e.progress })),
    };
  }

  load(data: { nextId?: number; entries?: readonly { id: string; recipeKey: string; totalTime: number; progress: number }[] } | undefined): void {
    this.entries = [];
    this.nextId = data?.nextId ?? 1;
    if (!data?.entries) return;
    for (const e of data.entries) {
      this.entries.push({
        id: e.id,
        recipeKey: e.recipeKey,
        totalTime: e.totalTime,
        progress: e.progress,
      });
    }
  }
}

/** Simple campfire cooking map: raw → cooked output item id. */
export const CAMPFIRE_COOK_MAP: ReadonlyMap<string, { output: string; cookTime: number; fuelCost: number }> = new Map([
  ["berries", { output: "canned-food", cookTime: 8, fuelCost: 1 }],
  ["canned-food", { output: "canned-food", cookTime: 4, fuelCost: 1 }],
]);

export const FURNACE_SMELT_MAP: ReadonlyMap<string, { output: string; smeltTime: number; fuelCost: number }> = new Map([
  ["iron-ore", { output: "iron-bar", smeltTime: 12, fuelCost: 2 }],
]);

export const WOODWORK_MAP: ReadonlyMap<string, { output: string; quantity: number; workTime: number }> = new Map([
  ["pine-log", { output: "wood-plank", quantity: 2, workTime: 6 }],
]);
