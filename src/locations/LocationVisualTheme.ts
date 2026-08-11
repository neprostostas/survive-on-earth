import { Color3 } from "@babylonjs/core/Maths/math.color";
import { getLocation, type LocationId, type LocationDefinition } from "./LocationRegistry.ts";

/**
 * Biome visual preset — drives ground/sky/props/house visibility for location travel.
 * One procedural plane is reused; each theme re-skins + swaps prop packs.
 */
export type BiomeVisualId =
  | "home"
  | "forest"
  | "dense-forest"
  | "rocky"
  | "road"
  | "industrial"
  | "urban"
  | "underground"
  | "bunker"
  | "snow"
  | "autumn"
  | "seaside"
  | "swamp"
  | "desert"
  | "exclusion"
  | "camp"
  | "waterfront"
  | "farm"
  /** Open prism ice basin — not pine snow. */
  | "ice-caldera"
  /** Bronze heath amphitheater — not leaf thickets/farm. */
  | "copper-heath"
  /** Braided gorge river ford — not pier docks. */
  | "cataract-ford";

export interface LocationVisualTheme {
  readonly biome: BiomeVisualId;
  readonly groundTint: Color3;
  readonly clearColor: [number, number, number];
  readonly ambient: Color3;
  readonly ambientGround: Color3;
  readonly sun: Color3;
  readonly sunIntensity: number;
  readonly ambientIntensity: number;
  readonly showHouse: boolean;
  readonly showHomeDecor: boolean;
  readonly showCampfire: boolean;
  readonly showCrate: boolean;
  readonly treeVisibility: number;
  readonly rockVisibility: number;
  readonly plantVisibility: number;
  readonly treeScale: number;
  readonly rockScale: number;
  readonly clutterDensity: number;
  /** Prop pack procedural density 0..1 */
  readonly propDensity: number;
}

function c(r: number, g: number, b: number): Color3 {
  return new Color3(r, g, b);
}

const THEMES: Record<BiomeVisualId, LocationVisualTheme> = {
  home: {
    biome: "home",
    groundTint: c(0.92, 0.95, 0.82),
    clearColor: [0.39, 0.44, 0.29],
    ambient: c(0.94, 0.97, 0.88),
    ambientGround: c(0.38, 0.42, 0.32),
    sun: c(1, 0.94, 0.8),
    sunIntensity: 0.9,
    ambientIntensity: 0.95,
    showHouse: true,
    showHomeDecor: true,
    showCampfire: true,
    showCrate: true,
    treeVisibility: 1,
    rockVisibility: 0.7,
    plantVisibility: 1,
    treeScale: 1,
    rockScale: 1,
    clutterDensity: 1,
    propDensity: 0.35,
  },
  forest: {
    biome: "forest",
    groundTint: c(0.55, 0.68, 0.38),
    clearColor: [0.34, 0.42, 0.28],
    ambient: c(0.72, 0.88, 0.68),
    ambientGround: c(0.22, 0.28, 0.16),
    sun: c(0.95, 0.92, 0.7),
    sunIntensity: 0.75,
    ambientIntensity: 0.85,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 1,
    rockVisibility: 0.4,
    plantVisibility: 1,
    treeScale: 1.15,
    rockScale: 0.9,
    clutterDensity: 1.25,
    propDensity: 0.7,
  },
  "dense-forest": {
    biome: "dense-forest",
    groundTint: c(0.38, 0.5, 0.28),
    clearColor: [0.22, 0.3, 0.2],
    ambient: c(0.5, 0.68, 0.48),
    ambientGround: c(0.14, 0.18, 0.1),
    sun: c(0.82, 0.85, 0.65),
    sunIntensity: 0.55,
    ambientIntensity: 0.7,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 1,
    rockVisibility: 0.25,
    plantVisibility: 1,
    treeScale: 1.35,
    rockScale: 0.85,
    clutterDensity: 1.5,
    propDensity: 0.85,
  },
  rocky: {
    biome: "rocky",
    groundTint: c(0.62, 0.58, 0.5),
    clearColor: [0.45, 0.46, 0.42],
    ambient: c(0.9, 0.9, 0.86),
    ambientGround: c(0.4, 0.38, 0.34),
    sun: c(1, 0.96, 0.88),
    sunIntensity: 1.05,
    ambientIntensity: 0.9,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.2,
    rockVisibility: 1,
    plantVisibility: 0.25,
    treeScale: 0.75,
    rockScale: 1.45,
    clutterDensity: 0.55,
    propDensity: 0.75,
  },
  road: {
    biome: "road",
    groundTint: c(0.38, 0.38, 0.36),
    clearColor: [0.48, 0.5, 0.46],
    ambient: c(0.88, 0.88, 0.84),
    ambientGround: c(0.3, 0.3, 0.28),
    sun: c(1, 0.95, 0.85),
    sunIntensity: 0.95,
    ambientIntensity: 0.88,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.15,
    rockVisibility: 0.35,
    plantVisibility: 0.2,
    treeScale: 0.9,
    rockScale: 0.9,
    clutterDensity: 0.35,
    propDensity: 0.9,
  },
  industrial: {
    biome: "industrial",
    groundTint: c(0.42, 0.4, 0.36),
    clearColor: [0.4, 0.42, 0.38],
    ambient: c(0.8, 0.82, 0.78),
    ambientGround: c(0.28, 0.28, 0.24),
    sun: c(0.95, 0.9, 0.8),
    sunIntensity: 0.85,
    ambientIntensity: 0.8,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.08,
    rockVisibility: 0.4,
    plantVisibility: 0.1,
    treeScale: 0.7,
    rockScale: 1.1,
    clutterDensity: 0.25,
    propDensity: 1,
  },
  urban: {
    biome: "urban",
    groundTint: c(0.35, 0.35, 0.34),
    clearColor: [0.42, 0.44, 0.46],
    ambient: c(0.82, 0.84, 0.88),
    ambientGround: c(0.26, 0.26, 0.28),
    sun: c(0.95, 0.93, 0.9),
    sunIntensity: 0.8,
    ambientIntensity: 0.85,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.05,
    rockVisibility: 0.15,
    plantVisibility: 0.08,
    treeScale: 0.65,
    rockScale: 0.7,
    clutterDensity: 0.2,
    propDensity: 1,
  },
  underground: {
    biome: "underground",
    groundTint: c(0.22, 0.22, 0.2),
    clearColor: [0.08, 0.09, 0.08],
    ambient: c(0.45, 0.5, 0.48),
    ambientGround: c(0.12, 0.12, 0.1),
    sun: c(0.55, 0.6, 0.58),
    sunIntensity: 0.25,
    ambientIntensity: 0.55,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0,
    rockVisibility: 0.5,
    plantVisibility: 0,
    treeScale: 0.5,
    rockScale: 1.2,
    clutterDensity: 0.1,
    propDensity: 0.95,
  },
  bunker: {
    biome: "bunker",
    groundTint: c(0.28, 0.3, 0.28),
    clearColor: [0.1, 0.12, 0.1],
    ambient: c(0.5, 0.58, 0.5),
    ambientGround: c(0.14, 0.16, 0.14),
    sun: c(0.6, 0.75, 0.65),
    sunIntensity: 0.3,
    ambientIntensity: 0.6,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0,
    rockVisibility: 0.35,
    plantVisibility: 0,
    treeScale: 0.5,
    rockScale: 1,
    clutterDensity: 0.08,
    propDensity: 1,
  },
  snow: {
    biome: "snow",
    groundTint: c(0.88, 0.92, 0.96),
    clearColor: [0.7, 0.78, 0.86],
    ambient: c(0.9, 0.94, 1),
    ambientGround: c(0.55, 0.6, 0.65),
    sun: c(0.95, 0.95, 1),
    sunIntensity: 0.85,
    ambientIntensity: 1,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.7,
    rockVisibility: 0.55,
    plantVisibility: 0.15,
    treeScale: 1.1,
    rockScale: 1.15,
    clutterDensity: 0.35,
    propDensity: 0.6,
  },
  autumn: {
    biome: "autumn",
    groundTint: c(0.55, 0.36, 0.18),
    clearColor: [0.55, 0.38, 0.22],
    ambient: c(0.95, 0.78, 0.55),
    ambientGround: c(0.35, 0.22, 0.12),
    sun: c(1, 0.82, 0.55),
    sunIntensity: 0.8,
    ambientIntensity: 0.9,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.85,
    rockVisibility: 0.35,
    plantVisibility: 0.55,
    treeScale: 1.2,
    rockScale: 0.95,
    clutterDensity: 1.1,
    propDensity: 0.85,
  },
  seaside: {
    biome: "seaside",
    groundTint: c(0.72, 0.66, 0.48),
    clearColor: [0.35, 0.58, 0.72],
    ambient: c(0.85, 0.95, 1),
    ambientGround: c(0.3, 0.4, 0.42),
    sun: c(1, 0.97, 0.85),
    sunIntensity: 1.15,
    ambientIntensity: 1,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.12,
    rockVisibility: 0.45,
    plantVisibility: 0.18,
    treeScale: 0.7,
    rockScale: 1.25,
    clutterDensity: 0.25,
    propDensity: 0.95,
  },
  swamp: {
    biome: "swamp",
    groundTint: c(0.32, 0.38, 0.24),
    clearColor: [0.3, 0.36, 0.28],
    ambient: c(0.55, 0.68, 0.5),
    ambientGround: c(0.18, 0.22, 0.14),
    sun: c(0.75, 0.8, 0.6),
    sunIntensity: 0.55,
    ambientIntensity: 0.75,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.55,
    rockVisibility: 0.3,
    plantVisibility: 0.9,
    treeScale: 1.05,
    rockScale: 0.95,
    clutterDensity: 1.1,
    propDensity: 0.85,
  },
  desert: {
    biome: "desert",
    groundTint: c(0.78, 0.62, 0.38),
    clearColor: [0.72, 0.58, 0.38],
    ambient: c(1, 0.92, 0.75),
    ambientGround: c(0.5, 0.38, 0.22),
    sun: c(1, 0.9, 0.7),
    sunIntensity: 1.2,
    ambientIntensity: 0.95,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.08,
    rockVisibility: 0.65,
    plantVisibility: 0.15,
    treeScale: 0.55,
    rockScale: 1.2,
    clutterDensity: 0.3,
    propDensity: 0.7,
  },
  exclusion: {
    biome: "exclusion",
    groundTint: c(0.4, 0.42, 0.28),
    clearColor: [0.35, 0.4, 0.25],
    ambient: c(0.65, 0.72, 0.4),
    ambientGround: c(0.22, 0.24, 0.14),
    sun: c(0.75, 0.85, 0.45),
    sunIntensity: 0.65,
    ambientIntensity: 0.7,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.25,
    rockVisibility: 0.5,
    plantVisibility: 0.2,
    treeScale: 0.85,
    rockScale: 1.1,
    clutterDensity: 0.4,
    propDensity: 0.9,
  },
  camp: {
    biome: "camp",
    groundTint: c(0.55, 0.52, 0.38),
    clearColor: [0.42, 0.44, 0.34],
    ambient: c(0.88, 0.9, 0.78),
    ambientGround: c(0.32, 0.3, 0.22),
    sun: c(1, 0.92, 0.75),
    sunIntensity: 0.9,
    ambientIntensity: 0.88,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: true,
    showCrate: false,
    treeVisibility: 0.45,
    rockVisibility: 0.35,
    plantVisibility: 0.5,
    treeScale: 0.95,
    rockScale: 0.95,
    clutterDensity: 0.7,
    propDensity: 0.8,
  },
  waterfront: {
    biome: "waterfront",
    groundTint: c(0.45, 0.48, 0.42),
    clearColor: [0.4, 0.5, 0.52],
    ambient: c(0.8, 0.9, 0.92),
    ambientGround: c(0.28, 0.32, 0.34),
    sun: c(0.95, 0.95, 0.9),
    sunIntensity: 0.9,
    ambientIntensity: 0.9,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.2,
    rockVisibility: 0.3,
    plantVisibility: 0.25,
    treeScale: 0.9,
    rockScale: 0.9,
    clutterDensity: 0.4,
    propDensity: 0.85,
  },
  farm: {
    biome: "farm",
    groundTint: c(0.5, 0.42, 0.28),
    clearColor: [0.48, 0.52, 0.36],
    ambient: c(0.9, 0.92, 0.8),
    ambientGround: c(0.35, 0.32, 0.22),
    sun: c(1, 0.94, 0.78),
    sunIntensity: 1,
    ambientIntensity: 0.92,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.25,
    rockVisibility: 0.2,
    plantVisibility: 0.8,
    treeScale: 0.95,
    rockScale: 0.9,
    clutterDensity: 0.6,
    propDensity: 0.7,
  },
  // Open ice plateaus + cyan crystal light — deliberately no timber, not Frozen Pine Valley.
  "ice-caldera": {
    biome: "ice-caldera",
    groundTint: c(0.72, 0.86, 0.98),
    clearColor: [0.42, 0.58, 0.78],
    ambient: c(0.72, 0.88, 1),
    ambientGround: c(0.35, 0.48, 0.62),
    sun: c(0.75, 0.9, 1),
    sunIntensity: 0.7,
    ambientIntensity: 1.15,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.02,
    rockVisibility: 0.15,
    plantVisibility: 0,
    treeScale: 0.4,
    rockScale: 0.7,
    clutterDensity: 0.12,
    propDensity: 1,
  },
  // Bronze stone heath at dusk — open circle, not wood or crop rows.
  "copper-heath": {
    biome: "copper-heath",
    groundTint: c(0.48, 0.28, 0.16),
    clearColor: [0.48, 0.24, 0.28],
    ambient: c(1, 0.62, 0.42),
    ambientGround: c(0.32, 0.14, 0.1),
    sun: c(1, 0.55, 0.32),
    sunIntensity: 0.65,
    ambientIntensity: 0.95,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.08,
    rockVisibility: 0.55,
    plantVisibility: 0.4,
    treeScale: 0.55,
    rockScale: 1.35,
    clutterDensity: 0.45,
    propDensity: 0.95,
  },
  // Diagonal whitewater channels + basalt — no docks, reeds-as-bank, or boats.
  "cataract-ford": {
    biome: "cataract-ford",
    groundTint: c(0.42, 0.4, 0.32),
    clearColor: [0.32, 0.48, 0.46],
    ambient: c(0.7, 0.88, 0.86),
    ambientGround: c(0.22, 0.28, 0.26),
    sun: c(0.9, 0.96, 0.88),
    sunIntensity: 0.95,
    ambientIntensity: 0.95,
    showHouse: false,
    showHomeDecor: false,
    showCampfire: false,
    showCrate: false,
    treeVisibility: 0.12,
    rockVisibility: 0.7,
    plantVisibility: 0.15,
    treeScale: 0.7,
    rockScale: 1.4,
    clutterDensity: 0.3,
    propDensity: 1,
  },
};

export function resolveBiomeVisual(location: LocationDefinition): BiomeVisualId {
  const id = location.id;
  if (id === "home") return "home";

  // Exclusive destination packs (must not fall through to snow/autumn/waterfront).
  if (id === "glass-caldera") return "ice-caldera";
  if (id === "copperleaf-basin") return "copper-heath";
  if (id === "silt-cataract") return "cataract-ford";

  // Explicit seasonal / coastal destinations
  if (id === "frozen-pine-valley" || id.includes("frozen") || id.includes("snow") || id.includes("rime")) {
    return "snow";
  }
  if (id === "overgrown-farm" || id === "dense-forest" || id.includes("autumn") || id.includes("orchard")) {
    return "autumn";
  }
  if (
    id === "smuggler-harbor"
    || id === "greyhaven-waterfront"
    || id.includes("harbor")
    || id.includes("cove")
    || id.includes("coast")
    || (id === "riverbank")
  ) {
    return id === "riverbank" ? "waterfront" : "seaside";
  }

  if (id.includes("swamp")) return "swamp";
  if (id.includes("desert") || location.regionId === "desert") return "desert";
  if (location.regionId === "exclusion" || id.includes("exclusion") || id.includes("helix")) return "exclusion";
  if ((location.coldExposure ?? 0) >= 0.35 || location.regionId === "northern") return "snow";
  if (
    id.startsWith("metro")
    || id === "city-sewers"
    || id.includes("underground")
    || location.type === "underground"
  ) {
    return "underground";
  }
  if (
    id.includes("bunker")
    || id.includes("blacksite")
    || location.type === "bunker"
    || location.regionId === "underground" && location.type === "dungeon"
  ) {
    return "bunker";
  }
  if (
    id.startsWith("greyhaven")
    || id.includes("hospital")
    || id.includes("prison")
    || id.includes("airport")
    || location.regionId === "greyhaven"
  ) {
    return "urban";
  }
  if (
    location.regionId === "industrial"
    || id.includes("industrial")
    || id.includes("factory")
    || id.includes("power")
    || id.includes("scrap")
  ) {
    return "industrial";
  }
  if (id.includes("waterfront") || id.includes("river")) return "waterfront";
  if (id.includes("highway") || id.includes("gas") || id.includes("motel")) return "road";
  if (
    id.includes("limestone")
    || id.includes("rocky")
    || id.includes("mine")
    || id.includes("quarry")
    || (id.includes("ridge") && !id.includes("pine"))
  ) {
    return "rocky";
  }
  if (id.includes("farm")) return "farm";
  if (id.includes("camp") || id.includes("survivor") || id.includes("outpost") || id.includes("fort") || id.includes("post")) {
    return "camp";
  }
  if (id.includes("pine") || id.includes("forest") || id.includes("cabin") || location.regionId === "green") {
    return "forest";
  }
  if (location.regionId === "yellow") return "road";
  if (location.regionId === "red") return "rocky";
  return "forest";
}

/**
 * Theme for a location: base biome pack + per-id color/density variance
 * so two sites never share the exact same palette.
 */
export function getLocationVisualTheme(locationId: LocationId): LocationVisualTheme {
  const loc = getLocation(locationId);
  const base = THEMES[resolveBiomeVisual(loc)];
  if (locationId === "home") return base;

  // Stable unique shift from id hash
  let h = 2166136261;
  for (let i = 0; i < locationId.length; i += 1) {
    h ^= locationId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h >>>= 0;
  const shift = ((h % 21) - 10) / 100; // -0.10 .. +0.10
  const shiftG = ((((h >>> 8) % 21) - 10) / 100);
  const shiftB = ((((h >>> 16) % 21) - 10) / 100);
  const dens = 0.75 + ((h >>> 4) % 50) / 100; // 0.75..1.24
  const treeVis = Math.max(0, Math.min(1, base.treeVisibility * (0.7 + ((h % 7) * 0.08))));
  const rockVis = Math.max(0, Math.min(1, base.rockVisibility * (0.65 + (((h >>> 5) % 8) * 0.08))));
  const plantVis = Math.max(0, Math.min(1, base.plantVisibility * (0.6 + (((h >>> 9) % 9) * 0.08))));

  return Object.freeze({
    ...base,
    groundTint: new Color3(
      clamp01(base.groundTint.r + shift),
      clamp01(base.groundTint.g + shiftG),
      clamp01(base.groundTint.b + shiftB),
    ),
    clearColor: [
      clamp01(base.clearColor[0] + shift * 0.6),
      clamp01(base.clearColor[1] + shiftG * 0.6),
      clamp01(base.clearColor[2] + shiftB * 0.6),
    ] as [number, number, number],
    ambient: new Color3(
      clamp01(base.ambient.r + shift * 0.4),
      clamp01(base.ambient.g + shiftG * 0.4),
      clamp01(base.ambient.b + shiftB * 0.4),
    ),
    treeVisibility: treeVis,
    rockVisibility: rockVis,
    plantVisibility: plantVis,
    treeScale: base.treeScale * (0.85 + ((h % 5) * 0.06)),
    rockScale: base.rockScale * (0.85 + (((h >>> 3) % 5) * 0.06)),
    clutterDensity: base.clutterDensity * dens,
    propDensity: Math.min(1.2, base.propDensity * dens),
    showCrate: false,
    showCampfire: base.biome === "camp" || (base.biome === "snow" && locationId.includes("cabin")),
    showHouse: false,
    showHomeDecor: false,
  });
}

function clamp01(v: number): number {
  return Math.max(0.05, Math.min(1, v));
}

export function getBiomeTheme(biome: BiomeVisualId): LocationVisualTheme {
  return THEMES[biome];
}
