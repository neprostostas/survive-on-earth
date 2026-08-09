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

    this.batches.push(
      this.batch(grass, 180, 401, 0.7, 1.35, 0.12),
      this.batch(dryGrass, 72, 773, 0.7, 1.25, 0.095),
      this.batch(pebble, 74, 991, 0.65, 1.55, 0.055),
      this.batch(twig, 42, 1337, 0.75, 1.35, 0.035),
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

  applyCalibration(): void {
    const density = this.config.visual.clutterDensity;
    const preset = this.config.visual.qualityPreset;
    if (Math.abs(density - this.lastDensity) < 0.001 && preset === this.lastPreset) return;
    const multiplier = getVisualQualitySettings(preset).detailMultiplier;
    this.count = 0;
    for (const batch of this.batches) {
      const count = Math.max(1, Math.min(batch.maxCount, Math.round(batch.maxCount * density * multiplier)));
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
