/**
 * Configurable dungeon reset timers with permanent-unlock exceptions.
 */

export type DungeonId =
  | "bunker-echo"
  | "abandoned-hospital"
  | "metro-network"
  | "blacksite"
  | "helix-core"
  | "ironbound-prison";

export interface DungeonResetConfig {
  readonly id: DungeonId;
  readonly title: string;
  readonly cycleWorldDays: number;
  readonly permanentUnlockKeys: readonly string[];
}

export const DUNGEON_RESET_CONFIGS: readonly DungeonResetConfig[] = Object.freeze([
  Object.freeze({ id: "bunker-echo" as const, title: "Bunker Echo", cycleWorldDays: 2, permanentUnlockKeys: Object.freeze(["bunker-access", "floors"]) }),
  Object.freeze({ id: "abandoned-hospital" as const, title: "St. Marrow Hospital", cycleWorldDays: 2.5, permanentUnlockKeys: Object.freeze(["power-restored"]) }),
  Object.freeze({ id: "metro-network" as const, title: "Metro Network", cycleWorldDays: 3, permanentUnlockKeys: Object.freeze(["stations-unlocked"]) }),
  Object.freeze({ id: "blacksite" as const, title: "Blacksite", cycleWorldDays: 3.5, permanentUnlockKeys: Object.freeze(["security-ranks"]) }),
  Object.freeze({ id: "helix-core" as const, title: "Helix Core", cycleWorldDays: 5, permanentUnlockKeys: Object.freeze(["facility-access"]) }),
  Object.freeze({ id: "ironbound-prison" as const, title: "Ironbound Prison", cycleWorldDays: 2.5, permanentUnlockKeys: Object.freeze(["armory-unlocked"]) }),
]);

export interface DungeonRuntimeState {
  readonly id: DungeonId;
  lastResetWorldDay: number;
  bossDefeated: boolean;
  lootWave: number;
  /** Permanent flags that survive reset */
  permanent: Set<string>;
}

export class DungeonResetSystem {
  private readonly states = new Map<DungeonId, DungeonRuntimeState>();

  constructor() {
    for (const cfg of DUNGEON_RESET_CONFIGS) {
      this.states.set(cfg.id, {
        id: cfg.id,
        lastResetWorldDay: 0,
        bossDefeated: false,
        lootWave: 0,
        permanent: new Set(),
      });
    }
  }

  getConfig(id: DungeonId): DungeonResetConfig | null {
    return DUNGEON_RESET_CONFIGS.find((c) => c.id === id) ?? null;
  }

  getState(id: DungeonId): DungeonRuntimeState | null {
    return this.states.get(id) ?? null;
  }

  setPermanent(id: DungeonId, key: string): void {
    this.states.get(id)?.permanent.add(key);
  }

  /** Returns true if a reset was applied; player should be warned before teleport/re-entry. */
  tick(worldDay: number): readonly DungeonId[] {
    const reset: DungeonId[] = [];
    for (const cfg of DUNGEON_RESET_CONFIGS) {
      const st = this.states.get(cfg.id);
      if (!st) continue;
      if (worldDay - st.lastResetWorldDay >= cfg.cycleWorldDays) {
        st.lastResetWorldDay = worldDay;
        st.bossDefeated = false;
        st.lootWave += 1;
        reset.push(cfg.id);
      }
    }
    return reset;
  }

  markBossDefeated(id: DungeonId): void {
    const st = this.states.get(id);
    if (st) st.bossDefeated = true;
  }

  daysUntilReset(id: DungeonId, worldDay: number): number {
    const cfg = this.getConfig(id);
    const st = this.states.get(id);
    if (!cfg || !st) return 0;
    return Math.max(0, cfg.cycleWorldDays - (worldDay - st.lastResetWorldDay));
  }

  serialize(): Record<string, { lastResetWorldDay: number; bossDefeated: boolean; lootWave: number; permanent: string[] }> {
    const out: Record<string, { lastResetWorldDay: number; bossDefeated: boolean; lootWave: number; permanent: string[] }> = {};
    for (const [id, st] of this.states) {
      out[id] = {
        lastResetWorldDay: st.lastResetWorldDay,
        bossDefeated: st.bossDefeated,
        lootWave: st.lootWave,
        permanent: [...st.permanent],
      };
    }
    return out;
  }

  load(data: Record<string, { lastResetWorldDay?: number; bossDefeated?: boolean; lootWave?: number; permanent?: string[] }> | undefined): void {
    for (const st of this.states.values()) {
      st.lastResetWorldDay = 0;
      st.bossDefeated = false;
      st.lootWave = 0;
      st.permanent.clear();
    }
    if (!data) return;
    for (const [id, row] of Object.entries(data)) {
      const st = this.states.get(id as DungeonId);
      if (!st) continue;
      st.lastResetWorldDay = row.lastResetWorldDay ?? 0;
      st.bossDefeated = !!row.bossDefeated;
      st.lootWave = row.lootWave ?? 0;
      st.permanent = new Set(row.permanent ?? []);
    }
  }
}
