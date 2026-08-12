import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { Interactable } from "../interaction/Interactable.ts";
import type { InteractionPoint } from "../interaction/InteractionTypes.ts";

/**
 * Corpse bag world marker — interactable only (loot domain lives in DeathBagSystem).
 */
export class DeathBagEntity implements Interactable {
  readonly interactionId: string;
  readonly interactionType = "container" as const;
  private readonly position: InteractionPoint;
  private readonly root: TransformNode;
  private active = true;

  constructor(scene: Scene, bagId: string, x: number, z: number) {
    this.interactionId = bagId;
    this.position = Object.freeze({ x, y: 0, z });
    this.root = new TransformNode(`DeathBag:${bagId}`, scene);
    this.root.position.set(x, 0, z);

    const fabric = new StandardMaterial(`DeathBagMat:${bagId}`, scene);
    fabric.diffuseColor = new Color3(0.42, 0.34, 0.22);
    fabric.emissiveColor = new Color3(0.08, 0.05, 0.02);
    fabric.specularColor = new Color3(0.05, 0.05, 0.04);

    const bag = MeshBuilder.CreateBox(`DeathBagBody:${bagId}`, { width: 0.55, height: 0.28, depth: 0.42 }, scene);
    bag.parent = this.root;
    bag.position.y = 0.16;
    bag.rotation.y = 0.35;
    bag.material = fabric;
    bag.isPickable = false;

    const strap = MeshBuilder.CreateBox(`DeathBagStrap:${bagId}`, { width: 0.12, height: 0.06, depth: 0.5 }, scene);
    strap.parent = this.root;
    strap.position.set(0, 0.32, 0);
    strap.material = fabric;
    strap.isPickable = false;

    const glow = MeshBuilder.CreateGround(`DeathBagGlow:${bagId}`, { width: 0.9, height: 0.9 }, scene);
    glow.parent = this.root;
    glow.position.y = 0.02;
    const glowMat = new StandardMaterial(`DeathBagGlowMat:${bagId}`, scene);
    glowMat.diffuseColor = new Color3(0.55, 0.38, 0.12);
    glowMat.emissiveColor = new Color3(0.28, 0.16, 0.04);
    glowMat.alpha = 0.55;
    glow.material = glowMat;
    glow.isPickable = false;
  }

  get bagId(): string { return this.interactionId; }
  isInteractionEnabled(): boolean { return this.active; }
  getInteractionPosition(): InteractionPoint { return this.position; }
  getInteractionRadius(): number { return 1.05; }
  tryInteract(): boolean { return this.active; }
  setActive(active: boolean): void {
    this.active = active;
    this.root.setEnabled(active);
  }

  dispose(): void {
    this.active = false;
    this.root.dispose(false, true);
  }
}
