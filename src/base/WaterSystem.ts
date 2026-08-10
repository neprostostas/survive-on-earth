/**
 * Base water network: tank storage, purifier queue, pump consumption via power grid abstract.
 */

export class WaterSystem {
  private dirty = 0;
  private clean = 20;
  private readonly dirtyCap = 80;
  private readonly cleanCap = 120;
  private purifyProgress = 0;
  private purifyRatePerSec = 0.15;
  private pumpEnabled = false;
  private purifierEnabled = false;

  get dirtyWater(): number { return this.dirty; }
  get cleanWater(): number { return this.clean; }
  get dirtyCapacity(): number { return this.dirtyCap; }
  get cleanCapacity(): number { return this.cleanCap; }
  get pumpOn(): boolean { return this.pumpEnabled; }
  get purifierOn(): boolean { return this.purifierEnabled; }

  setPump(on: boolean): void { this.pumpEnabled = on; }
  setPurifier(on: boolean): void { this.purifierEnabled = on; }

  /** Player drinks from tank; returns amount consumed. */
  drink(amount = 15): number {
    const take = Math.min(this.clean, Math.max(0, amount));
    this.clean -= take;
    return take;
  }

  /** Farming irrigation pull. */
  irrigate(amount: number): boolean {
    if (this.clean < amount) return false;
    this.clean -= amount;
    return true;
  }

  addDirty(amount: number): void {
    this.dirty = Math.min(this.dirtyCap, this.dirty + Math.max(0, amount));
  }

  /**
   * @param powered when electricity available for pump/purifier
   */
  tick(dt: number, powered: boolean): void {
    if (dt <= 0) return;
    if (this.pumpEnabled && powered) {
      this.dirty = Math.min(this.dirtyCap, this.dirty + 0.4 * dt);
    }
    if (this.purifierEnabled && powered && this.dirty >= 1 && this.clean < this.cleanCap) {
      this.purifyProgress += this.purifyRatePerSec * dt;
      while (this.purifyProgress >= 1 && this.dirty >= 1 && this.clean < this.cleanCap) {
        this.purifyProgress -= 1;
        this.dirty -= 1;
        this.clean = Math.min(this.cleanCap, this.clean + 1);
      }
    }
  }

  serialize(): { dirty: number; clean: number; pump: boolean; purifier: boolean } {
    return {
      dirty: this.dirty,
      clean: this.clean,
      pump: this.pumpEnabled,
      purifier: this.purifierEnabled,
    };
  }

  load(data: { dirty?: number; clean?: number; pump?: boolean; purifier?: boolean } | undefined): void {
    if (!data) return;
    this.dirty = data.dirty ?? 0;
    this.clean = data.clean ?? 20;
    this.pumpEnabled = !!data.pump;
    this.purifierEnabled = !!data.purifier;
  }
}
