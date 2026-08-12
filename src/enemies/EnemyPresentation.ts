import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { RoamingZombie } from "./RoamingZombie";

interface EnemyVisual {
  readonly root: TransformNode;
  readonly body: TransformNode;
  readonly head: TransformNode;
  readonly leftArm: TransformNode;
  readonly rightArm: TransformNode;
  readonly leftLeg: TransformNode;
  readonly rightLeg: TransformNode;
  readonly alertRoot: TransformNode;
  readonly alertBars: readonly Mesh[];
  readonly meshes: readonly Mesh[];
  readonly scale: number;
  time: number;
  recoil: number;
  dying: boolean;
  deathElapsed: number;
  deathDuration: number;
  impactNormalizedTime: number;
}

interface StyleColors {
  skin: Color3;
  shirt: Color3;
  trousers: Color3;
  wounds: Color3;
  emissive?: Color3;
  scale: number;
  belly: number;
}

function styleFor(enemy: RoamingZombie): StyleColors {
  const id = enemy.archetypeId;
  const sil = enemy.archetype.silhouette;
  let scale = sil === 2 ? 1.22 : sil === 1 ? 0.92 : sil === 3 ? 1.12 : 0.98;
  let belly = sil === 2 ? 1.55 : 1.02;
  if (enemy.role === "boss") {
    scale = 1.55;
    belly = 1.35;
  }

  // Role / biome color language
  if (id.includes("toxic") || id.includes("spore") || id.includes("gas") || id.includes("mire") || id.includes("screecher")) {
    return {
      skin: new Color3(0.32, 0.55, 0.28),
      shirt: new Color3(0.18, 0.28, 0.16),
      trousers: new Color3(0.14, 0.18, 0.12),
      wounds: new Color3(0.45, 0.85, 0.25),
      emissive: new Color3(0.08, 0.22, 0.04),
      scale,
      belly: Math.max(belly, 1.15),
    };
  }
  if (id.includes("frozen") || id.includes("snow")) {
    return {
      skin: new Color3(0.55, 0.62, 0.72),
      shirt: new Color3(0.28, 0.32, 0.42),
      trousers: new Color3(0.2, 0.22, 0.3),
      wounds: new Color3(0.35, 0.45, 0.65),
      scale,
      belly,
    };
  }
  if (id.includes("desert") || id.includes("ash") || id.includes("waste")) {
    return {
      skin: new Color3(0.55, 0.42, 0.28),
      shirt: new Color3(0.35, 0.28, 0.18),
      trousers: new Color3(0.28, 0.22, 0.14),
      wounds: new Color3(0.5, 0.22, 0.12),
      scale,
      belly,
    };
  }
  if (id.includes("swamp")) {
    return {
      skin: new Color3(0.28, 0.38, 0.26),
      shirt: new Color3(0.16, 0.22, 0.14),
      trousers: new Color3(0.12, 0.16, 0.11),
      wounds: new Color3(0.4, 0.5, 0.2),
      scale,
      belly: Math.max(belly, 1.2),
    };
  }
  if (id.includes("industrial") || id.includes("armored") || id.includes("plate") || id.includes("slag") || id.includes("sentinel")) {
    return {
      skin: new Color3(0.4, 0.42, 0.4),
      shirt: new Color3(0.22, 0.24, 0.28),
      trousers: new Color3(0.16, 0.16, 0.18),
      wounds: new Color3(0.55, 0.35, 0.15),
      scale: Math.max(scale, 1.1),
      belly: Math.max(belly, 1.1),
    };
  }
  if (id.includes("marauder") || id.includes("bandit") || id.includes("raider") || id.includes("guard") || id.includes("shotgun") || id.includes("sniper") || id.includes("jackal")) {
    return {
      skin: new Color3(0.42, 0.34, 0.28),
      shirt: new Color3(0.22, 0.24, 0.18),
      trousers: new Color3(0.14, 0.15, 0.12),
      wounds: new Color3(0.45, 0.2, 0.12),
      scale: id.includes("heavy") ? 1.15 : scale,
      belly: id.includes("heavy") ? 1.25 : belly,
    };
  }
  if (enemy.role === "boss") {
    return {
      skin: new Color3(0.28, 0.22, 0.32),
      shirt: new Color3(0.12, 0.1, 0.16),
      trousers: new Color3(0.1, 0.08, 0.12),
      wounds: new Color3(0.7, 0.2, 0.35),
      emissive: new Color3(0.15, 0.02, 0.06),
      scale,
      belly,
    };
  }
  if (id.includes("runner") || id.includes("feral") || id.includes("stalker")) {
    return {
      skin: new Color3(0.4, 0.38, 0.3),
      shirt: new Color3(0.2, 0.18, 0.14),
      trousers: new Color3(0.15, 0.14, 0.12),
      wounds: new Color3(0.4, 0.15, 0.1),
      scale: 0.9,
      belly: 0.9,
    };
  }
  if (id.includes("bloated") || id.includes("bloater") || id.includes("brute")) {
    return {
      skin: new Color3(0.42, 0.4, 0.28),
      shirt: new Color3(0.2, 0.22, 0.16),
      trousers: new Color3(0.15, 0.15, 0.12),
      wounds: new Color3(0.45, 0.2, 0.12),
      scale: Math.max(scale, 1.18),
      belly: Math.max(belly, 1.5),
    };
  }
  // classic shambler / urban infected
  return {
    skin: new Color3(0.37, 0.42, 0.28),
    shirt: new Color3(0.22, 0.27, 0.2),
    trousers: new Color3(0.18, 0.18, 0.15),
    wounds: new Color3(0.31, 0.14, 0.11),
    scale,
    belly,
  };
}

export class EnemyPresentation {
  private readonly visuals = new Map<string, EnemyVisual>();
  private matSeq = 0;

  constructor(private readonly scene: Scene) {}

  disposeAll(): void {
    for (const visual of this.visuals.values()) {
      visual.root.dispose(false, false);
    }
    this.visuals.clear();
  }

  remove(combatId: string): void {
    const visual = this.visuals.get(combatId);
    if (!visual) return;
    visual.root.dispose(false, false);
    this.visuals.delete(combatId);
  }

  spawn(enemy: RoamingZombie): readonly Mesh[] {
    this.remove(enemy.combatId);
    const style = styleFor(enemy);
    const styleMats = {
      skin: this.material(`Skin:${enemy.combatId}:${this.matSeq}`, style.skin, style.emissive),
      shirt: this.material(`Shirt:${enemy.combatId}:${this.matSeq}`, style.shirt),
      trousers: this.material(`Trousers:${enemy.combatId}:${this.matSeq}`, style.trousers),
      wounds: this.material(`Wounds:${enemy.combatId}:${this.matSeq}`, style.wounds, style.emissive),
    };
    this.matSeq += 1;

    const root = new TransformNode(`EnemyVisual:${enemy.combatId}`, this.scene);
    const position = enemy.getCombatPosition();
    root.position.set(position.x, position.y, position.z);
    const body = new TransformNode(`EnemyBody:${enemy.combatId}`, this.scene);
    body.parent = root;
    body.rotation.x = 0.13;
    const head = new TransformNode(`EnemyHeadPivot:${enemy.combatId}`, this.scene);
    head.parent = body;
    head.position.set(0.04, 1.55, 0.03);
    const meshes: Mesh[] = [];
    const part = (mesh: Mesh, material: StandardMaterial, parent: TransformNode, local: Vector3): Mesh => {
      mesh.parent = parent;
      mesh.position.copyFrom(local);
      mesh.material = material;
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      meshes.push(mesh);
      return mesh;
    };
    const torso = part(
      MeshBuilder.CreateCapsule(`ZombieTorso:${enemy.combatId}`, { height: 0.72, radius: 0.22, tessellation: 9 }, this.scene),
      styleMats.shirt,
      body,
      new Vector3(0, 1.18, 0),
    );
    torso.scaling.set(style.belly, 1, 0.76 * Math.min(style.belly, 1.3));
    const chestMark = part(
      MeshBuilder.CreateBox(`ZombieChestMark:${enemy.combatId}`, { width: 0.22, height: 0.1, depth: 0.035 }, this.scene),
      styleMats.wounds,
      body,
      new Vector3(-0.08, 1.3, 0.18),
    );
    chestMark.rotation.z = -0.25;
    const skull = part(
      MeshBuilder.CreateSphere(`ZombieHead:${enemy.combatId}`, { diameter: enemy.role === "boss" ? 0.42 : 0.34, segments: 9 }, this.scene),
      styleMats.skin,
      head,
      Vector3.Zero(),
    );
    skull.scaling.set(0.92, 1.06, 0.94);
    // Spitters get a glowy "sack" on the back
    if (enemy.role === "spit") {
      const sack = part(
        MeshBuilder.CreateSphere(`ZombieSpitSack:${enemy.combatId}`, { diameter: 0.28, segments: 8 }, this.scene),
        styleMats.wounds,
        body,
        new Vector3(0, 1.25, -0.22),
      );
      sack.scaling.set(1.2, 0.9, 1.1);
    }
    // Brutes get shoulder pads
    if (enemy.role === "brute" || enemy.archetype.silhouette === 3) {
      part(
        MeshBuilder.CreateBox(`ZombieShoulderL:${enemy.combatId}`, { width: 0.2, height: 0.12, depth: 0.18 }, this.scene),
        styleMats.shirt,
        body,
        new Vector3(-0.32, 1.42, 0),
      );
      part(
        MeshBuilder.CreateBox(`ZombieShoulderR:${enemy.combatId}`, { width: 0.2, height: 0.12, depth: 0.18 }, this.scene),
        styleMats.shirt,
        body,
        new Vector3(0.32, 1.42, 0),
      );
    }
    const leftArm = this.limb(enemy, "LeftArm", body, -0.28, 1.4, false, meshes, styleMats);
    const rightArm = this.limb(enemy, "RightArm", body, 0.28, 1.38, false, meshes, styleMats);
    const leftLeg = this.limb(enemy, "LeftLeg", body, -0.12, 0.88, true, meshes, styleMats);
    const rightLeg = this.limb(enemy, "RightLeg", body, 0.12, 0.88, true, meshes, styleMats);
    rightArm.rotation.z = -0.08;
    leftArm.rotation.z = 0.16;
    root.scaling.setAll(style.scale);

    // LDOE-style awareness pips above the head (hidden at zero).
    const alertRoot = new TransformNode(`EnemyAlert:${enemy.combatId}`, this.scene);
    alertRoot.parent = root;
    alertRoot.position.set(0, 2.05, 0);
    const alertMatYellow = this.material(`AlertY:${enemy.combatId}:${this.matSeq}`, new Color3(0.95, 0.78, 0.18));
    const alertMatRed = this.material(`AlertR:${enemy.combatId}:${this.matSeq}`, new Color3(0.9, 0.22, 0.16));
    const alertBars: Mesh[] = [];
    for (let i = 0; i < 3; i += 1) {
      const bar = MeshBuilder.CreateBox(
        `EnemyAlertBar${i}:${enemy.combatId}`,
        { width: 0.08, height: 0.16 + i * 0.06, depth: 0.04 },
        this.scene,
      );
      bar.parent = alertRoot;
      bar.position.set((i - 1) * 0.12, (0.08 + i * 0.03), 0);
      bar.material = i < 2 ? alertMatYellow : alertMatRed;
      bar.isPickable = false;
      bar.isVisible = false;
      alertBars.push(bar);
    }

    this.visuals.set(enemy.combatId, {
      root,
      body,
      head,
      leftArm,
      rightArm,
      leftLeg,
      rightLeg,
      alertRoot,
      alertBars: Object.freeze(alertBars),
      meshes: Object.freeze(meshes),
      scale: style.scale,
      time: 0,
      recoil: 0,
      dying: false,
      deathElapsed: 0,
      deathDuration: enemy.archetype.deathDuration,
      impactNormalizedTime: enemy.archetype.impactNormalizedTime,
    });
    return Object.freeze(meshes);
  }

  showHit(enemy: RoamingZombie): void {
    const visual = this.visuals.get(enemy.combatId);
    if (visual) visual.recoil = 0.13;
  }

  beginDeath(enemy: RoamingZombie): void {
    const visual = this.visuals.get(enemy.combatId);
    if (!visual || visual.dying) return;
    visual.dying = true;
    visual.deathElapsed = 0;
  }

  update(delta: number, enemies: readonly RoamingZombie[]): void {
    const active = new Map(enemies.map((enemy) => [enemy.combatId, enemy]));
    for (const [id, visual] of this.visuals) {
      if (visual.dying) { this.updateDeath(id, visual, delta); continue; }
      const enemy = active.get(id);
      if (!enemy) continue;
      const position = enemy.getCombatPosition();
      visual.root.position.set(position.x, position.y, position.z);
      visual.root.rotation.y = enemy.facingYaw;
      if (delta > 0) {
        visual.time += delta;
        visual.recoil = Math.max(0, visual.recoil - delta);
      }
      this.pose(visual, enemy);
      this.syncAlertBars(visual, enemy.alertLevel);
    }
  }

  private syncAlertBars(visual: EnemyVisual, level: number): void {
    const lit = level <= 0.05 ? 0 : level < 0.45 ? 1 : level < 0.85 ? 2 : 3;
    visual.alertRoot.setEnabled(lit > 0);
    for (let i = 0; i < visual.alertBars.length; i += 1) {
      visual.alertBars[i]!.isVisible = i < lit;
    }
    if (lit > 0) {
      const pulse = 1 + Math.sin(visual.time * 8) * 0.04;
      visual.alertRoot.scaling.setAll(pulse);
    }
  }

  private pose(visual: EnemyVisual, enemy: RoamingZombie): void {
    const state = enemy.state;
    const idle = Math.sin(visual.time * 2.1);
    const walking = state === "chase" || state === "investigate" || state === "alert";
    const stride = walking
      ? Math.sin(visual.time * (state === "investigate" ? 4.2 : 5.5 + enemy.archetype.moveSpeed))
        * (state === "investigate" ? 0.32 : 0.43)
      : 0;
    visual.leftLeg.rotation.set(stride, 0, 0.02);
    visual.rightLeg.rotation.set(-stride, 0, -0.02);
    visual.leftArm.rotation.set(-0.34 - stride * 0.22, 0, 0.16);
    visual.rightArm.rotation.set(-0.47 + stride * 0.22, 0, -0.08);
    visual.body.rotation.set(
      0.13 + idle * 0.012,
      idle * 0.014,
      visual.recoil > 0 ? -Math.sin((visual.recoil / 0.13) * Math.PI) * 0.1 : idle * 0.01,
    );
    visual.body.position.y = Math.abs(stride) * 0.018 + idle * 0.006;
    visual.body.position.z = 0;
    visual.head.rotation.set(idle * 0.025, -idle * 0.04, 0.08 + idle * 0.025);
    if (state !== "attack" && state !== "recovery") return;
    const progress = enemy.attackProgress;
    const impact = visual.impactNormalizedTime;
    const windup = Math.min(1, progress / Math.max(0.01, impact));
    const recover = Math.max(0, (progress - impact) / Math.max(0.01, 1 - impact));
    const strike = progress <= impact ? this.smooth(windup) : 1 - this.smooth(recover);
    if (enemy.role === "spit" || enemy.role === "ranged") {
      visual.leftArm.rotation.x = -0.5 - strike * 0.4;
      visual.rightArm.rotation.x = -1.4 - strike * 0.35;
      visual.body.rotation.x = 0.05 + strike * 0.12;
      visual.body.position.z = strike * 0.04;
    } else {
      visual.leftArm.rotation.x = -0.8 + strike * 1.55;
      visual.rightArm.rotation.x = -1.02 + strike * 1.72;
      visual.body.rotation.x = 0.05 + strike * 0.28;
      visual.body.position.z = strike * 0.08;
    }
  }

  private updateDeath(id: string, visual: EnemyVisual, delta: number): void {
    if (delta <= 0) return;
    visual.deathElapsed += delta;
    const progress = Math.min(1, visual.deathElapsed / Math.max(0.1, visual.deathDuration));
    visual.root.rotation.z = progress * 1.36;
    visual.root.scaling.setAll(visual.scale * (1 - progress * 0.23));
    if (progress < 1) return;
    visual.root.dispose(false, false);
    this.visuals.delete(id);
  }

  private limb(
    enemy: RoamingZombie,
    name: string,
    parent: TransformNode,
    x: number,
    y: number,
    leg: boolean,
    meshes: Mesh[],
    mats: { skin: StandardMaterial; shirt: StandardMaterial; trousers: StandardMaterial },
  ): TransformNode {
    const pivot = new TransformNode(`Zombie${name}:${enemy.combatId}`, this.scene);
    pivot.parent = parent;
    pivot.position.set(x, y, 0);
    const bulk = enemy.archetype.silhouette === 2 || enemy.role === "brute" ? 1.25 : 1;
    const upperLength = (leg ? 0.43 : 0.39) * (enemy.role === "boss" ? 1.15 : 1);
    const lowerLength = (leg ? 0.41 : 0.36) * (enemy.role === "boss" ? 1.1 : 1);
    const radius = (leg ? 0.09 : 0.072) * bulk;
    const upper = MeshBuilder.CreateCapsule(`Zombie${name}Upper:${enemy.combatId}`, { height: upperLength, radius, tessellation: 7 }, this.scene);
    upper.parent = pivot;
    upper.position.set(0, -upperLength / 2, 0);
    upper.material = leg ? mats.trousers : mats.shirt;
    upper.receiveShadows = true;
    meshes.push(upper);
    const lower = MeshBuilder.CreateCapsule(`Zombie${name}Lower:${enemy.combatId}`, { height: lowerLength, radius: radius * 0.84, tessellation: 7 }, this.scene);
    lower.parent = pivot;
    lower.position.set(0, -upperLength - lowerLength / 2 + 0.04, leg ? 0.035 : 0.02);
    lower.material = mats.skin;
    lower.receiveShadows = true;
    meshes.push(lower);
    return pivot;
  }

  private material(name: string, color: Color3, emissive?: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor.set(0.035, 0.035, 0.035);
    material.specularPower = 18;
    if (emissive) material.emissiveColor = emissive;
    return material;
  }

  private smooth(value: number): number { return value * value * (3 - 2 * value); }
}
