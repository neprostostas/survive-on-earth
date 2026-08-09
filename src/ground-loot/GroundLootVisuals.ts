import { Color3 } from "@babylonjs/core/Maths/math.color";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { InteractionPoint } from "../interaction/InteractionTypes";
import type { GroundLoot } from "./GroundLoot";
import type { GroundLootPresentation } from "./GroundLootSystem";
import { GROUND_LOOT_CONFIG } from "./groundLootConfig";

interface LootVisual {
  readonly root: TransformNode;
  collecting: boolean;
  elapsed: number;
  start: InteractionPoint;
  target: InteractionPoint;
}

export class GroundLootVisuals implements GroundLootPresentation {
  private readonly visuals = new Map<string, LootVisual>();
  private readonly bark: StandardMaterial;
  private readonly cutFace: StandardMaterial;
  private readonly limestone: StandardMaterial;
  private readonly fabricGreen: StandardMaterial;
  private readonly fabricBlue: StandardMaterial;
  private readonly fabricOlive: StandardMaterial;
  private readonly sneaker: StandardMaterial;

  constructor(private readonly scene: Scene) {
    this.bark = this.createMaterial("GroundLootBark", new Color3(0.31, 0.22, 0.14));
    this.cutFace = this.createMaterial("GroundLootCutFace", new Color3(0.63, 0.53, 0.35));
    this.limestone = this.createMaterial("GroundLootLimestone", new Color3(0.53, 0.55, 0.49));
    this.fabricGreen = this.createMaterial("GroundLootHat", new Color3(0.31, 0.42, 0.25));
    this.fabricBlue = this.createMaterial("GroundLootShirt", new Color3(0.25, 0.38, 0.42));
    this.fabricOlive = this.createMaterial("GroundLootPants", new Color3(0.33, 0.36, 0.23));
    this.sneaker = this.createMaterial("GroundLootSneaker", new Color3(0.57, 0.55, 0.48));
  }

  spawn(entity: GroundLoot): void {
    const position = entity.getInteractionPosition();
    const root = new TransformNode(`GroundLootVisual:${entity.interactionId}`, this.scene);
    root.position.set(position.x, position.y, position.z);
    root.scaling.setAll(GROUND_LOOT_CONFIG.visualScale);
    switch (entity.stack.itemId) {
      case "pine-log": this.createLogBundle(root); break;
      case "limestone": this.createLimestone(root); break;
      case "dad-hat": this.createHat(root); break;
      case "shirt": this.createShirt(root); break;
      case "cargo-pants": this.createPants(root); break;
      case "sneakers": this.createSneakers(root); break;
    }
    this.visuals.set(entity.interactionId, {
      root,
      collecting: false,
      elapsed: 0,
      start: Object.freeze({ ...position }),
      target: Object.freeze({ ...position }),
    });
  }

  collect(entity: GroundLoot, playerPosition: InteractionPoint): void {
    const visual = this.visuals.get(entity.interactionId);
    if (!visual || visual.collecting) return;
    visual.collecting = true;
    visual.elapsed = 0;
    visual.start = Object.freeze({ x: visual.root.position.x, y: visual.root.position.y, z: visual.root.position.z });
    visual.target = Object.freeze({
      x: playerPosition.x,
      y: playerPosition.y + GROUND_LOOT_CONFIG.pickupPlayerHeight,
      z: playerPosition.z,
    });
  }

  update(delta: number): readonly string[] {
    const completed: string[] = [];
    for (const [id, visual] of this.visuals) {
      if (!visual.collecting) continue;
      visual.elapsed += delta;
      const progress = Math.min(1, visual.elapsed / GROUND_LOOT_CONFIG.pickupDuration);
      const eased = 1 - (1 - progress) * (1 - progress);
      const arc = Math.sin(progress * Math.PI) * GROUND_LOOT_CONFIG.pickupLift;
      visual.root.position.set(
        visual.start.x + (visual.target.x - visual.start.x) * eased,
        visual.start.y + (visual.target.y - visual.start.y) * eased + arc,
        visual.start.z + (visual.target.z - visual.start.z) * eased,
      );
      visual.root.scaling.setAll(GROUND_LOOT_CONFIG.visualScale * (1 - eased * 0.72));
      if (progress >= 1) completed.push(id);
    }
    return completed;
  }

  remove(entity: GroundLoot): void {
    const visual = this.visuals.get(entity.interactionId);
    if (!visual) return;
    visual.root.dispose(false, false);
    this.visuals.delete(entity.interactionId);
  }

  private createLogBundle(root: TransformNode): void {
    // Single short stick for quantity-1 loose drops; multi-stack keeps a small bundle.
    this.createSingleLog(root, 0.1, 0, 0.08);
  }

  private createSingleLog(root: TransformNode, y: number, z: number, rotation: number): void {
    const log = MeshBuilder.CreateCylinder("GroundPineLog", { height: 0.52, diameter: 0.13, tessellation: 10 }, this.scene);
    log.parent = root;
    log.position.set(0, y, z);
    log.rotation.set(0, rotation, Math.PI / 2);
    log.material = this.bark;
    log.isPickable = false;
    for (const side of [-1, 1]) {
      const end = MeshBuilder.CreateCylinder(`GroundPineLogEnd:${side}`, { height: 0.01, diameter: 0.11, tessellation: 10 }, this.scene);
      end.parent = log;
      end.position.y = side * 0.265;
      end.material = this.cutFace;
      end.isPickable = false;
    }
  }

  private createLimestone(root: TransformNode): void {
    // Smaller loose chunk than harvestable Limestone Rock nodes.
    const stone = MeshBuilder.CreateSphere("GroundLimestone", { diameter: 0.38, segments: 8 }, this.scene);
    stone.parent = root;
    stone.position.y = 0.14;
    stone.scaling.set(1.05, 0.7, 0.92);
    stone.rotation.set(0.12, 0.38, -0.08);
    stone.material = this.limestone;
    stone.isPickable = false;
  }

  private createHat(root: TransformNode): void {
    const crown = MeshBuilder.CreateCylinder("GroundDadHatCrown", { height: 0.18, diameterTop: 0.34, diameterBottom: 0.48, tessellation: 12 }, this.scene);
    crown.parent = root;
    crown.position.y = 0.22;
    crown.material = this.fabricGreen;
    crown.isPickable = false;
    const brim = MeshBuilder.CreateBox("GroundDadHatBrim", { width: 0.48, height: 0.05, depth: 0.34 }, this.scene);
    brim.parent = root;
    brim.position.set(0, 0.13, 0.23);
    brim.material = this.fabricGreen;
    brim.isPickable = false;
  }

  private createShirt(root: TransformNode): void {
    const body = MeshBuilder.CreateBox("GroundShirt", { width: 0.48, height: 0.5, depth: 0.12 }, this.scene);
    body.parent = root;
    body.position.y = 0.27;
    body.rotation.y = -0.25;
    body.material = this.fabricBlue;
    body.isPickable = false;
    for (const side of [-1, 1]) {
      const sleeve = MeshBuilder.CreateBox("GroundShirtSleeve", { width: 0.22, height: 0.2, depth: 0.12 }, this.scene);
      sleeve.parent = body;
      sleeve.position.set(side * 0.31, 0.12, 0);
      sleeve.rotation.z = side * -0.32;
      sleeve.material = this.fabricBlue;
      sleeve.isPickable = false;
    }
  }

  private createPants(root: TransformNode): void {
    for (const side of [-1, 1]) {
      const leg = MeshBuilder.CreateBox("GroundCargoPantsLeg", { width: 0.2, height: 0.58, depth: 0.14 }, this.scene);
      leg.parent = root;
      leg.position.set(side * 0.11, 0.3, 0);
      leg.rotation.set(0.08, 0.3, side * 0.08);
      leg.material = this.fabricOlive;
      leg.isPickable = false;
    }
  }

  private createSneakers(root: TransformNode): void {
    for (const side of [-1, 1]) {
      const shoe = MeshBuilder.CreateBox("GroundSneaker", { width: 0.22, height: 0.14, depth: 0.42 }, this.scene);
      shoe.parent = root;
      shoe.position.set(side * 0.14, 0.12, side * 0.04);
      shoe.rotation.y = side * 0.22;
      shoe.material = this.sneaker;
      shoe.isPickable = false;
    }
  }

  private createMaterial(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.06, 0.06, 0.05);
    material.roughness = 0.9;
    return material;
  }
}
