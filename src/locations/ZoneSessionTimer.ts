import type { LocationDefinition, LocationKind } from "./LocationRegistry.ts";

/**
 * LDOE-style zone visit time budget.
 * Home / hub safehouses are unlimited; resource and combat zones get a countdown.
 */
export class ZoneSessionTimer {
  private remainingSec: number | null = null;
  private budgetSec = 0;
  private warnedAtHalf = false;
  private warnedAtMinute = false;

  get active(): boolean { return this.remainingSec !== null; }
  get remaining(): number | null { return this.remainingSec; }

  /** Seconds of visit allowed for a destination (null = unlimited). */
  static budgetFor(def: LocationDefinition): number | null {
    if (def.type === "home") return null;
    if (def.type === "hub" || def.type === "npc-hub") return null;
    const baseByDifficulty: Record<1 | 2 | 3 | 4 | 5, number> = {
      1: 8 * 60,
      2: 6 * 60,
      3: 5 * 60,
      4: 4 * 60,
      5: 3 * 60,
    };
    let sec = baseByDifficulty[def.difficulty];
    const kind: LocationKind = def.type;
    if (kind === "bunker" || kind === "dungeon" || kind === "boss") sec = Math.floor(sec * 1.25);
    if (kind === "resource") sec = Math.floor(sec * 1.1);
    return Math.max(90, sec);
  }

  /** Begin a fresh budget for the location (or unlimited). */
  start(def: LocationDefinition): void {
    const budget = ZoneSessionTimer.budgetFor(def);
    this.remainingSec = budget;
    this.budgetSec = budget ?? 0;
    this.warnedAtHalf = false;
    this.warnedAtMinute = false;
  }

  /** Restore from save (seconds left; null / negative → unlimited). */
  load(seconds: number | null | undefined): void {
    if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
      this.remainingSec = null;
      this.budgetSec = 0;
    } else {
      this.remainingSec = seconds;
      this.budgetSec = Math.max(seconds, 1);
    }
    this.warnedAtHalf = false;
    this.warnedAtMinute = false;
  }

  serialize(): number | null {
    return this.remainingSec;
  }

  /**
   * Advance timer. Returns which alert to surface (if any).
   * `expired` is true once when the budget hits 0.
   */
  tick(delta: number): { expired: boolean; warn: "half" | "minute" | null; remaining: number | null } {
    if (this.remainingSec === null || delta <= 0) {
      return { expired: false, warn: null, remaining: this.remainingSec };
    }
    const prev = this.remainingSec;
    this.remainingSec = Math.max(0, this.remainingSec - delta);
    let warn: "half" | "minute" | null = null;
    if (!this.warnedAtMinute && this.remainingSec <= 60 && prev > 60) {
      this.warnedAtMinute = true;
      warn = "minute";
    } else if (
      !this.warnedAtHalf
      && this.budgetSec > 120
      && this.remainingSec <= this.budgetSec * 0.5
      && prev > this.budgetSec * 0.5
    ) {
      this.warnedAtHalf = true;
      warn = "half";
    }
    const expired = prev > 0 && this.remainingSec === 0;
    return { expired, warn, remaining: this.remainingSec };
  }

  clear(): void {
    this.remainingSec = null;
    this.budgetSec = 0;
    this.warnedAtHalf = false;
    this.warnedAtMinute = false;
  }
}

export function formatZoneTimer(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
