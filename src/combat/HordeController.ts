import type { EnemyArchetypeId } from "../enemies/EnemyArchetypes.ts";

export interface WaveDef {
  readonly archetype: EnemyArchetypeId;
  readonly count: number;
  readonly delay: number;
}

export interface HordeEncounterDef {
  readonly id: string;
  readonly waves: readonly WaveDef[];
}

export type HordePhase = "idle" | "active" | "between" | "complete";

/**
 * Wave spawn controller — does not spawn meshes; Game/EnemySystem consume spawn requests.
 */
export class HordeController {
  private def: HordeEncounterDef | null = null;
  private waveIndex = 0;
  private phase: HordePhase = "idle";
  private delayLeft = 0;
  private alive = 0;
  private readonly pendingSpawns: EnemyArchetypeId[] = [];

  get state(): HordePhase { return this.phase; }
  get active(): boolean { return this.phase === "active" || this.phase === "between"; }

  start(def: HordeEncounterDef): void {
    this.def = def;
    this.waveIndex = 0;
    this.alive = 0;
    this.pendingSpawns.length = 0;
    this.beginWave();
  }

  private beginWave(): void {
    if (!this.def || this.waveIndex >= this.def.waves.length) {
      this.phase = "complete";
      return;
    }
    const wave = this.def.waves[this.waveIndex];
    this.delayLeft = wave.delay;
    this.phase = wave.delay > 0 ? "between" : "active";
    if (wave.delay <= 0) this.enqueueWave(wave);
  }

  private enqueueWave(wave: WaveDef): void {
    for (let i = 0; i < wave.count; i += 1) this.pendingSpawns.push(wave.archetype);
    this.alive += wave.count;
    this.phase = "active";
  }

  tick(delta: number): readonly EnemyArchetypeId[] {
    if (this.phase === "between") {
      this.delayLeft -= delta;
      if (this.delayLeft <= 0 && this.def) {
        this.enqueueWave(this.def.waves[this.waveIndex]);
      }
    }
    if (this.pendingSpawns.length === 0) return Object.freeze([]);
    const batch = this.pendingSpawns.splice(0, this.pendingSpawns.length);
    return Object.freeze(batch);
  }

  onEnemyDefeated(): void {
    this.alive = Math.max(0, this.alive - 1);
    if (this.alive === 0 && this.pendingSpawns.length === 0 && this.phase === "active") {
      this.waveIndex += 1;
      this.beginWave();
    }
  }

  reset(): void {
    this.def = null;
    this.phase = "idle";
    this.waveIndex = 0;
    this.alive = 0;
    this.pendingSpawns.length = 0;
  }
}
