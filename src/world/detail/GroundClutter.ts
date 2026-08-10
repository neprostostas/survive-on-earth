import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../../config/calibrationConfig";
import { getVisualQualitySettings } from "../../config/visualQualityConfig";
import type { WorldMaterials } from "../../rendering/Materials";

interface ClutterBatch {
  mesh: Mesh;
  matrices: Float32Array;
  maxCount: number;
}

export class GroundClutter {
  private readonly batches: ClutterBatch[] = [];
  private lastDensity = Number.NaN;
  private lastPreset = "";
  private themeDensityMul = 1;
  count = 0;

  constructor(scene: Scene, materials: WorldMaterials, private readonly config: CalibrationConfig) {
    // Source meshes only supply geometry/material for thin instances.
    // Leave them at identity with baked Y offsets in the instance matrices —
    // never leave visible prototypes stacked at world origin (looks like a false "axes gizmo").
    const grass = MeshBuilder.CreateCylinder("GrassTuftSource", { height: 0.24, diameterTop: 0.015, diameterBottom: 0.12, tessellation: 3 }, scene);
    grass.material = materials.bush;
    const dryGrass = MeshBuilder.CreateCylinder("DryGrassSource", { height: 0.19, diameterTop: 0.01, diameterBottom: 0.1, tessellation: 3 }, scene);
    dryGrass.material = materials.dryGrass;
    const pebble = MeshBuilder.CreateSphere("PebbleSource", { diameter: 0.13, segments: 7 }, scene);
    pebble.material = materials.rock[1];
    const twig = MeshBuilder.CreateBox("TwigSource", { width: 0.34, height: 0.035, depth: 0.045 }, scene);
    twig.material = materials.trunk;

    const weed = MeshBuilder.CreateCylinder("WeedSource", { height: 0.16, diameterTop: 0.02, diameterBottom: 0.14, tessellation: 4 }, scene);
    weed.material = materials.bush;
    const flower = MeshBuilder.CreateSphere("FlowerSource", { diameter: 0.1, segments: 5 }, scene);
    flower.material = materials.foliage[0] ?? materials.bush;
    const leafLitter = MeshBuilder.CreateBox("LeafLitterSource", { width: 0.22, height: 0.02, depth: 0.14 }, scene);
    leafLitter.material = materials.pineNeedles;
    this.batches.push(
      this.batch(grass, 280, 401, 0.7, 1.45, 0.12),
      this.batch(dryGrass, 140, 773, 0.65, 1.35, 0.095),
      this.batch(pebble, 120, 991, 0.55, 1.65, 0.055),
      this.batch(twig, 70, 1337, 0.7, 1.4, 0.035),
      this.batch(weed, 90, 1601, 0.7, 1.3, 0.08),
      this.batch(flower, 48, 1889, 0.8, 1.2, 0.06),
      this.batch(leafLitter, 60, 2113, 0.7, 1.5, 0.02),
    );
    for (const batch of this.batches) {
      batch.mesh.isPickable = false;
      batch.mesh.receiveShadows = true;
      batch.mesh.alwaysSelectAsActiveMesh = true;
      // Thin-instance matrices are absolute world matrices; tuck the unused template off-world
      // so a failed/empty thin-instance bind cannot leave a stacked junk mesh at (0,0,0).
      batch.mesh.position.set(0, -10_000, 0);
    }
    this.applyCalibration();
  }

  setThemeDensity(mul: number): void {
    this.themeDensityMul = Math.max(0.05, Math.min(2, mul));
    this.lastDensity = Number.NaN;
    this.applyCalibration();
  }

  applyCalibration(): void {
    const density = this.config.visual.clutterDensity * this.themeDensityMul;
    const preset = this.config.visual.qualityPreset;
    if (Math.abs(density - this.lastDensity) < 0.001 && preset === this.lastPreset) return;
    const multiplier = getVisualQualitySettings(preset).detailMultiplier;
    this.count = 0;
    for (const batch of this.batches) {
      const count = Math.max(0, Math.min(batch.maxCount, Math.round(batch.maxCount * density * multiplier)));
      if (count < 1) {
        batch.mesh.thinInstanceSetBuffer("matrix", new Float32Array(0), 16, true);
        continue;
      }
      batch.mesh.thinInstanceSetBuffer("matrix", batch.matrices.slice(0, count * 16), 16, true);
      this.count += count;
    }
    this.lastDensity = density;
    this.lastPreset = preset;
  }

  private batch(mesh: Mesh, maxCount: number, seed: number, minScale: number, maxScale: number, yOffset: number): ClutterBatch {
    const matrices = new Float32Array(maxCount * 16);
    const rng = this.random(seed);
    const scale = new Vector3(1, 1, 1);
    const translation = new Vector3();
    for (let i = 0; i < maxCount; i += 1) {
      let x = rng() * 52 - 26;
      let z = rng() * 52 - 26;
      if (x > 3.4 && x < 12.6 && z > -14.5 && z < -5.5) {
        x -= 11;
        z += 7;
      }
      const uniform = minScale + rng() * (maxScale - minScale);
      scale.set(uniform * (0.8 + rng() * 0.4), uniform, uniform * (0.8 + rng() * 0.4));
      translation.set(x, yOffset, z);
      const rotation = Quaternion.RotationYawPitchRoll(rng() * Math.PI * 2, 0, 0);
      Matrix.Compose(scale, rotation, translation).copyToArray(matrices, i * 16);
    }
    return { mesh, matrices, maxCount };
  }

  private random(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }
}
