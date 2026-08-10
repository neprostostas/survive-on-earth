import type { LocationId } from "../locations/LocationRegistry";
import { getLocation, LOCATION_REGISTRY } from "../locations/LocationRegistry";
import { createSeededRng, hashString, rngAwayFromOrigin, rngRange } from "../locations/locationRng";
import type { EnemyArchetypeId } from "./EnemyArchetypes";

export interface LocationEnemySpawnSpec {
  readonly archetypeId: EnemyArchetypeId;
  readonly count: number;
}

/** One unique fingerprint pool per location index — no shared squad composition. */
const ARCHETYPE_BANDS: readonly (readonly EnemyArchetypeId[])[] = Object.freeze([
  Object.freeze(["shambler", "shambler-scout"] as const),
  Object.freeze(["roaming-zombie", "shambler-worker"] as const),
  Object.freeze(["runner-infected", "runner-feral"] as const),
  Object.freeze(["runner-waste", "feral-infected"] as const),
  Object.freeze(["bloated-infected", "bloater-gas"] as const),
  Object.freeze(["toxic-infected", "toxic-mire"] as const),
  Object.freeze(["spore-infected", "swamp-infected"] as const),
  Object.freeze(["armored-infected", "armored-plate"] as const),
  Object.freeze(["brute", "brute-slag"] as const),
  Object.freeze(["screecher", "screecher-tunnel"] as const),
  Object.freeze(["stalker", "stalker-night"] as const),
  Object.freeze(["cave-crawler", "cave-spore"] as const),
  Object.freeze(["tunnel-brute", "tunnel-slate"] as const),
  Object.freeze(["city-infected", "industrial-infected"] as const),
  Object.freeze(["desert-infected", "frozen-infected"] as const),
  Object.freeze(["marauder-melee", "marauder-scout"] as const),
  Object.freeze(["marauder-ranged", "marauder-medic"] as const),
  Object.freeze(["marauder-heavy", "industrial-raider"] as const),
  Object.freeze(["faction-guard", "bandit-leader"] as const),
  Object.freeze(["ash-jackal", "hive-tendril"] as const),
  Object.freeze(["hazard-elite", "sentinel"] as const),
  Object.freeze(["shotgun-host", "sniper-host"] as const),
]);

const LOCATION_ORDER = LOCATION_REGISTRY.map((l) => l.id);

/**
 * Per-location enemy composition — every non-home site gets a distinct combo.
 * Boss floors keep fixed narrative rosters.
 */
export function enemySpawnSpecsFor(locationId: LocationId): readonly LocationEnemySpawnSpec[] {
  if (locationId === "home") {
    return Object.freeze([
      Object.freeze({ archetypeId: "shambler", count: 2 }),
    ]);
  }

  // Narrative bosses — exclusive to named floors
  if (locationId === "bunker-echo-f3" || locationId === "bunker-echo-f5") {
    return Object.freeze([
      Object.freeze({ archetypeId: "the-warden", count: 1 }),
      Object.freeze({ archetypeId: "armored-infected", count: 2 }),
      Object.freeze({ archetypeId: "sentinel", count: 1 }),
    ]);
  }
  if (locationId === "helix-core") {
    return Object.freeze([
      Object.freeze({ archetypeId: "helix-sovereign", count: 1 }),
      Object.freeze({ archetypeId: "hazard-elite", count: 2 }),
      Object.freeze({ archetypeId: "toxic-infected", count: 2 }),
    ]);
  }
  if (locationId === "metro-flooded") {
    return Object.freeze([
      Object.freeze({ archetypeId: "metro-leviathan", count: 1 }),
      Object.freeze({ archetypeId: "tunnel-brute", count: 1 }),
      Object.freeze({ archetypeId: "screecher-tunnel", count: 2 }),
    ]);
  }

  const loc = getLocation(locationId);
  const idx = Math.max(0, LOCATION_ORDER.indexOf(locationId));
  const h = hashString(locationId);
  const bandA = ARCHETYPE_BANDS[(idx * 3 + (h % 5)) % ARCHETYPE_BANDS.length];
  const bandB = ARCHETYPE_BANDS[(idx * 5 + 7 + ((h >>> 8) % 11)) % ARCHETYPE_BANDS.length];
  const bandC = ARCHETYPE_BANDS[(idx * 11 + 13 + ((h >>> 16) % 17)) % ARCHETYPE_BANDS.length];
  // Ensure three bands never collapse to identical refs by stepping on collision
  const used = new Set<string>();
  const picks: EnemyArchetypeId[] = [];
  for (const band of [bandA, bandB, bandC]) {
    for (const arch of band) {
      if (used.has(arch)) continue;
      used.add(arch);
      picks.push(arch);
      break;
    }
  }
  // Difficulty scales count/mix length uniquely
  const difficulty = loc.difficulty;
  const baseCount = 2 + (difficulty >= 3 ? 1 : 0) + (difficulty >= 4 ? 1 : 0) + ((h >>> 4) % 2);
  const specs: LocationEnemySpawnSpec[] = [];
  // Distribute counts so no two adjacent locations share equal {id:count} shape after fingerprint
  const fingerprint = (idx * 17 + (h % 97)) >>> 0;
  for (let i = 0; i < picks.length && specs.length < 4; i += 1) {
    const arch = picks[i];
    const count = 1 + ((fingerprint >> (i * 3)) % (difficulty >= 4 ? 3 : 2));
    specs.push(Object.freeze({ archetypeId: arch, count }));
  }
  // Top off total body count
  let total = specs.reduce((n, s) => n + s.count, 0);
  while (total < baseCount && specs.length > 0) {
    const slot = specs[total % specs.length];
    specs[total % specs.length] = Object.freeze({ archetypeId: slot.archetypeId, count: slot.count + 1 });
    total += 1;
  }

  // Seasonal / locale flavor caps (without reusing the same generic forest pack)
  if (locationId === "frozen-pine-valley" || locationId.includes("frozen") || locationId.includes("snow")) {
    return Object.freeze([
      Object.freeze({ archetypeId: "frozen-infected", count: 3 + (difficulty >= 3 ? 1 : 0) }),
      Object.freeze({ archetypeId: "stalker-night", count: 1 }),
      Object.freeze({ archetypeId: "brute", count: difficulty >= 3 ? 1 : 0 }),
    ].filter((s) => s.count > 0));
  }
  if (locationId === "overgrown-farm" || locationId.includes("autumn") || locationId === "dense-forest") {
    // autumn-toned roster unique to leaf biomes
    return Object.freeze([
      Object.freeze({ archetypeId: "shambler-scout", count: 2 }),
      Object.freeze({ archetypeId: "spore-infected", count: 2 }),
      Object.freeze({ archetypeId: "runner-feral", count: 1 + (difficulty >= 3 ? 1 : 0) }),
      Object.freeze({ archetypeId: "bloated-infected", count: difficulty >= 2 ? 1 : 0 }),
    ].filter((s) => s.count > 0));
  }
  if (
    locationId.includes("harbor")
    || locationId.includes("waterfront")
    || locationId === "riverbank"
    || locationId.includes("cove")
    || locationId === "smuggler-harbor"
  ) {
    return Object.freeze([
      Object.freeze({ archetypeId: "city-infected", count: 2 }),
      Object.freeze({ archetypeId: "marauder-scout", count: 2 }),
      Object.freeze({ archetypeId: "runner-infected", count: 1 }),
      Object.freeze({ archetypeId: "shotgun-host", count: difficulty >= 3 ? 1 : 0 }),
    ].filter((s) => s.count > 0));
  }

  return Object.freeze(specs.map((s) => Object.freeze(s)));
}

/**
 * Unique spawn geometry per location — clusters, arcs, corridors, corners.
 * Never uses the same ring recipe for every map.
 */
export function spawnPositionsForCount(count: number, seed = 1): readonly { x: number; y: number; z: number }[] {
  // Backward-compatible entry — seed as numeric entropy only
  return spawnPositionsForLocation(count, `seed-${seed}`);
}

export function spawnPositionsForLocation(
  count: number,
  locationId: string,
): readonly { x: number; y: number; z: number }[] {
  const h = hashString(locationId);
  const rng = createSeededRng(h ^ 0x9e3779b9);
  const pattern = h % 8;
  const out: { x: number; y: number; z: number }[] = [];

  const push = (x: number, z: number): void => {
    // Clamp into world; keep ≥4.2 from origin
    let px = x;
    let pz = z;
    const d = Math.hypot(px, pz);
    if (d < 4.2) {
      const s = 4.5 / Math.max(0.01, d);
      px *= s;
      pz *= s;
    }
    const half = 24;
    px = Math.max(-half, Math.min(half, px));
    pz = Math.max(-half, Math.min(half, pz));
    out.push({ x: px, y: 0, z: pz });
  };

  switch (pattern) {
    case 0: { // Far corner clump
      const cx = rng() > 0.5 ? rngRange(rng, 10, 18) : rngRange(rng, -18, -10);
      const cz = rng() > 0.5 ? rngRange(rng, 10, 18) : rngRange(rng, -18, -10);
      for (let i = 0; i < count; i += 1) {
        push(cx + rngRange(rng, -3.5, 3.5), cz + rngRange(rng, -3.5, 3.5));
      }
      break;
    }
    case 1: { // Two flank clusters
      const a = count >> 1;
      for (let i = 0; i < a; i += 1) push(rngRange(rng, -16, -8), rngRange(rng, -6, 10));
      for (let i = a; i < count; i += 1) push(rngRange(rng, 8, 16), rngRange(rng, -10, 6));
      break;
    }
    case 2: { // Northern arc
      for (let i = 0; i < count; i += 1) {
        const t = i / Math.max(1, count - 1);
        const ang = -0.9 + t * 1.8;
        const r = rngRange(rng, 9, 16);
        push(Math.sin(ang) * r, 8 + Math.cos(ang) * (r * 0.35));
      }
      break;
    }
    case 3: { // Southern line road ambush
      for (let i = 0; i < count; i += 1) {
        push(rngRange(rng, -14, 14), rngRange(rng, -18, -9) + i * 0.15);
      }
      break;
    }
    case 4: { // Spiral from mid-radius
      for (let i = 0; i < count; i += 1) {
        const a = i * 2.399 + h * 0.01;
        const r = 7 + i * 1.1 + rng() * 1.5;
        push(Math.cos(a) * r, Math.sin(a) * r);
      }
      break;
    }
    case 5: { // Triangle posts
      const posts = [
        { x: rngRange(rng, -18, -10), z: rngRange(rng, -4, 12) },
        { x: rngRange(rng, 10, 18), z: rngRange(rng, -12, 6) },
        { x: rngRange(rng, -6, 6), z: rngRange(rng, 12, 20) },
      ];
      for (let i = 0; i < count; i += 1) {
        const p = posts[i % posts.length];
        push(p.x + rngRange(rng, -2.2, 2.2), p.z + rngRange(rng, -2.2, 2.2));
      }
      break;
    }
    case 6: { // Loose ring with big phase offset unique to seed
      for (let i = 0; i < count; i += 1) {
        const a = (i / count) * Math.PI * 2 + rng() * 0.4 + (h % 360) * 0.017;
        const r = 8 + (i % 3) * 3.2 + rng() * 1.2;
        push(Math.cos(a) * r, Math.sin(a) * r);
      }
      break;
    }
    default: { // Pure scatter
      for (let i = 0; i < count; i += 1) {
        const p = rngAwayFromOrigin(rng, 6, 20);
        push(p.x, p.z);
      }
    }
  }

  // De-dup near-collisions by jittering
  for (let i = 0; i < out.length; i += 1) {
    for (let j = 0; j < i; j += 1) {
      const dx = out[i].x - out[j].x;
      const dz = out[i].z - out[j].z;
      if (dx * dx + dz * dz < 1.1) {
        out[i] = {
          x: out[i].x + rngRange(rng, 1.2, 2.4) * (rng() > 0.5 ? 1 : -1),
          y: 0,
          z: out[i].z + rngRange(rng, 1.2, 2.4) * (rng() > 0.5 ? 1 : -1),
        };
      }
    }
  }

  return Object.freeze(out);
}
