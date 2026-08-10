import { SURVIVAL_CONFIG } from "./survivalConfig.ts";

/**
 * Environmental cold exposure. Warmth from clothing counters cold.
 * Delta-time based — not frame-rate dependent.
 */
export class ColdPool {
  private value = 0;
  readonly max: number;

  constructor(max = 100) {
    this.max = max;
  }

  get current(): number { return this.value; }
  get ratio(): number { return this.value / this.max; }
  get isCritical(): boolean { return this.value >= this.max * 0.9; }

  /**
   * @param exposure 0..1 location cold strength
   * @param warmth 0..1 clothing warmth rating
   * @param nearFire reduces exposure
   */
  tick(exposure: number, warmth: number, nearFire: boolean, delta: number): number {
    if (delta <= 0) return 0;
    let net = Math.max(0, exposure - warmth * 0.9);
    if (nearFire) net = Math.max(0, net - 0.55);
    const drainWarm = nearFire || warmth > exposure ? 0.6 + warmth * 0.8 : 0;
    const rise = net * (SURVIVAL_CONFIG.cold?.risePerSecond ?? 4) * delta;
    const fall = drainWarm * (SURVIVAL_CONFIG.cold?.fallPerSecond ?? 6) * delta;
    this.value = Math.max(0, Math.min(this.max, this.value + rise - fall));
    if (this.value >= this.max * 0.95) {
      return (SURVIVAL_CONFIG.cold?.damagePerSecond ?? 2) * delta;
    }
    return 0;
  }

  set(value: number): void {
    this.value = Math.max(0, Math.min(this.max, value));
  }

  serialize(): number { return this.value; }
}
