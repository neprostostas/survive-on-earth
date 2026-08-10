/** Deterministic seeded PRNG for per-location uniqueness. */

export function hashString(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i += 1) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type SeededRng = () => number;

export function createSeededRng(seed: number): SeededRng {
  let s = (seed >>> 0) || 1;
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
}

/** Map unit float 0..1 to range. */
export function rngRange(rng: SeededRng, min: number, max: number): number {
  return min + (max - min) * rng();
}

/** World sample far from origin spawn disk. */
export function rngAwayFromOrigin(rng: SeededRng, minR: number, maxR: number): { x: number; z: number } {
  const a = rng() * Math.PI * 2;
  const r = minR + (maxR - minR) * Math.sqrt(rng());
  return { x: Math.cos(a) * r, z: Math.sin(a) * r };
}
