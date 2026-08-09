import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import type { Scene } from "@babylonjs/core/scene";
import type { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { StandardMaterial as BabylonStandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import type { HarvestResourceKind } from "../../harvesting/HarvestingTypes";
import type { WorldMaterials } from "../../rendering/Materials";

interface ImpactParticle {
  mesh: Mesh;
  velocity: Vector3;
  life: number;
  maxLife: number;
  dust: boolean;
}

export class HarvestImpactEffects {
  private readonly particles: ImpactParticle[] = [];
  private readonly woodMaterial: StandardMaterial;
  private readonly rockMaterials: readonly StandardMaterial[];
  private readonly dustMaterial: StandardMaterial;
  private cursor = 0;

  constructor(scene: Scene, materials: WorldMaterials) {
    this.woodMaterial = materials.wood;
    this.rockMaterials = materials.rock;
    this.dustMaterial = new BabylonStandardMaterial("HarvestDustMaterial", scene);
    this.dustMaterial.diffuseColor = new Color3(0.43, 0.39, 0.3);
    this.dustMaterial.emissiveColor = new Color3(0.12, 0.11, 0.08);
    this.dustMaterial.specularColor = Color3.Black();
    this.dustMaterial.alpha = 0.24;
    this.dustMaterial.disableLighting = true;
    for (let index = 0; index < 36; index += 1) {
      const dust = index % 4 === 0;
      const mesh = dust
        ? MeshBuilder.CreateSphere("HarvestDust", { diameter: 0.18, segments: 6 }, scene)
        : MeshBuilder.CreateBox("HarvestChip", { size: 0.1 }, scene);
      mesh.material = dust ? this.dustMaterial : index % 2 === 0 ? materials.wood : materials.rock[index % materials.rock.length];
      mesh.isPickable = false;
      mesh.setEnabled(false);
      this.particles.push({ mesh, velocity: Vector3.Zero(), life: 0, maxLife: 0, dust });
    }
  }

  spawn(kind: HarvestResourceKind, position: Readonly<Vector3>, intensity: number, final = false): void {
    const count = Math.max(2, Math.round((final ? 8 : 4) * intensity));
    for (let index = 0; index < count; index += 1) {
      const particle = this.particles[this.cursor++ % this.particles.length];
      const angle = (this.cursor * 2.399963 + index * 0.71) % (Math.PI * 2);
      const speed = (final ? 1.35 : 0.85) * (0.75 + (index % 3) * 0.18) * Math.max(0.35, intensity);
      particle.mesh.material = particle.dust ? this.dustMaterial : kind === "pine-tree" ? this.woodMaterial : this.rockMaterials[index % this.rockMaterials.length];
      particle.mesh.position.set(position.x + Math.cos(angle) * 0.16, kind === "pine-tree" ? 0.75 : 0.38, position.z + Math.sin(angle) * 0.16);
      particle.mesh.scaling.setAll(particle.dust ? 1 : kind === "pine-tree" ? 0.9 : 0.75);
      if (!particle.dust && kind === "pine-tree") particle.mesh.scaling.y = 0.36;
      particle.mesh.rotation.set(angle * 0.3, angle, -angle * 0.2);
      particle.velocity.set(Math.cos(angle) * speed * (particle.dust ? 0.28 : 1), particle.dust ? 0.28 : 0.8 + (index % 4) * 0.16, Math.sin(angle) * speed * (particle.dust ? 0.28 : 1));
      particle.life = final ? 0.9 : 0.58;
      particle.maxLife = particle.life;
      particle.mesh.visibility = 1;
      particle.mesh.setEnabled(true);
    }
  }

  update(delta: number): void {
    if (delta <= 0) return;
    for (const particle of this.particles) {
      if (particle.life <= 0) continue;
      particle.life -= delta;
      if (particle.life <= 0) {
        particle.mesh.setEnabled(false);
        continue;
      }
      particle.velocity.y -= (particle.dust ? 0.15 : 3.8) * delta;
      particle.mesh.position.addInPlace(particle.velocity.scale(delta));
      if (particle.dust) {
        particle.mesh.scaling.addInPlaceFromFloats(delta * 0.8, delta * 0.45, delta * 0.8);
        particle.mesh.visibility = Math.min(1, particle.life / Math.max(0.001, particle.maxLife * 0.55));
      } else {
        particle.mesh.rotation.x += delta * 5;
        particle.mesh.rotation.z += delta * 3.4;
      }
    }
  }
}
