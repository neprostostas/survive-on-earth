/**
 * Lightweight master-volume bus. Plays optional UI ticks so the volume slider
 * is audibly verifiable; game SFX can route through gain later.
 */
export class GameAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private volume = 1;

  setMasterVolume(volume: number): void {
    this.volume = Math.min(1, Math.max(0, volume));
    if (this.master) this.master.gain.value = this.volume;
  }

  getMasterVolume(): number { return this.volume; }

  /** Soft confirmation blip when dragging the volume slider. */
  playUiTick(): void {
    if (this.volume <= 0.001) return;
    try {
      const ctx = this.ensure();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(660, t);
      osc.frequency.exponentialRampToValueAtTime(420, t + 0.06);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(0.08 * this.volume, t + 0.01);
      env.gain.exponentialRampToValueAtTime(0.0001, t + 0.09);
      osc.connect(env);
      env.connect(this.master!);
      osc.start(t);
      osc.stop(t + 0.1);
    } catch {
      /* autoplay policy / missing Web Audio */
    }
  }

  private ensure(): AudioContext {
    if (!this.ctx) {
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.volume;
      this.master.connect(this.ctx.destination);
    }
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }
}

export const GAME_AUDIO = new GameAudio();
