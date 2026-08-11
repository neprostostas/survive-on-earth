import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../../config/calibrationConfig";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { ProceduralTextureFactory } from "../../rendering/ProceduralTextureFactory";
import type { LocationVisualTheme } from "../../locations/LocationVisualTheme";

export class GroundSurface {
  readonly mesh: Mesh;
  private readonly material: StandardMaterial;
  private readonly colorTexture;
  private lastDetail = Number.NaN;
  private lastDirt = Number.NaN;
  private readonly scene: Scene;

  constructor(scene: Scene, textures: ProceduralTextureFactory, private readonly config: CalibrationConfig) {
    this.scene = scene;
    this.mesh = MeshBuilder.CreateGround("Ground", { width: GAME_CONFIG.worldSize, height: GAME_CONFIG.worldSize, subdivisions: 48 }, scene);
    const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
    if (positions) {
      const colors: number[] = [];
      for (let i = 0; i < positions.length; i += 3) {
        const x = positions[i];
        const z = positions[i + 2];
        const broad = Math.sin(x * 0.32 + z * 0.17) * 0.017;
        const fine = Math.sin(x * 1.18 - z * 0.73) * 0.008;
        positions[i + 1] = broad + fine;
        const tint = broad * 0.7;
        colors.push(0.96 + tint, 0.98 + tint, 0.92 + tint, 1);
      }
      this.mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
      this.mesh.setVerticesData(VertexBuffer.ColorKind, colors);
      this.mesh.refreshBoundingInfo();
    }
    this.material = new StandardMaterial("ProceduralTerrainMaterial", scene);
    this.colorTexture = textures.createGroundTexture(config.visual.groundDetail, config.visual.dirtIntensity);
    this.material.diffuseTexture = this.colorTexture;
    this.material.diffuseColor = Color3.White();
    this.material.specularColor = new Color3(0.015, 0.015, 0.012);
    this.material.specularPower = 18;
    this.colorTexture.anisotropicFilteringLevel = 16;
    this.mesh.material = this.material;
    this.mesh.useVertexColors = true;
    this.mesh.receiveShadows = true;
    scene.clearColor = new Color4(0.39, 0.44, 0.29, 1);
    this.applyCalibration(textures);
  }

  applyTheme(theme: LocationVisualTheme): void {
    this.material.diffuseColor = theme.groundTint;
    const [r, g, b] = theme.clearColor;
    this.scene.clearColor = new Color4(r, g, b, 1);
    if (theme.biome === "swamp" || theme.biome === "waterfront" || theme.biome === "seaside" || theme.biome === "cataract-ford") {
      this.material.specularColor = new Color3(0.06, 0.07, 0.06);
      this.material.specularPower = 40;
    } else if (theme.biome === "ice-caldera") {
      this.material.specularColor = new Color3(0.14, 0.16, 0.2);
      this.material.specularPower = 60;
    } else if (theme.biome === "desert" || theme.biome === "snow") {
      this.material.specularColor = new Color3(0.02, 0.02, 0.02);
      this.material.specularPower = 8;
    } else if (theme.biome === "autumn" || theme.biome === "copper-heath") {
      this.material.specularColor = new Color3(0.03, 0.02, 0.01);
      this.material.specularPower = 14;
    } else {
      this.material.specularColor = new Color3(0.015, 0.015, 0.012);
      this.material.specularPower = 18;
    }
  }

  /** Reshape ground noise so each location has a unique surface footprint. */
  applyLayoutSeed(seed: number): void {
    const positions = this.mesh.getVerticesData(VertexBuffer.PositionKind);
    if (!positions) return;
    const colors: number[] = [];
    const phase = (seed % 1000) * 0.017;
    const scale = 0.85 + ((seed >>> 6) % 40) / 100;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 2];
      const broad = Math.sin(x * 0.32 * scale + z * 0.17 * scale + phase) * 0.02;
      const fine = Math.sin(x * 1.18 * scale - z * 0.73 * scale + phase * 1.7) * 0.01;
      const ridge = Math.sin((x + z) * 0.09 + phase) * 0.012 * (((seed >> 3) % 5) / 4);
      positions[i + 1] = broad + fine + ridge;
      const tint = broad * 0.7;
      colors.push(0.96 + tint, 0.98 + tint, 0.92 + tint, 1);
    }
    this.mesh.updateVerticesData(VertexBuffer.PositionKind, positions);
    this.mesh.setVerticesData(VertexBuffer.ColorKind, colors);
    this.mesh.refreshBoundingInfo();
  }

  applyCalibration(textures: ProceduralTextureFactory): void {
    const detail = this.config.visual.groundDetail;
    const dirt = this.config.visual.dirtIntensity;
    if (Math.abs(detail - this.lastDetail) > 0.001 || Math.abs(dirt - this.lastDirt) > 0.001) {
      textures.redrawGround(this.colorTexture, detail, dirt);
      this.lastDetail = detail;
      this.lastDirt = dirt;
    }
  }
}
