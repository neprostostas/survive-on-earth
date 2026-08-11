import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import type { Scene } from "@babylonjs/core/scene";
import type { HarvestTool } from "../harvesting/HarvestingTypes";
import type { HeldWeaponVisualId } from "../equipment/WeaponTypes";
import type { CharacterGender } from "./CharacterProfile";

/**
 * Procedural survivor mesh. Arms hang along local -Y; held tools parent to a
 * right-hand grip oriented so shafts sit outside the torso (not through the body).
 */
export class PlayerVisual {
  readonly root: TransformNode;
  readonly bodyPivot: TransformNode;
  readonly leftArm: TransformNode;
  readonly rightArm: TransformNode;
  readonly leftLeg: TransformNode;
  readonly rightLeg: TransformNode;
  readonly meshes: Mesh[] = [];
  private readonly rightHandGrip: TransformNode;
  private readonly hatchetTool: TransformNode;
  private readonly pickaxeTool: TransformNode;
  private readonly spearTool: TransformNode;
  private readonly baseHeight = 1.8;
  private heldWeapon: HeldWeaponVisualId | null = null;
  private harvestOverride: HarvestTool | null = null;
  private suppressHeldForUnarmed = false;
  private readonly skinMat: StandardMaterial;
  private readonly skinShadeMat: StandardMaterial;
  private readonly hairMat: StandardMaterial;
  private readonly hipsMesh: Mesh;
  private readonly waistMesh: Mesh;
  private readonly bodyMesh: Mesh;
  private readonly jacketFrontMesh: Mesh;
  private readonly headMesh: Mesh;
  private readonly jawMesh: Mesh;
  private readonly hairCapMesh: Mesh;
  private readonly hairFrontMesh: Mesh;
  private readonly hairLongL: Mesh;
  private readonly hairLongR: Mesh;
  private readonly hairBun: Mesh;
  private readonly shoulderL: Mesh;
  private readonly shoulderR: Mesh;
  private gender: CharacterGender = "male";

  constructor(scene: Scene) {
    this.root = new TransformNode("PlayerRoot", scene);
    this.bodyPivot = new TransformNode("BodyPivot", scene);
    this.bodyPivot.parent = this.root;

    this.skinMat = this.material(scene, "playerSkin", new Color3(0.72, 0.52, 0.40), 0.08);
    this.skinShadeMat = this.material(scene, "playerSkinShade", new Color3(0.58, 0.40, 0.30), 0.06);
    const undershirt = this.material(scene, "playerUndershirt", new Color3(0.22, 0.28, 0.26), 0.04);
    const jacket = this.material(scene, "playerJacket", new Color3(0.20, 0.34, 0.27), 0.05);
    const jacketDark = this.material(scene, "playerJacketDark", new Color3(0.14, 0.24, 0.19), 0.04);
    const trousers = this.material(scene, "playerTrousers", new Color3(0.18, 0.20, 0.18), 0.04);
    const boots = this.material(scene, "playerBoots", new Color3(0.12, 0.09, 0.07), 0.12);
    const leather = this.material(scene, "playerLeather", new Color3(0.28, 0.17, 0.10), 0.08);
    this.hairMat = this.material(scene, "playerHair", new Color3(0.14, 0.09, 0.05), 0.03);
    const metal = this.material(scene, "playerBeltMetal", new Color3(0.55, 0.52, 0.42), 0.35);

    // —— Torso ——
    this.hipsMesh = MeshBuilder.CreateCapsule("Hips", { height: 0.28, radius: 0.20, tessellation: 10 }, scene);
    this.hipsMesh.rotation.z = Math.PI / 2;
    this.part("Hips", this.hipsMesh, trousers, this.bodyPivot, new Vector3(0, 0.90, 0));
    this.waistMesh = MeshBuilder.CreateBox("Waist", { width: 0.38, height: 0.14, depth: 0.24 }, scene);
    this.part("Waist", this.waistMesh, undershirt, this.bodyPivot, new Vector3(0, 1.02, 0.01));
    this.bodyMesh = MeshBuilder.CreateCapsule("Body", { height: 0.72, radius: 0.215, tessellation: 12 }, scene);
    this.bodyMesh.scaling.set(1.08, 1, 0.80);
    this.part("Body", this.bodyMesh, undershirt, this.bodyPivot, new Vector3(0, 1.22, 0.01));
    this.jacketFrontMesh = MeshBuilder.CreateBox("JacketFront", { width: 0.40, height: 0.42, depth: 0.09 }, scene);
    this.part("JacketFront", this.jacketFrontMesh, jacket, this.bodyPivot, new Vector3(0, 1.30, 0.175));
    const jacketSideL = MeshBuilder.CreateBox("JacketSideL", { width: 0.07, height: 0.40, depth: 0.28 }, scene);
    this.part("JacketSideL", jacketSideL, jacketDark, this.bodyPivot, new Vector3(-0.20, 1.28, 0.02));
    const jacketSideR = MeshBuilder.CreateBox("JacketSideR", { width: 0.07, height: 0.40, depth: 0.28 }, scene);
    this.part("JacketSideR", jacketSideR, jacketDark, this.bodyPivot, new Vector3(0.20, 1.28, 0.02));
    const collarL = MeshBuilder.CreateBox("CollarL", { width: 0.12, height: 0.05, depth: 0.12 }, scene);
    collarL.rotation.z = 0.35;
    this.part("CollarL", collarL, jacket, this.bodyPivot, new Vector3(-0.10, 1.52, 0.12));
    const collarR = MeshBuilder.CreateBox("CollarR", { width: 0.12, height: 0.05, depth: 0.12 }, scene);
    collarR.rotation.z = -0.35;
    this.part("CollarR", collarR, jacket, this.bodyPivot, new Vector3(0.10, 1.52, 0.12));

    // —— Head ——
    const neck = MeshBuilder.CreateCylinder("Neck", { height: 0.15, diameter: 0.14, tessellation: 10 }, scene);
    this.part("Neck", neck, this.skinMat, this.bodyPivot, new Vector3(0, 1.54, 0.01));
    this.headMesh = MeshBuilder.CreateSphere("Head", { diameter: 0.33, segments: 12 }, scene);
    this.headMesh.scaling.set(0.90, 1.10, 0.92);
    this.part("Head", this.headMesh, this.skinMat, this.bodyPivot, new Vector3(0, 1.72, 0.02));
    this.jawMesh = MeshBuilder.CreateSphere("Jaw", { diameter: 0.20, segments: 8 }, scene);
    this.jawMesh.scaling.set(1.05, 0.55, 0.95);
    this.part("Jaw", this.jawMesh, this.skinShadeMat, this.bodyPivot, new Vector3(0, 1.60, 0.06));
    this.hairCapMesh = MeshBuilder.CreateSphere("Hair", { diameter: 0.34, segments: 10, slice: 0.58 }, scene);
    this.hairCapMesh.scaling.set(0.96, 0.62, 0.98);
    this.part("Hair", this.hairCapMesh, this.hairMat, this.bodyPivot, new Vector3(0, 1.84, -0.01));
    this.hairFrontMesh = MeshBuilder.CreateBox("HairFront", { width: 0.22, height: 0.08, depth: 0.08 }, scene);
    this.part("HairFront", this.hairFrontMesh, this.hairMat, this.bodyPivot, new Vector3(0, 1.86, 0.12));
    // Female long-hair strands (toggled via applyGender)
    this.hairLongL = MeshBuilder.CreateCapsule("HairLongL", { height: 0.42, radius: 0.055, tessellation: 8 }, scene);
    this.part("HairLongL", this.hairLongL, this.hairMat, this.bodyPivot, new Vector3(-0.12, 1.55, -0.04));
    this.hairLongR = MeshBuilder.CreateCapsule("HairLongR", { height: 0.42, radius: 0.055, tessellation: 8 }, scene);
    this.part("HairLongR", this.hairLongR, this.hairMat, this.bodyPivot, new Vector3(0.12, 1.55, -0.04));
    this.hairBun = MeshBuilder.CreateSphere("HairBun", { diameter: 0.16, segments: 8 }, scene);
    this.part("HairBun", this.hairBun, this.hairMat, this.bodyPivot, new Vector3(0, 1.88, -0.12));
    for (const x of [-0.14, 0.14] as const) {
      const ear = MeshBuilder.CreateSphere("Ear", { diameter: 0.07, segments: 6 }, scene);
      ear.scaling.set(0.55, 1, 0.85);
      this.part("Ear", ear, this.skinShadeMat, this.bodyPivot, new Vector3(x, 1.71, 0));
    }

    // —— Shoulders & pack ——
    this.shoulderL = MeshBuilder.CreateSphere("Shoulder", { diameter: 0.20, segments: 9 }, scene);
    this.shoulderL.scaling.set(1.05, 0.78, 0.95);
    this.part("Shoulder", this.shoulderL, jacket, this.bodyPivot, new Vector3(-0.30, 1.42, 0.01));
    this.shoulderR = MeshBuilder.CreateSphere("Shoulder", { diameter: 0.20, segments: 9 }, scene);
    this.shoulderR.scaling.set(1.05, 0.78, 0.95);
    this.part("Shoulder", this.shoulderR, jacket, this.bodyPivot, new Vector3(0.30, 1.42, 0.01));
    const belt = MeshBuilder.CreateBox("Belt", { width: 0.46, height: 0.07, depth: 0.30 }, scene);
    this.part("Belt", belt, leather, this.bodyPivot, new Vector3(0, 0.99, 0.01));
    const beltBuckle = MeshBuilder.CreateBox("BeltBuckle", { width: 0.09, height: 0.06, depth: 0.04 }, scene);
    this.part("BeltBuckle", beltBuckle, metal, this.bodyPivot, new Vector3(0, 0.99, 0.17));

    // —— Limbs ——
    this.leftArm = this.limb(scene, "LeftArm", -0.32, 1.40, this.skinMat, jacket, false);
    this.rightArm = this.limb(scene, "RightArm", 0.32, 1.40, this.skinMat, jacket, false);
    this.leftLeg = this.limb(scene, "LeftLeg", -0.12, 0.88, boots, trousers, true);
    this.rightLeg = this.limb(scene, "RightLeg", 0.12, 0.88, boots, trousers, true);

    this.rightHandGrip = new TransformNode("RightHandGrip", scene);
    this.rightHandGrip.parent = this.rightArm;
    this.rightHandGrip.position.set(0.04, -0.72, 0.06);

    const wood = this.material(scene, "toolHandleWood", new Color3(0.45, 0.28, 0.14), 0.06);
    const woodDark = this.material(scene, "toolHandleDark", new Color3(0.28, 0.16, 0.08), 0.05);
    const steel = this.material(scene, "toolSteel", new Color3(0.58, 0.60, 0.62), 0.55);
    const steelDark = this.material(scene, "toolSteelDark", new Color3(0.32, 0.34, 0.36), 0.40);
    this.hatchetTool = this.createHatchet(scene, wood, woodDark, steel, steelDark);
    this.pickaxeTool = this.createPickaxe(scene, wood, woodDark, steel, steelDark);
    this.spearTool = this.createSpear(scene, wood, woodDark);
    this.hideHarvestTool();
    this.applyGender("male");
  }

  /** True when a harvest tool or weapon mesh is currently shown in-hand. */
  get isHoldingTool(): boolean {
    return this.activeToolId() !== null;
  }

  setHeight(height: number): void {
    this.root.scaling.setAll(height / this.baseHeight);
  }

  /**
   * Gendered silhouette: proportions, hair, and slight tone shifts.
   * Does not affect combat bounds / stats.
   */
  applyGender(gender: CharacterGender): void {
    this.gender = gender;
    const female = gender === "female";

    // Body proportions
    this.hipsMesh.scaling.set(
      female ? 1.22 : 1,
      female ? 0.95 : 1,
      female ? 1.12 : 1,
    );
    this.waistMesh.scaling.set(female ? 0.88 : 1, 1, female ? 0.92 : 1);
    this.bodyMesh.scaling.set(
      female ? 0.92 : 1.08,
      1,
      female ? 0.78 : 0.8,
    );
    this.jacketFrontMesh.scaling.set(female ? 0.9 : 1, female ? 0.96 : 1, 1);
    this.shoulderL.scaling.set(female ? 0.82 : 1.05, 0.78, 0.95);
    this.shoulderR.scaling.set(female ? 0.82 : 1.05, 0.78, 0.95);
    this.shoulderL.position.x = female ? -0.26 : -0.30;
    this.shoulderR.position.x = female ? 0.26 : 0.30;

    // Head / jaw softer for female
    this.headMesh.scaling.set(female ? 0.88 : 0.9, female ? 1.08 : 1.1, female ? 0.9 : 0.92);
    this.jawMesh.scaling.set(female ? 0.9 : 1.05, female ? 0.45 : 0.55, female ? 0.9 : 0.95);
    this.jawMesh.setEnabled(!female);

    // Hair styles
    this.hairCapMesh.scaling.set(female ? 1.02 : 0.96, female ? 0.72 : 0.62, female ? 1.02 : 0.98);
    this.hairFrontMesh.scaling.set(female ? 1.15 : 1, female ? 1.2 : 1, 1);
    this.hairLongL.setEnabled(female);
    this.hairLongR.setEnabled(female);
    this.hairBun.setEnabled(female);
    if (female) {
      this.hairMat.diffuseColor.set(0.22, 0.12, 0.08);
      this.skinMat.diffuseColor.set(0.78, 0.56, 0.48);
      this.skinShadeMat.diffuseColor.set(0.64, 0.44, 0.36);
    } else {
      this.hairMat.diffuseColor.set(0.14, 0.09, 0.05);
      this.skinMat.diffuseColor.set(0.72, 0.52, 0.40);
      this.skinShadeMat.diffuseColor.set(0.58, 0.40, 0.30);
    }

    // Slight limb width via arm/leg local x scale
    const armW = female ? 0.9 : 1;
    const legW = female ? 0.92 : 1;
    this.leftArm.scaling.set(armW, 1, armW);
    this.rightArm.scaling.set(armW, 1, armW);
    this.leftLeg.scaling.set(legW, 1, legW);
    this.rightLeg.scaling.set(legW, 1, legW);
  }

  get currentGender(): CharacterGender { return this.gender; }

  setHeldWeapon(tool: HeldWeaponVisualId | null): void {
    this.heldWeapon = tool;
    this.syncToolVisibility();
  }

  setUnarmedAttackVisual(active: boolean): void {
    this.suppressHeldForUnarmed = active;
    this.syncToolVisibility();
  }

  showHarvestTool(tool: HarvestTool): void {
    this.harvestOverride = tool;
    this.syncToolVisibility();
  }

  hideHarvestTool(): void {
    this.harvestOverride = null;
    this.syncToolVisibility();
  }

  private activeToolId(): HeldWeaponVisualId | HarvestTool | null {
    return this.harvestOverride ?? (this.suppressHeldForUnarmed ? null : this.heldWeapon);
  }

  private syncToolVisibility(): void {
    const tool = this.activeToolId();
    this.hatchetTool.setEnabled(tool === "hatchet");
    this.pickaxeTool.setEnabled(tool === "pickaxe");
    this.spearTool.setEnabled(tool === "spear");
  }

  /**
   * Tools mount in the palm. Shaft runs along the arm (-Y) so the head hangs
   * downward past the hand (not sideways). Blade edge faces local +Z (forward).
   */
  private createHatchet(
    scene: Scene,
    wood: StandardMaterial,
    woodDark: StandardMaterial,
    steel: StandardMaterial,
    steelDark: StandardMaterial,
  ): TransformNode {
    const root = new TransformNode("HatchetTool", scene);
    root.parent = this.rightHandGrip;
    // Hang blade-down: tool +Y toward shoulder, -Y past the fingers.
    root.rotation.set(0.08, 0.05, -0.18);
    root.position.set(0.03, 0.02, 0.03);

    const handle = MeshBuilder.CreateCylinder("HatchetHandle", { height: 0.52, diameter: 0.046, tessellation: 8 }, scene);
    this.part("HatchetHandle", handle, wood, root, new Vector3(0, -0.08, 0));
    const grip = MeshBuilder.CreateCylinder("HatchetGrip", { height: 0.14, diameter: 0.06, tessellation: 8 }, scene);
    this.part("HatchetGrip", grip, woodDark, root, new Vector3(0, 0.04, 0));
    const butt = MeshBuilder.CreateSphere("HatchetButt", { diameter: 0.05, segments: 6 }, scene);
    this.part("HatchetButt", butt, woodDark, root, new Vector3(0, 0.14, 0));

    const headY = -0.32;
    const headBlock = MeshBuilder.CreateBox("HatchetHeadBlock", { width: 0.09, height: 0.11, depth: 0.10 }, scene);
    this.part("HatchetHeadBlock", headBlock, steelDark, root, new Vector3(0, headY, 0));
    // Blade edge forward (+Z), not sideways.
    const blade = MeshBuilder.CreateBox("HatchetBlade", { width: 0.03, height: 0.16, depth: 0.22 }, scene);
    blade.rotation.x = 0.06;
    this.part("HatchetBlade", blade, steel, root, new Vector3(0, headY, 0.11));
    const poll = MeshBuilder.CreateBox("HatchetPoll", { width: 0.07, height: 0.09, depth: 0.07 }, scene);
    this.part("HatchetPoll", poll, steelDark, root, new Vector3(0, headY, -0.06));
    return root;
  }

  private createPickaxe(
    scene: Scene,
    wood: StandardMaterial,
    woodDark: StandardMaterial,
    steel: StandardMaterial,
    steelDark: StandardMaterial,
  ): TransformNode {
    const root = new TransformNode("PickaxeTool", scene);
    root.parent = this.rightHandGrip;
    root.rotation.set(0.06, 0.04, -0.16);
    root.position.set(0.03, 0.02, 0.03);

    const handle = MeshBuilder.CreateCylinder("PickaxeHandle", { height: 0.68, diameter: 0.044, tessellation: 8 }, scene);
    this.part("PickaxeHandle", handle, wood, root, new Vector3(0, -0.12, 0));
    const grip = MeshBuilder.CreateCylinder("PickaxeGrip", { height: 0.13, diameter: 0.056, tessellation: 8 }, scene);
    this.part("PickaxeGrip", grip, woodDark, root, new Vector3(0, 0.05, 0));
    const butt = MeshBuilder.CreateSphere("PickaxeButt", { diameter: 0.048, segments: 6 }, scene);
    this.part("PickaxeButt", butt, woodDark, root, new Vector3(0, 0.16, 0));

    const headY = -0.42;
    const eye = MeshBuilder.CreateBox("PickaxeEye", { width: 0.09, height: 0.09, depth: 0.09 }, scene);
    this.part("PickaxeEye", eye, steelDark, root, new Vector3(0, headY, 0));
    // Spike points roughly +Z (into the hit); adze opposite -Z.
    const spike = MeshBuilder.CreateCylinder("PickaxeSpike", {
      height: 0.32,
      diameterTop: 0.012,
      diameterBottom: 0.055,
      tessellation: 7,
    }, scene);
    spike.rotation.x = Math.PI / 2;
    this.part("PickaxeSpike", spike, steel, root, new Vector3(0, headY, 0.16));
    const adze = MeshBuilder.CreateBox("PickaxeAdze", { width: 0.08, height: 0.05, depth: 0.20 }, scene);
    this.part("PickaxeAdze", adze, steel, root, new Vector3(0, headY, -0.12));
    return root;
  }

  private createSpear(scene: Scene, wood: StandardMaterial, woodDark: StandardMaterial): TransformNode {
    const tipWood = this.material(scene, "spearTipWood", new Color3(0.55, 0.36, 0.18), 0.08);
    const root = new TransformNode("SpearTool", scene);
    root.parent = this.rightHandGrip;
    // Tip-forward with slight downward bias for overhand thrusts.
    root.rotation.set(Math.PI / 2 + 0.35, 0.04, -0.12);
    root.position.set(0.02, 0.0, 0.02);

    const shaft = MeshBuilder.CreateCylinder("SpearShaft", { height: 1.25, diameter: 0.042, tessellation: 8 }, scene);
    this.part("SpearShaft", shaft, wood, root, new Vector3(0, 0.28, 0));
    const wrap = MeshBuilder.CreateCylinder("SpearWrap", { height: 0.12, diameter: 0.055, tessellation: 8 }, scene);
    this.part("SpearWrap", wrap, woodDark, root, new Vector3(0, 0, 0));
    const tip = MeshBuilder.CreateCylinder("SpearTip", {
      height: 0.26,
      diameterTop: 0.01,
      diameterBottom: 0.055,
      tessellation: 7,
    }, scene);
    this.part("SpearTip", tip, tipWood, root, new Vector3(0, 0.98, 0));
    return root;
  }

  private limb(
    scene: Scene,
    name: string,
    x: number,
    y: number,
    endMaterial: StandardMaterial,
    upperMaterial: StandardMaterial,
    leg: boolean,
  ): TransformNode {
    const pivot = new TransformNode(`${name}Pivot`, scene);
    pivot.parent = this.bodyPivot;
    pivot.position.set(x, y, 0);
    const upperLength = leg ? 0.44 : 0.36;
    const lowerLength = leg ? 0.44 : 0.34;
    const radius = leg ? 0.092 : 0.070;
    const upper = MeshBuilder.CreateCapsule(`${name}Upper`, { height: upperLength, radius, tessellation: 9 }, scene);
    this.part(`${name}Upper`, upper, upperMaterial, pivot, new Vector3(0, -upperLength / 2, 0));
    const lower = MeshBuilder.CreateCapsule(`${name}Lower`, { height: lowerLength, radius: radius * 0.88, tessellation: 9 }, scene);
    this.part(
      `${name}Lower`,
      lower,
      endMaterial,
      pivot,
      new Vector3(0, -upperLength - lowerLength / 2 + 0.03, leg ? 0.012 : 0.01),
    );
    if (leg) {
      const foot = MeshBuilder.CreateBox(`${name}Foot`, { width: 0.17, height: 0.11, depth: 0.30 }, scene);
      this.part(`${name}Foot`, foot, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength + 0.05, 0.10));
      const sole = MeshBuilder.CreateBox(`${name}Sole`, { width: 0.18, height: 0.04, depth: 0.32 }, scene);
      this.part(`${name}Sole`, sole, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength + 0.01, 0.10));
    } else {
      const hand = MeshBuilder.CreateSphere(`${name}Hand`, { diameter: 0.14, segments: 8 }, scene);
      hand.scaling.set(0.95, 1.05, 1.15);
      this.part(`${name}Hand`, hand, endMaterial, pivot, new Vector3(0, -upperLength - lowerLength + 0.04, 0.02));
    }
    return pivot;
  }

  private part(name: string, mesh: Mesh, material: StandardMaterial, parent: TransformNode, position: Vector3): void {
    mesh.name = name;
    mesh.material = material;
    mesh.parent = parent;
    mesh.position.copyFrom(position);
    mesh.receiveShadows = true;
    this.meshes.push(mesh);
  }

  private material(scene: Scene, name: string, color: Color3, specular = 0.05): StandardMaterial {
    const material = new StandardMaterial(name, scene);
    material.diffuseColor = color;
    material.specularColor.set(specular, specular, specular);
    material.specularPower = specular > 0.2 ? 48 : 24;
    return material;
  }
}
