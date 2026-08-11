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
    this.blip({ type: "sine", f0: 660, f1: 420, peak: 0.08, dur: 0.09 });
  }

  /** Thud when the player takes a hit. */
  playPlayerHit(): void {
    this.blip({ type: "triangle", f0: 180, f1: 70, peak: 0.11, dur: 0.12 });
  }

  /** Bright snap for critical hits. */
  playCrit(): void {
    this.blip({ type: "square", f0: 880, f1: 1320, peak: 0.07, dur: 0.11 });
  }

  /** Soft positive tick when a wound is treated. */
  playHeal(): void {
    this.blip({ type: "sine", f0: 520, f1: 780, peak: 0.06, dur: 0.1 });
  }

  private blip(opts: {
    type: OscillatorType;
    f0: number;
    f1: number;
    peak: number;
    dur: number;
  }): void {
    if (this.volume <= 0.001) return;
    try {
      const ctx = this.ensure();
      const t = ctx.currentTime;
      const osc = ctx.createOscillator();
      const env = ctx.createGain();
      osc.type = opts.type;
      osc.frequency.setValueAtTime(opts.f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, opts.f1), t + opts.dur * 0.7);
      env.gain.setValueAtTime(0.0001, t);
      env.gain.exponentialRampToValueAtTime(opts.peak * this.volume, t + 0.012);
      env.gain.exponentialRampToValueAtTime(0.0001, t + opts.dur);
      osc.connect(env);
      env.connect(this.master!);
      osc.start(t);
      osc.stop(t + opts.dur + 0.02);
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
