import { Color3 } from "@babylonjs/core/Maths/math.color";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { BiomeVisualId } from "../../locations/LocationVisualTheme";

/**
 * Procedural prop packs for non-home biomes — shared materials, thin geometry.
 * One cached root per biome to keep travel swaps cheap.
 */
export function createBiomePropPack(scene: Scene, biome: BiomeVisualId, seed = 1): TransformNode {
  const root = new TransformNode(`BiomeProps_${biome}`, scene);
  const mats = makeMats(scene, biome);

  switch (biome) {
    case "home":
      break;
    case "forest":
    case "dense-forest":
      scatter(scene, root, mats.trunk, mats.foliage, seed, biome === "dense-forest" ? 28 : 18, "log");
      scatter(scene, root, mats.foliage, mats.moss, seed + 3, 20, "bush");
      scatter(scene, root, mats.moss, mats.moss, seed + 7, 12, "mushroom");
      break;
    case "rocky":
      scatter(scene, root, mats.rock, mats.gravel, seed, 30, "boulder");
      scatter(scene, root, mats.gravel, mats.rock, seed + 2, 18, "rubble");
      scatter(scene, root, mats.metal, mats.rust, seed + 5, 8, "mine-prop");
      break;
    case "road":
      scatter(scene, root, mats.asphalt, mats.asphalt, seed, 6, "road-strip");
      scatter(scene, root, mats.metal, mats.rust, seed + 1, 10, "car-wreck");
      scatter(scene, root, mats.plastic, mats.metal, seed + 4, 14, "barrier");
      scatter(scene, root, mats.sign, mats.metal, seed + 8, 6, "sign");
      break;
    case "industrial":
      scatter(scene, root, mats.metal, mats.rust, seed, 16, "tank");
      scatter(scene, root, mats.rust, mats.metal, seed + 2, 22, "pipe");
      scatter(scene, root, mats.concrete, mats.metal, seed + 3, 12, "crate-stack");
      scatter(scene, root, mats.cable, mats.metal, seed + 6, 10, "spool");
      break;
    case "urban":
      scatter(scene, root, mats.concrete, mats.brick, seed, 14, "building-stub");
      scatter(scene, root, mats.asphalt, mats.concrete, seed + 1, 8, "sidewalk");
      scatter(scene, root, mats.metal, mats.plastic, seed + 4, 16, "urban-prop");
      scatter(scene, root, mats.brick, mats.glass, seed + 7, 10, "facade");
      break;
    case "underground":
    case "bunker":
      scatter(scene, root, mats.concrete, mats.metal, seed, 18, "corridor");
      scatter(scene, root, mats.metal, mats.emissive, seed + 2, 12, "cabinet");
      scatter(scene, root, mats.cable, mats.metal, seed + 5, 14, "conduit");
      scatter(scene, root, mats.warning, mats.metal, seed + 8, 8, "warn");
      break;
    case "snow":
      scatter(scene, root, mats.snow, mats.rock, seed, 16, "snow-rock");
      scatter(scene, root, mats.trunk, mats.snow, seed + 3, 10, "frozen-log");
      scatter(scene, root, mats.snow, mats.snow, seed + 6, 12, "drift");
      scatter(scene, root, mats.ice, mats.snow, seed + 11, 8, "ice-sheet");
      break;
    case "autumn":
      scatter(scene, root, mats.autumnLeaf, mats.trunk, seed, 22, "bush");
      scatter(scene, root, mats.trunk, mats.autumnLeaf, seed + 2, 14, "log");
      scatter(scene, root, mats.hay, mats.soil, seed + 5, 12, "plot");
      scatter(scene, root, mats.wood, mats.rust, seed + 9, 8, "fence");
      break;
    case "seaside":
      scatter(scene, root, mats.sand, mats.water, seed, 10, "dune-rock");
      scatter(scene, root, mats.water, mats.water, seed + 1, 6, "pool");
      scatter(scene, root, mats.wood, mats.rope, seed + 3, 10, "pier");
      scatter(scene, root, mats.metal, mats.rust, seed + 5, 8, "boat");
      scatter(scene, root, mats.sand, mats.sand, seed + 8, 14, "drift");
      break;
    case "swamp":
      scatter(scene, root, mats.mud, mats.water, seed, 10, "pool");
      scatter(scene, root, mats.trunk, mats.moss, seed + 2, 14, "dead-tree");
      scatter(scene, root, mats.reed, mats.moss, seed + 5, 24, "reed");
      scatter(scene, root, mats.moss, mats.moss, seed + 9, 12, "swamp-mush");
      break;
    case "desert":
      scatter(scene, root, mats.sand, mats.rock, seed, 14, "dune-rock");
      scatter(scene, root, mats.trunk, mats.dry, seed + 2, 10, "dead-brush");
      scatter(scene, root, mats.metal, mats.rust, seed + 4, 8, "wreck");
      scatter(scene, root, mats.bone, mats.sand, seed + 7, 10, "bone");
      break;
    case "exclusion":
      scatter(scene, root, mats.ash, mats.rust, seed, 16, "dead-tree");
      scatter(scene, root, mats.warning, mats.metal, seed + 3, 10, "hazard-sign");
      scatter(scene, root, mats.metal, mats.rust, seed + 5, 12, "ruined-tank");
      scatter(scene, root, mats.toxic, mats.ash, seed + 8, 8, "toxic-pool");
      break;
    case "camp":
      scatter(scene, root, mats.wood, mats.cloth, seed, 10, "tent");
      scatter(scene, root, mats.wood, mats.metal, seed + 2, 14, "crate");
      scatter(scene, root, mats.cloth, mats.wood, seed + 4, 8, "tarp");
      scatter(scene, root, mats.metal, mats.rust, seed + 6, 8, "barrel");
      break;
    case "waterfront":
      scatter(scene, root, mats.wood, mats.metal, seed, 12, "pier");
      scatter(scene, root, mats.metal, mats.rust, seed + 2, 10, "boat");
      scatter(scene, root, mats.concrete, mats.metal, seed + 4, 8, "dock");
      scatter(scene, root, mats.rope, mats.wood, seed + 7, 10, "crate");
      break;
    case "farm":
      scatter(scene, root, mats.soil, mats.wood, seed, 10, "plot");
      scatter(scene, root, mats.wood, mats.metal, seed + 2, 8, "fence");
      scatter(scene, root, mats.foliage, mats.soil, seed + 4, 16, "crop");
      scatter(scene, root, mats.metal, mats.rust, seed + 6, 6, "trough");
      break;
    default:
      break;
  }

  // Landmark silhouette unique-ish per biome — large structure offset from spawn
  placeLandmark(scene, root, mats, biome);
  root.setEnabled(false);
  return root;
}

interface PackMats {
  trunk: StandardMaterial;
  foliage: StandardMaterial;
  rock: StandardMaterial;
  gravel: StandardMaterial;
  metal: StandardMaterial;
  rust: StandardMaterial;
  concrete: StandardMaterial;
  brick: StandardMaterial;
  asphalt: StandardMaterial;
  plastic: StandardMaterial;
  glass: StandardMaterial;
  snow: StandardMaterial;
  ice: StandardMaterial;
  autumnLeaf: StandardMaterial;
  hay: StandardMaterial;
  mud: StandardMaterial;
  water: StandardMaterial;
  reed: StandardMaterial;
  moss: StandardMaterial;
  sand: StandardMaterial;
  dry: StandardMaterial;
  bone: StandardMaterial;
  ash: StandardMaterial;
  toxic: StandardMaterial;
  warning: StandardMaterial;
  wood: StandardMaterial;
  cloth: StandardMaterial;
  cable: StandardMaterial;
  emissive: StandardMaterial;
  sign: StandardMaterial;
  soil: StandardMaterial;
  rope: StandardMaterial;
}

function makeMats(scene: Scene, biome: string): PackMats {
  const m = (name: string, col: Color3, emit?: Color3): StandardMaterial => {
    const mat = new StandardMaterial(`BiomeMat_${biome}_${name}`, scene);
    mat.diffuseColor = col;
    mat.specularColor = Color3.Black();
    if (emit) mat.emissiveColor = emit;
    return mat;
  };
  return {
    trunk: m("trunk", new Color3(0.35, 0.22, 0.12)),
    foliage: m("foliage", new Color3(0.2, 0.38, 0.16)),
    rock: m("rock", new Color3(0.45, 0.44, 0.4)),
    gravel: m("gravel", new Color3(0.5, 0.48, 0.42)),
    metal: m("metal", new Color3(0.42, 0.44, 0.46)),
    rust: m("rust", new Color3(0.48, 0.28, 0.12)),
    concrete: m("concrete", new Color3(0.48, 0.48, 0.46)),
    brick: m("brick", new Color3(0.48, 0.3, 0.22)),
    asphalt: m("asphalt", new Color3(0.22, 0.22, 0.22)),
    plastic: m("plastic", new Color3(0.35, 0.4, 0.35)),
    glass: m("glass", new Color3(0.5, 0.65, 0.7), new Color3(0.05, 0.08, 0.1)),
    snow: m("snow", new Color3(0.9, 0.93, 0.96)),
    ice: m("ice", new Color3(0.7, 0.88, 0.95), new Color3(0.05, 0.08, 0.12)),
    autumnLeaf: m("autumnLeaf", new Color3(0.72, 0.35, 0.1)),
    hay: m("hay", new Color3(0.7, 0.58, 0.28)),
    mud: m("mud", new Color3(0.28, 0.24, 0.14)),
    water: m("water", new Color3(0.18, 0.28, 0.26), new Color3(0.02, 0.05, 0.04)),
    reed: m("reed", new Color3(0.32, 0.4, 0.2)),
    moss: m("moss", new Color3(0.22, 0.36, 0.16)),
    sand: m("sand", new Color3(0.78, 0.62, 0.36)),
    dry: m("dry", new Color3(0.5, 0.4, 0.22)),
    bone: m("bone", new Color3(0.82, 0.78, 0.68)),
    ash: m("ash", new Color3(0.35, 0.36, 0.28)),
    toxic: m("toxic", new Color3(0.35, 0.55, 0.12), new Color3(0.08, 0.2, 0.02)),
    warning: m("warn", new Color3(0.75, 0.6, 0.1), new Color3(0.15, 0.1, 0)),
    wood: m("wood", new Color3(0.45, 0.3, 0.16)),
    cloth: m("cloth", new Color3(0.4, 0.38, 0.28)),
    cable: m("cable", new Color3(0.15, 0.15, 0.15)),
    emissive: m("em", new Color3(0.3, 0.55, 0.4), new Color3(0.08, 0.25, 0.12)),
    sign: m("sign", new Color3(0.7, 0.55, 0.15)),
    soil: m("soil", new Color3(0.38, 0.26, 0.14)),
    rope: m("rope", new Color3(0.5, 0.42, 0.28)),
  };
}

type ShapeKind =
  | "log" | "bush" | "mushroom" | "boulder" | "rubble" | "mine-prop"
  | "road-strip" | "car-wreck" | "barrier" | "sign"
  | "tank" | "pipe" | "crate-stack" | "spool"
  | "building-stub" | "sidewalk" | "urban-prop" | "facade"
  | "corridor" | "cabinet" | "conduit" | "warn"
  | "snow-rock" | "frozen-log" | "drift" | "ice-sheet"
  | "pool" | "dead-tree" | "reed" | "swamp-mush"
  | "dune-rock" | "dead-brush" | "wreck" | "bone"
  | "hazard-sign" | "ruined-tank" | "toxic-pool"
  | "tent" | "crate" | "tarp" | "barrel"
  | "pier" | "boat" | "dock"
  | "plot" | "fence" | "crop" | "trough";

function scatter(
  scene: Scene,
  parent: TransformNode,
  matA: StandardMaterial,
  matB: StandardMaterial,
  seed: number,
  count: number,
  kind: ShapeKind,
): void {
  let s = seed >>> 0 || 1;
  const rng = (): number => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0;
    return s / 0x100000000;
  };
  for (let i = 0; i < count; i += 1) {
    // Keep clear spawn radius
    let x = (rng() - 0.5) * 42;
    let z = (rng() - 0.5) * 42;
    if (Math.hypot(x, z) < 4.5) {
      x += x >= 0 ? 6 : -6;
      z += z >= 0 ? 5 : -5;
    }
    const yaw = rng() * Math.PI * 2;
    placeShape(scene, parent, matA, matB, kind, x, z, yaw, 0.75 + rng() * 0.7);
  }
}

function placeShape(
  scene: Scene,
  parent: TransformNode,
  matA: StandardMaterial,
  matB: StandardMaterial,
  kind: ShapeKind,
  x: number,
  z: number,
  yaw: number,
  scale: number,
): void {
  const y0 = 0;
  switch (kind) {
    case "log":
    case "frozen-log": {
      const m = MeshBuilder.CreateCylinder("bp", { diameter: 0.35 * scale, height: 2.4 * scale, tessellation: 7 }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.18 * scale, z);
      m.rotation.set(0, yaw, Math.PI / 2);
      m.material = matA;
      break;
    }
    case "bush":
    case "mushroom":
    case "swamp-mush":
    case "crop": {
      const m = MeshBuilder.CreateCylinder("bp", {
        diameterTop: kind === "mushroom" || kind === "swamp-mush" ? 0.35 * scale : 0.08 * scale,
        diameterBottom: kind === "crop" ? 0.25 * scale : 0.55 * scale,
        height: kind === "crop" ? 0.45 * scale : 0.5 * scale,
        tessellation: 5,
      }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.25 * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "boulder":
    case "snow-rock":
    case "dune-rock":
    case "rubble": {
      const m = MeshBuilder.CreateBox("bp", { width: 1.3 * scale, height: 0.9 * scale, depth: 1.1 * scale }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.4 * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "road-strip":
    case "sidewalk":
    case "pier":
    case "dock":
    case "plot": {
      const m = MeshBuilder.CreateBox("bp", {
        width: kind === "road-strip" ? 6 : kind === "pier" ? 5 : 3.2,
        height: 0.08,
        depth: kind === "road-strip" ? 2.2 : 1.6,
      }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.04, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "car-wreck":
    case "boat":
    case "wreck": {
      const body = MeshBuilder.CreateBox("bp", { width: 2.2 * scale, height: 0.7 * scale, depth: 1.1 * scale }, scene);
      body.parent = parent;
      body.position.set(x, y0 + 0.4 * scale, z);
      body.rotation.y = yaw;
      body.material = matA;
      const cab = MeshBuilder.CreateBox("bp2", { width: 0.9 * scale, height: 0.55 * scale, depth: 1 * scale }, scene);
      cab.parent = parent;
      cab.position.set(x + Math.cos(yaw) * 0.4, y0 + 0.85 * scale, z + Math.sin(yaw) * 0.4);
      cab.rotation.y = yaw;
      cab.material = matB;
      break;
    }
    case "barrier":
    case "fence":
    case "sign":
    case "hazard-sign":
    case "warn": {
      const m = MeshBuilder.CreateBox("bp", { width: 1.4 * scale, height: 1.0 * scale, depth: 0.15 * scale }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.5 * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "tank":
    case "barrel":
    case "spool":
    case "ruined-tank": {
      const m = MeshBuilder.CreateCylinder("bp", { diameter: 1.1 * scale, height: 1.4 * scale, tessellation: 8 }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.7 * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "pipe":
    case "conduit": {
      const m = MeshBuilder.CreateCylinder("bp", { diameter: 0.28 * scale, height: 3.2 * scale, tessellation: 6 }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.4 * scale, z);
      m.rotation.set(0, yaw, Math.PI / 2);
      m.material = matA;
      break;
    }
    case "crate-stack":
    case "crate":
    case "cabinet":
    case "building-stub":
    case "facade":
    case "corridor":
    case "urban-prop":
    case "mine-prop": {
      const h = kind === "building-stub" || kind === "corridor" || kind === "facade" ? 2.8 * scale : 0.9 * scale;
      const m = MeshBuilder.CreateBox("bp", {
        width: kind === "corridor" ? 4 : 1.2 * scale,
        height: h,
        depth: kind === "corridor" ? 1.2 : 1.1 * scale,
      }, scene);
      m.parent = parent;
      m.position.set(x, y0 + h / 2, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "drift":
    case "pool":
    case "toxic-pool":
    case "ice-sheet": {
      const m = MeshBuilder.CreateCylinder("bp", {
        diameter: kind === "ice-sheet" ? 3.2 * scale : 2.4 * scale,
        height: kind === "ice-sheet" ? 0.08 : 0.12,
        tessellation: 10,
      }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.05, z);
      m.material = matA;
      break;
    }
    case "dead-tree":
    case "dead-brush":
    case "reed": {
      const m = MeshBuilder.CreateCylinder("bp", {
        diameterTop: 0.05,
        diameterBottom: kind === "reed" ? 0.12 : 0.35 * scale,
        height: kind === "reed" ? 1.4 * scale : 2.2 * scale,
        tessellation: 5,
      }, scene);
      m.parent = parent;
      m.position.set(x, y0 + (kind === "reed" ? 0.7 : 1.1) * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "bone": {
      const m = MeshBuilder.CreateBox("bp", { width: 0.9 * scale, height: 0.12, depth: 0.18 }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.08, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    case "tent":
    case "tarp": {
      const m = MeshBuilder.CreateBox("bp", { width: 2.2 * scale, height: 0.08, depth: 1.6 * scale }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.9 * scale, z);
      m.rotation.set(0.35, yaw, 0);
      m.material = matA;
      break;
    }
    case "trough": {
      const m = MeshBuilder.CreateBox("bp", { width: 1.6 * scale, height: 0.45 * scale, depth: 0.55 * scale }, scene);
      m.parent = parent;
      m.position.set(x, y0 + 0.25 * scale, z);
      m.rotation.y = yaw;
      m.material = matA;
      break;
    }
    default:
      break;
  }
}

function placeLandmark(scene: Scene, parent: TransformNode, mats: PackMats, biome: BiomeVisualId): void {
  const lx = 12;
  const lz = -10;
  switch (biome) {
    case "urban": {
      for (let i = 0; i < 4; i += 1) {
        const h = 3 + i * 1.2;
        const m = MeshBuilder.CreateBox("landmark", { width: 2.2, height: h, depth: 2.2 }, scene);
        m.parent = parent;
        m.position.set(lx + i * 2.6, h / 2, lz);
        m.material = i % 2 === 0 ? mats.concrete : mats.brick;
      }
      break;
    }
    case "industrial": {
      const tank = MeshBuilder.CreateCylinder("landmark", { diameter: 4, height: 5, tessellation: 12 }, scene);
      tank.parent = parent;
      tank.position.set(lx, 2.5, lz);
      tank.material = mats.rust;
      break;
    }
    case "bunker":
    case "underground": {
      const hall = MeshBuilder.CreateBox("landmark", { width: 8, height: 3.2, depth: 12 }, scene);
      hall.parent = parent;
      hall.position.set(0, 1.6, -14);
      hall.material = mats.concrete;
      const entry = MeshBuilder.CreateBox("landmark2", { width: 2.2, height: 2.4, depth: 1 }, scene);
      entry.parent = parent;
      entry.position.set(0, 1.2, -7.5);
      entry.material = mats.metal;
      break;
    }
    case "road": {
      const strip = MeshBuilder.CreateBox("landmark", { width: 6, height: 0.1, depth: 28 }, scene);
      strip.parent = parent;
      strip.position.set(0, 0.05, 0);
      strip.material = mats.asphalt;
      break;
    }
    case "waterfront": {
      const pier = MeshBuilder.CreateBox("landmark", { width: 3, height: 0.35, depth: 14 }, scene);
      pier.parent = parent;
      pier.position.set(lx, 0.2, lz);
      pier.material = mats.wood;
      break;
    }
    case "exclusion": {
      const tower = MeshBuilder.CreateBox("landmark", { width: 1.2, height: 7, depth: 1.2 }, scene);
      tower.parent = parent;
      tower.position.set(lx, 3.5, lz);
      tower.material = mats.metal;
      break;
    }
    case "snow": {
      const cabin = MeshBuilder.CreateBox("landmark", { width: 4, height: 2.4, depth: 3.5 }, scene);
      cabin.parent = parent;
      cabin.position.set(lx, 1.2, lz);
      cabin.material = mats.wood;
      break;
    }
    case "autumn": {
      const pile = MeshBuilder.CreateCylinder("landmark", { diameter: 5, height: 1.2, tessellation: 10 }, scene);
      pile.parent = parent;
      pile.position.set(lx, 0.6, lz);
      pile.material = mats.autumnLeaf;
      const barn = MeshBuilder.CreateBox("landmark2", { width: 4.5, height: 2.6, depth: 3.2 }, scene);
      barn.parent = parent;
      barn.position.set(lx - 6, 1.3, lz + 4);
      barn.material = mats.wood;
      break;
    }
    case "seaside": {
      const pier = MeshBuilder.CreateBox("landmark", { width: 2.4, height: 0.4, depth: 16 }, scene);
      pier.parent = parent;
      pier.position.set(lx + 4, 0.2, 2);
      pier.material = mats.wood;
      const sea = MeshBuilder.CreateBox("landmark-sea", { width: 28, height: 0.08, depth: 10 }, scene);
      sea.parent = parent;
      sea.position.set(0, 0.02, 18);
      sea.material = mats.water;
      const rock = MeshBuilder.CreateBox("landmark-rock", { width: 3, height: 1.5, depth: 2.4 }, scene);
      rock.parent = parent;
      rock.position.set(-12, 0.7, 14);
      rock.material = mats.rock;
      break;
    }
    case "swamp": {
      const shack = MeshBuilder.CreateBox("landmark", { width: 3.5, height: 2, depth: 3 }, scene);
      shack.parent = parent;
      shack.position.set(lx, 1, lz);
      shack.material = mats.wood;
      break;
    }
    case "camp": {
      const tentA = MeshBuilder.CreateBox("landmark", { width: 3, height: 0.1, depth: 2.4 }, scene);
      tentA.parent = parent;
      tentA.position.set(lx, 1.3, lz);
      tentA.rotation.x = 0.4;
      tentA.material = mats.cloth;
      break;
    }
    case "dense-forest":
    case "forest": {
      // Fallen giant + stump cluster near far edge
      const giant = MeshBuilder.CreateCylinder("landmark", { diameter: 0.7, height: 8, tessellation: 8 }, scene);
      giant.parent = parent;
      giant.position.set(lx, 0.35, lz);
      giant.rotation.z = Math.PI / 2;
      giant.material = mats.trunk;
      break;
    }
    case "rocky": {
      const cliff = MeshBuilder.CreateBox("landmark", { width: 8, height: 4.5, depth: 3 }, scene);
      cliff.parent = parent;
      cliff.position.set(lx, 2.2, lz);
      cliff.material = mats.rock;
      break;
    }
    case "desert": {
      const mesa = MeshBuilder.CreateBox("landmark", { width: 6, height: 2.8, depth: 5 }, scene);
      mesa.parent = parent;
      mesa.position.set(lx, 1.4, lz);
      mesa.material = mats.sand;
      break;
    }
    case "farm": {
      const barn = MeshBuilder.CreateBox("landmark", { width: 5, height: 3, depth: 4 }, scene);
      barn.parent = parent;
      barn.position.set(lx, 1.5, lz);
      barn.material = mats.wood;
      break;
    }
    default:
      break;
  }
}
