/**
 * Journal / faction snapshot helpers (pure).
 */
import type { JournalSystem } from "./JournalSystem.ts";
import { FACTION_DEFS, type FactionId, type ReputationSystem, type ReputationTier } from "./ReputationSystem.ts";

export interface JournalCounts {
  readonly locations: number;
  readonly items: number;
  readonly enemies: number;
  readonly notes: number;
}

export interface JournalNoteRow {
  readonly id: string;
  readonly text: string;
}

export interface FactionRow {
  readonly id: FactionId;
  readonly title: string;
  readonly philosophy: string;
  readonly points: number;
  readonly tier: ReputationTier;
}

export function journalCounts(journal: {
  serialize(): { locations: string[]; items: string[]; enemies: string[]; notes: Record<string, string> };
}): JournalCounts {
  const snap = journal.serialize();
  return Object.freeze({
    locations: snap.locations.length,
    items: snap.items.length,
    enemies: snap.enemies.length,
    notes: Object.keys(snap.notes).length,
  });
}

export function journalNoteRows(journal: JournalSystem): readonly JournalNoteRow[] {
  const notes = journal.serialize().notes;
  return Object.freeze(
    Object.entries(notes)
      .map(([id, text]) => Object.freeze({ id, text }))
      .sort((a, b) => a.id.localeCompare(b.id)),
  );
}

export function factionRows(reputation: ReputationSystem): readonly FactionRow[] {
  return Object.freeze(FACTION_DEFS.map((def) => Object.freeze({
    id: def.id,
    title: def.title,
    philosophy: def.philosophy,
    points: reputation.getPoints(def.id),
    tier: reputation.tier(def.id),
  })));
}

export function reputationTierLabelKey(tier: ReputationTier):
  | "journal.tier.unknown"
  | "journal.tier.accepted"
  | "journal.tier.trusted"
  | "journal.tier.ally"
  | "journal.tier.hostile" {
  return `journal.tier.${tier}`;
}
