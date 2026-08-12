/**
 * Pure radio briefing from active world events + uncleared raid sites.
 */

export interface RadioEventSample {
  readonly title: string;
  readonly danger: number;
  readonly claimed: boolean;
  readonly locationTitle?: string;
}

export interface RadioRaidSample {
  readonly title: string;
  readonly threat: number;
  readonly cleared: boolean;
}

export type RadioBriefingLineKind = "event" | "raid";

export interface RadioBriefingLine {
  readonly kind: RadioBriefingLineKind;
  readonly title: string;
  readonly level: number;
  readonly where?: string;
}

export interface RadioBriefing {
  readonly empty: boolean;
  readonly lines: readonly RadioBriefingLine[];
}

const MAX_LINES = 4;

/** Active, unclaimed events + open raid sites for a home radio scan. */
export function composeRadioBriefing(
  events: readonly RadioEventSample[],
  raids: readonly RadioRaidSample[],
): RadioBriefing {
  const lines: RadioBriefingLine[] = [];
  for (const e of events) {
    if (e.claimed) continue;
    lines.push({
      kind: "event",
      title: e.title,
      level: e.danger,
      where: e.locationTitle,
    });
    if (lines.length >= MAX_LINES) break;
  }
  if (lines.length < MAX_LINES) {
    for (const r of raids) {
      if (r.cleared) continue;
      lines.push({ kind: "raid", title: r.title, level: r.threat });
      if (lines.length >= MAX_LINES) break;
    }
  }
  // Prefer higher threat first within the assembled set
  lines.sort((a, b) => b.level - a.level);
  return Object.freeze({
    empty: lines.length === 0,
    lines: Object.freeze(lines.slice(0, MAX_LINES)),
  });
}
