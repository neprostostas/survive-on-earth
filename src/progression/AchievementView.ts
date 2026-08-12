/**
 * Achievement list helpers (pure).
 */
import {
  ACHIEVEMENT_DEFS,
  type AchievementDef,
  type AchievementId,
  type AchievementSystem,
} from "./Achievements.ts";

export type AchievementFilter = "all" | "unlocked" | "locked";

export interface AchievementRow {
  readonly id: AchievementId;
  readonly title: string;
  readonly description: string;
  readonly category: AchievementDef["category"];
  readonly unlocked: boolean;
}

export function achievementRows(
  system: AchievementSystem,
  filter: AchievementFilter = "all",
): readonly AchievementRow[] {
  const rows: AchievementRow[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    const unlocked = system.isUnlocked(def.id);
    if (filter === "unlocked" && !unlocked) continue;
    if (filter === "locked" && unlocked) continue;
    rows.push(Object.freeze({
      id: def.id,
      title: def.title,
      description: def.description,
      category: def.category,
      unlocked,
    }));
  }
  // Unlocked first, then title
  rows.sort((a, b) => {
    if (a.unlocked !== b.unlocked) return a.unlocked ? -1 : 1;
    return a.title.localeCompare(b.title);
  });
  return Object.freeze(rows);
}

export function achievementProgress(system: AchievementSystem): { unlocked: number; total: number } {
  let unlocked = 0;
  for (const def of ACHIEVEMENT_DEFS) {
    if (system.isUnlocked(def.id)) unlocked += 1;
  }
  return Object.freeze({ unlocked, total: ACHIEVEMENT_DEFS.length });
}
