/**
 * Quest list / tracker helpers (pure).
 */
import {
  QUEST_DEFS,
  type QuestDefinition,
  type QuestId,
  type QuestSystem,
} from "./QuestSystem.ts";

export type QuestFilter = "active" | "done" | "all";

export interface QuestRow {
  readonly id: QuestId;
  readonly title: string;
  readonly description: string;
  readonly chain: string;
  readonly progress: number;
  readonly target: number;
  readonly completed: boolean;
  readonly tracked: boolean;
}

export function questRows(
  system: QuestSystem,
  filter: QuestFilter = "active",
): readonly QuestRow[] {
  const tracked = system.trackedId;
  const snap = new Map(system.snapshot().map((s) => [s.id, s]));
  const rows: QuestRow[] = [];
  for (const def of QUEST_DEFS) {
    const st = snap.get(def.id);
    const completed = st?.completed ?? false;
    const progress = st?.progress ?? 0;
    if (filter === "active" && completed) continue;
    if (filter === "done" && !completed) continue;
    rows.push(Object.freeze({
      id: def.id,
      title: def.title,
      description: def.description,
      chain: def.chain ?? "misc",
      progress,
      target: def.target,
      completed,
      tracked: def.id === tracked,
    }));
  }
  rows.sort((a, b) => {
    if (a.tracked !== b.tracked) return a.tracked ? -1 : 1;
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.title.localeCompare(b.title);
  });
  return Object.freeze(rows);
}

export function questProgress(system: QuestSystem): { done: number; total: number } {
  let done = 0;
  for (const s of system.snapshot()) {
    if (s.completed) done += 1;
  }
  return Object.freeze({ done, total: QUEST_DEFS.length });
}

export function trackedQuestRow(system: QuestSystem): QuestRow | null {
  const id = system.trackedId;
  const def = QUEST_DEFS.find((q) => q.id === id);
  if (!def) return null;
  const st = system.trackedState();
  return Object.freeze({
    id: def.id,
    title: def.title,
    description: def.description,
    chain: def.chain ?? "misc",
    progress: st.progress,
    target: def.target,
    completed: st.completed,
    tracked: true,
  });
}

/** First incomplete quest in definition order (fallback: last def). */
export function nextActiveQuestId(system: QuestSystem): QuestId {
  const snap = new Map(system.snapshot().map((s) => [s.id, s]));
  for (const def of QUEST_DEFS) {
    if (!(snap.get(def.id)?.completed)) return def.id;
  }
  return QUEST_DEFS[QUEST_DEFS.length - 1]!.id;
}

export function questDef(id: QuestId): QuestDefinition | undefined {
  return QUEST_DEFS.find((q) => q.id === id);
}
