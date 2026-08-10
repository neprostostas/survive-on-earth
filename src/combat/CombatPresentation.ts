import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { TransformNode } from "@babylonjs/core/Meshes/transformNode";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { Scene } from "@babylonjs/core/scene";
import type { CombatDummy } from "./CombatDummy";
import type { CombatPoint, CombatTarget } from "./CombatTarget";
import { I18N } from "../i18n/I18n";
import { COMBAT_CONFIG } from "./combatConfig";

interface DummyVisual {
  readonly root: TransformNode;
  readonly meshes: readonly Mesh[];
  recoil: number;
  dying: boolean;
  deathElapsed: number;
}

interface DamageEntry {
  readonly element: HTMLElement;
  readonly position: Vector3;
  active: boolean;
  elapsed: number;
}

export class CombatPresentation {
  private readonly visuals = new Map<string, DummyVisual>();
  private readonly indicator: Mesh;
  private readonly status: HTMLElement;
  private readonly statusName: HTMLElement;
  private readonly statusValue: HTMLElement;
  private readonly statusFill: HTMLElement;
  private readonly damageEntries: readonly DamageEntry[];
  private readonly wood: StandardMaterial;
  private readonly darkWood: StandardMaterial;
  private readonly pad: StandardMaterial;
  private readonly identity = Matrix.Identity();

  constructor(
    private readonly scene: Scene,
    private readonly engine: Engine,
    private readonly uiRoot: HTMLElement,
  ) {
    this.wood = this.material("CombatDummyWood", new Color3(0.48, 0.32, 0.17));
    this.darkWood = this.material("CombatDummyDarkWood", new Color3(0.27, 0.17, 0.09));
    this.pad = this.material("CombatDummyTargetPad", new Color3(0.49, 0.18, 0.13));
    const indicatorMaterial = new StandardMaterial("CombatTargetIndicatorMaterial", scene);
    indicatorMaterial.diffuseColor = new Color3(0.55, 0.08, 0.055);
    indicatorMaterial.emissiveColor = new Color3(0.38, 0.035, 0.025);
    indicatorMaterial.specularColor.set(0, 0, 0);
    this.indicator = MeshBuilder.CreateTorus("CombatTargetIndicator", { diameter: 0.9, thickness: 0.035, tessellation: 48 }, scene);
    this.indicator.material = indicatorMaterial;
    this.indicator.isPickable = false;
    this.indicator.setEnabled(false);

    this.status = document.createElement("section");
    this.status.className = "combat-target-status";
    this.status.setAttribute("aria-live", "polite");
    this.status.innerHTML = `<div class="combat-target-row"><b class="combat-target-name"></b><span class="combat-target-value"></span></div><div class="combat-health-track"><i></i></div>`;
    uiRoot.append(this.status);
    const statusName = this.status.querySelector<HTMLElement>(".combat-target-name");
    const statusValue = this.status.querySelector<HTMLElement>(".combat-target-value");
    const statusFill = this.status.querySelector<HTMLElement>(".combat-health-track i");
    if (!statusName || !statusValue || !statusFill) throw new Error("Combat target HUD failed to mount");
    this.statusName = statusName;
    this.statusValue = statusValue;
    this.statusFill = statusFill;

    this.damageEntries = Object.freeze(Array.from({ length: 4 }, () => {
      const element = document.createElement("div");
      element.className = "combat-damage-feedback";
      element.setAttribute("aria-hidden", "true");
      uiRoot.append(element);
      return { element, position: Vector3.Zero(), active: false, elapsed: 0 };
    }));
  }

  spawnDummy(dummy: CombatDummy): readonly Mesh[] {
    const position = dummy.getCombatPosition();
    const root = new TransformNode(`CombatDummyVisual:${dummy.combatId}`, this.scene);
    root.position.set(position.x, position.y, position.z);
    const meshes: Mesh[] = [];
    const add = (mesh: Mesh, material: StandardMaterial, localPosition: Vector3): Mesh => {
      mesh.parent = root;
      mesh.position.copyFrom(localPosition);
      mesh.material = material;
      mesh.isPickable = false;
      mesh.receiveShadows = true;
      meshes.push(mesh);
      return mesh;
    };
    add(MeshBuilder.CreateCylinder(`DummyPost:${dummy.combatId}`, { height: 1.25, diameter: 0.16, tessellation: 10 }, this.scene), this.darkWood, new Vector3(0, 0.64, 0));
    add(MeshBuilder.CreateBox(`DummyBody:${dummy.combatId}`, { width: 0.48, height: 0.58, depth: 0.22 }, this.scene), this.wood, new Vector3(0, 1.03, 0));
    add(MeshBuilder.CreateSphere(`DummyHead:${dummy.combatId}`, { diameter: 0.36, segments: 10 }, this.scene), this.wood, new Vector3(0, 1.52, 0));
    const arms = add(MeshBuilder.CreateCylinder(`DummyArms:${dummy.combatId}`, { height: 1.02, diameter: 0.11, tessellation: 9 }, this.scene), this.darkWood, new Vector3(0, 1.2, 0));
    arms.rotation.z = Math.PI / 2;
    for (const x of [-0.48, 0.48]) {
      const targetPad = add(MeshBuilder.CreateCylinder(`DummyPad:${dummy.combatId}`, { height: 0.08, diameter: 0.25, tessellation: 16 }, this.scene), this.pad, new Vector3(x, 1.2, 0.05));
      targetPad.rotation.x = Math.PI / 2;
    }
    const chestTarget = add(MeshBuilder.CreateCylinder(`DummyChestTarget:${dummy.combatId}`, { height: 0.045, diameter: 0.25, tessellation: 18 }, this.scene), this.pad, new Vector3(0, 1.05, 0.135));
    chestTarget.rotation.x = Math.PI / 2;
    this.visuals.set(dummy.combatId, { root, meshes: Object.freeze(meshes), recoil: 0, dying: false, deathElapsed: 0 });
    return Object.freeze(meshes);
  }

  /** Hide training dummies entirely outside Home. */
  setDummiesVisible(visible: boolean): void {
    for (const visual of this.visuals.values()) {
      visual.root.setEnabled(visible);
    }
  }

  showImpact(target: CombatTarget, appliedDamage: number): void {
    const visual = this.visuals.get(target.combatId);
    if (visual) visual.recoil = 0.12;
    this.showDamage(target.getCombatPosition(), appliedDamage, 1.75);
  }

  showDamage(position: CombatPoint, appliedDamage: number, height = 1.75): void {
    if (!I18N.gameSettings.damageNumbers) return;
    const entry = this.damageEntries.find((candidate) => !candidate.active) ?? this.damageEntries.reduce((oldest, candidate) => candidate.elapsed > oldest.elapsed ? candidate : oldest);
    entry.active = true;
    entry.elapsed = 0;
    entry.position.set(position.x, position.y + height, position.z);
    entry.element.textContent = `-${appliedDamage}`;
    entry.element.style.display = "block";
    entry.element.style.opacity = "0";
  }

  beginDeath(target: CombatTarget): void {
    const visual = this.visuals.get(target.combatId);
    if (!visual || visual.dying) return;
    visual.dying = true;
    visual.deathElapsed = 0;
  }

  update(delta: number, target: CombatTarget | null): void {
    this.updateTarget(target);
    for (const [id, visual] of this.visuals) {
      if (visual.recoil > 0 && delta > 0) visual.recoil = Math.max(0, visual.recoil - delta);
      visual.root.scaling.z = 1 - Math.sin((visual.recoil / 0.12) * Math.PI) * 0.05;
      if (!visual.dying || delta <= 0) continue;
      visual.deathElapsed += delta;
      const progress = Math.min(1, visual.deathElapsed / COMBAT_CONFIG.dummyDeathDuration);
      visual.root.rotation.z = progress * 1.25;
      visual.root.scaling.setAll(1 - progress * 0.35);
      if (progress >= 1) {
        visual.root.dispose(false, false);
        this.visuals.delete(id);
      }
    }
    this.updateDamageEntries(delta);
  }

  private updateTarget(target: CombatTarget | null): void {
    const active = target !== null && target.isCombatAlive();
    this.indicator.setEnabled(active);
    this.status.classList.toggle("visible", active);
    if (!active || !target) return;
    const position = target.getCombatPosition();
    this.indicator.position.set(position.x, position.y + 0.055, position.z);
    const health = target.health.getSnapshot();
    this.statusName.textContent = target.displayName.toUpperCase();
    this.statusValue.textContent = String(health.currentHealth);
    this.statusFill.style.width = `${health.currentHealth / health.maxHealth * 100}%`;
  }

  private updateDamageEntries(delta: number): void {
    const camera = this.scene.activeCamera;
    if (!camera) return;
    const renderWidth = Math.max(1, this.engine.getRenderWidth());
    const renderHeight = Math.max(1, this.engine.getRenderHeight());
    const viewport = camera.viewport.toGlobal(renderWidth, renderHeight);
    const scaleX = this.uiRoot.clientWidth / renderWidth;
    const scaleY = this.uiRoot.clientHeight / renderHeight;
    for (const entry of this.damageEntries) {
      if (!entry.active) continue;
      if (delta > 0) entry.elapsed += delta;
      if (entry.elapsed >= 0.72) {
        entry.active = false;
        entry.element.style.display = "none";
        continue;
      }
      const projected = Vector3.Project(entry.position, this.identity, this.scene.getTransformMatrix(), viewport);
      const progress = entry.elapsed / 0.72;
      const opacity = Math.min(1, progress / 0.1) * Math.min(1, (1 - progress) / 0.35);
      entry.element.style.left = `${projected.x * scaleX}px`;
      entry.element.style.top = `${projected.y * scaleY}px`;
      entry.element.style.opacity = String(opacity);
      entry.element.style.transform = `translate(-50%, -100%) translateY(${-progress * 22}px)`;
    }
  }

  private material(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.diffuseColor = color;
    material.specularColor.set(0.04, 0.04, 0.04);
    material.specularPower = 20;
    return material;
  }
}
