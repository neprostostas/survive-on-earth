import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Scene } from "@babylonjs/core/scene";
import type { RoamingZombie } from "./RoamingZombie";
import { ROAMING_ZOMBIE_PROFILE } from "./enemyConfig";

interface EnemyVisual {
  readonly root: TransformNode;
  readonly body: TransformNode;
  readonly head: TransformNode;
  readonly leftArm: TransformNode;
  readonly rightArm: TransformNode;
  readonly leftLeg: TransformNode;
  readonly rightLeg: TransformNode;
  readonly meshes: readonly Mesh[];
  time: number;
  recoil: number;
  dying: boolean;
  deathElapsed: number;
}

export class EnemyPresentation {
  private readonly visuals = new Map<string, EnemyVisual>();
  private readonly skin: StandardMaterial;
  private readonly shirt: StandardMaterial;
  private readonly trousers: StandardMaterial;
  private readonly wounds: StandardMaterial;

  constructor(private readonly scene: Scene) {
    this.skin = this.material("ZombieSkin", new Color3(0.37, 0.42, 0.28));
    this.shirt = this.material("ZombieTornShirt", new Color3(0.22, 0.27, 0.20));
    this.trousers = this.material("ZombieTrousers", new Color3(0.18, 0.18, 0.15));
    this.wounds = this.material("ZombieMarks", new Color3(0.31, 0.14, 0.11));
  }

  spawn(enemy: RoamingZombie): readonly Mesh[] {
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
    const torso = part(MeshBuilder.CreateCapsule(`ZombieTorso:${enemy.combatId}`, { height: 0.72, radius: 0.22, tessellation: 9 }, this.scene), this.shirt, body, new Vector3(0, 1.18, 0));
    torso.scaling.set(1.02, 1, 0.76);
    const chestMark = part(MeshBuilder.CreateBox(`ZombieChestMark:${enemy.combatId}`, { width: 0.22, height: 0.1, depth: 0.035 }, this.scene), this.wounds, body, new Vector3(-0.08, 1.3, 0.18));
    chestMark.rotation.z = -0.25;
    const skull = part(MeshBuilder.CreateSphere(`ZombieHead:${enemy.combatId}`, { diameter: 0.34, segments: 9 }, this.scene), this.skin, head, Vector3.Zero());
    skull.scaling.set(0.92, 1.06, 0.94);
    const leftArm = this.limb(enemy, "LeftArm", body, -0.28, 1.4, false, meshes);
    const rightArm = this.limb(enemy, "RightArm", body, 0.28, 1.38, false, meshes);
    const leftLeg = this.limb(enemy, "LeftLeg", body, -0.12, 0.88, true, meshes);
    const rightLeg = this.limb(enemy, "RightLeg", body, 0.12, 0.88, true, meshes);
    rightArm.rotation.z = -0.08;
    leftArm.rotation.z = 0.16;
    root.scaling.setAll(0.98);
    this.visuals.set(enemy.combatId, { root, body, head, leftArm, rightArm, leftLeg, rightLeg, meshes: Object.freeze(meshes), time: 0, recoil: 0, dying: false, deathElapsed: 0 });
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
    }
  }

  private pose(visual: EnemyVisual, enemy: RoamingZombie): void {
    const state = enemy.state;
    const idle = Math.sin(visual.time * 2.1);
    const walking = state === "chase";
    const stride = walking ? Math.sin(visual.time * 6.2) * 0.43 : 0;
    visual.leftLeg.rotation.set(stride, 0, 0.02);
    visual.rightLeg.rotation.set(-stride, 0, -0.02);
    visual.leftArm.rotation.set(-0.34 - stride * 0.22, 0, 0.16);
    visual.rightArm.rotation.set(-0.47 + stride * 0.22, 0, -0.08);
    visual.body.rotation.set(0.13 + idle * 0.012, idle * 0.014, visual.recoil > 0 ? -Math.sin(visual.recoil / 0.13 * Math.PI) * 0.1 : idle * 0.01);
    visual.body.position.y = Math.abs(stride) * 0.018 + idle * 0.006;
    visual.body.position.z = 0;
    visual.head.rotation.set(idle * 0.025, -idle * 0.04, 0.08 + idle * 0.025);
    if (state !== "attack" && state !== "recovery") return;
    const progress = enemy.attackProgress;
    const impact = ROAMING_ZOMBIE_PROFILE.impactNormalizedTime;
    const windup = Math.min(1, progress / impact);
    const recover = Math.max(0, (progress - impact) / (1 - impact));
    const strike = progress <= impact ? this.smooth(windup) : 1 - this.smooth(recover);
    visual.leftArm.rotation.x = -0.8 + strike * 1.55;
    visual.rightArm.rotation.x = -1.02 + strike * 1.72;
    visual.body.rotation.x = 0.05 + strike * 0.28;
    visual.body.position.z = strike * 0.08;
  }

  private updateDeath(id: string, visual: EnemyVisual, delta: number): void {
    if (delta <= 0) return;
    visual.deathElapsed += delta;
    const progress = Math.min(1, visual.deathElapsed / ROAMING_ZOMBIE_PROFILE.deathDuration);
    visual.root.rotation.z = progress * 1.36;
    visual.root.scaling.setAll(0.98 - progress * 0.23);
    if (progress < 1) return;
    visual.root.dispose(false, false);
    this.visuals.delete(id);
  }

  private limb(enemy: RoamingZombie, name: string, parent: TransformNode, x: number, y: number, leg: boolean, meshes: Mesh[]): TransformNode {
    const pivot = new TransformNode(`Zombie${name}:${enemy.combatId}`, this.scene);
    pivot.parent = parent;
    pivot.position.set(x, y, 0);
    const upperLength = leg ? 0.43 : 0.39;
    const lowerLength = leg ? 0.41 : 0.36;
    const radius = leg ? 0.09 : 0.072;
    const upper = MeshBuilder.CreateCapsule(`Zombie${name}Upper:${enemy.combatId}`, { height: upperLength, radius, tessellation: 7 }, this.scene);
    upper.parent = pivot;
    upper.position.set(0, -upperLength / 2, 0);
    upper.material = leg ? this.trousers : this.shirt;
    upper.receiveShadows = true;
    meshes.push(upper);
    const lower = MeshBuilder.CreateCapsule(`Zombie${name}Lower:${enemy.combatId}`, { height: lowerLength, radius: radius * 0.84, tessellation: 7 }, this.scene);
    lower.parent = pivot;
    lower.position.set(0, -upperLength - lowerLength / 2 + 0.04, leg ? 0.035 : 0.02);
    lower.material = this.skin;
    lower.receiveShadows = true;
    meshes.push(lower);
    return pivot;
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor.set(0.035, 0.035, 0.035);
    material.specularPower = 18;
    return material;
  }

  private smooth(value: number): number { return value * value * (3 - 2 * value); }
}
