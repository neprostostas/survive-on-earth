/**
 * World clock — day/night progression independent of wall clock.
 * Deterministic when advanced with fixed delta.
 */
export class WorldClock {
  private timeOfDay = 0.32; // 0..1, morning-ish start
  private dayLengthSec: number;
  private frozen = false;

  constructor(dayLengthSec = 480) {
    this.dayLengthSec = dayLengthSec;
  }

  get normalized(): number { return this.timeOfDay; }
  get isNight(): boolean { return this.timeOfDay < 0.22 || this.timeOfDay > 0.78; }
  get hourLabel(): string {
    const hour = Math.floor(this.timeOfDay * 24);
    const minute = Math.floor((this.timeOfDay * 24 - hour) * 60);
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  setFrozen(frozen: boolean): void { this.frozen = frozen; }

  tick(delta: number): void {
    if (this.frozen || delta <= 0) return;
    this.timeOfDay = (this.timeOfDay + delta / this.dayLengthSec) % 1;
  }

  /** Solar intensity 0..1 for lighting hooks. */
  sunIntensity(): number {
    if (this.timeOfDay >= 0.22 && this.timeOfDay <= 0.78) {
      const t = (this.timeOfDay - 0.22) / 0.56;
      return Math.sin(t * Math.PI);
    }
    return 0.08;
  }

  serialize(): number { return this.timeOfDay; }
  load(value: number): void {
    if (!Number.isFinite(value)) return;
    this.timeOfDay = ((value % 1) + 1) % 1;
  }
}
