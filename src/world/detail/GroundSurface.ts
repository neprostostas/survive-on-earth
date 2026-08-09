import { Color3, Color4 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";
import type { Scene } from "@babylonjs/core/scene";
import type { CalibrationConfig } from "../../config/calibrationConfig";
import { GAME_CONFIG } from "../../config/gameConfig";
import type { ProceduralTextureFactory } from "../../rendering/ProceduralTextureFactory";

export class GroundSurface {
  readonly mesh: Mesh;
  private readonly material: StandardMaterial;
  private readonly colorTexture;
  private lastDetail = Number.NaN;
  private lastDirt = Number.NaN;

  constructor(scene: Scene, textures: ProceduralTextureFactory, private readonly config: CalibrationConfig) {
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
    this.mesh.material = this.material;
    this.mesh.useVertexColors = true;
    this.mesh.receiveShadows = true;
    scene.clearColor = new Color4(0.36, 0.48, 0.25, 1);
    this.applyCalibration(textures);
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
