import type { CalibrationConfig } from "../config/calibrationConfig";
import { cloneCalibration, DEFAULT_CALIBRATION } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import type { VisualQualityPreset } from "../config/visualQualityConfig";
import type { HarvestTool } from "../harvesting/HarvestingTypes";
import type { PrototypeToolLoadout } from "../harvesting/PrototypeToolLoadout";

interface ControlDefinition {
  group: string;
  label: string;
  min: number;
  max: number;
  step: number;
  get: () => number;
  set: (value: number) => void;
}

export class CalibrationPanel {
  private readonly element: HTMLElement;
  private readonly controls: ControlDefinition[];
  private visible = false;

  constructor(root: HTMLElement, private readonly config: CalibrationConfig, private readonly tools: PrototypeToolLoadout, private readonly onChange: () => void) {
    this.element = document.createElement("aside");
    this.element.className = "calibration-panel";
    root.append(this.element);
    this.controls = this.createDefinitions();
    this.render();
  }

  toggle(): void {
    this.visible = !this.visible;
    this.element.classList.toggle("visible", this.visible);
  }

  private createDefinitions(): ControlDefinition[] {
    const c = this.config;
    return [
      this.def("Camera", "Yaw", -180, 180, 1, () => c.camera.yawDeg, v => { c.camera.yawDeg = v; }),
      this.def("Camera", "Pitch", 35, 80, 1, () => c.camera.pitchDeg, v => { c.camera.pitchDeg = v; }),
      this.def("Camera", "Ortho height", 6.5, 24, 0.1, () => c.camera.orthoHeight, v => { c.camera.orthoHeight = v; }),
      this.def("Camera", "Target X", -6, 6, 0.1, () => c.camera.targetOffsetX, v => { c.camera.targetOffsetX = v; }),
      this.def("Camera", "Target Y", -2, 5, 0.1, () => c.camera.targetOffsetY, v => { c.camera.targetOffsetY = v; }),
      this.def("Camera", "Target Z", -6, 6, 0.1, () => c.camera.targetOffsetZ, v => { c.camera.targetOffsetZ = v; }),
      this.def("Camera", "Follow sharpness", 1, 20, 0.5, () => c.camera.followSharpness, v => { c.camera.followSharpness = v; }),
      this.def("Player", "Visual height", 1.4, 2.3, 0.02, () => c.player.visualHeight, v => { c.player.visualHeight = v; }),
      this.def("Player", "Collision radius", 0.2, 0.7, 0.01, () => c.player.collisionRadius, v => { c.player.collisionRadius = v; }),
      this.def("Player", "Movement speed", 2, 8, 0.1, () => c.player.movementSpeed, v => { c.player.movementSpeed = v; }),
      this.def("Player", "Acceleration", 4, 40, 1, () => c.player.acceleration, v => { c.player.acceleration = v; }),
      this.def("Player", "Deceleration", 4, 50, 1, () => c.player.deceleration, v => { c.player.deceleration = v; }),
      this.def("Player", "Rotation speed", 2, 24, 0.5, () => c.player.rotationSpeed, v => { c.player.rotationSpeed = v; }),
      this.def("World", "Tree scale", 0.6, 1.6, 0.02, () => c.world.treeScale, v => { c.world.treeScale = v; }),
      this.def("World", "Rock scale", 0.6, 1.7, 0.02, () => c.world.rockScale, v => { c.world.rockScale = v; }),
      this.def("World", "Wall height", 1.6, 4, 0.05, () => c.world.wallHeight, v => { c.world.wallHeight = v; }),
      this.def("World", "Grid cell size", 1.8, 3.6, 0.05, () => c.world.gridCellSize, v => { c.world.gridCellSize = v; }),
      this.def("Visual / Rendering", "Ground detail", 0.3, 1.5, 0.05, () => c.visual.groundDetail, v => { c.visual.groundDetail = v; }),
      this.def("Visual / Rendering", "Dirt intensity", 0, 1.5, 0.05, () => c.visual.dirtIntensity, v => { c.visual.dirtIntensity = v; }),
      this.def("Visual / Rendering", "Clutter density", 0.15, 1.5, 0.05, () => c.visual.clutterDensity, v => { c.visual.clutterDensity = v; }),
      this.def("Visual / Rendering", "Foliage sway", 0, 0.5, 0.01, () => c.visual.foliageSway, v => { c.visual.foliageSway = v; }),
      this.def("Visual / Rendering", "Contact shadow", 0, 0.6, 0.02, () => c.visual.contactShadowIntensity, v => { c.visual.contactShadowIntensity = v; }),
      this.def("Visual / Rendering", "Post processing", 0, 1, 0.02, () => c.visual.postProcessIntensity, v => { c.visual.postProcessIntensity = v; }),
      this.def("Lighting", "Sun rotation", 0, 360, 1, () => c.lighting.directionalRotationDeg, v => { c.lighting.directionalRotationDeg = v; }),
      this.def("Lighting", "Sun intensity", 0.2, 3, 0.05, () => c.lighting.directionalIntensity, v => { c.lighting.directionalIntensity = v; }),
      this.def("Lighting", "Ambient intensity", 0.1, 1.5, 0.05, () => c.lighting.ambientIntensity, v => { c.lighting.ambientIntensity = v; }),
      this.def("Lighting", "Shadow softness", 1, 3, 1, () => c.lighting.shadowSoftness, v => { c.lighting.shadowSoftness = v; }),
      this.def("Interaction", "Interaction range", 0.5, 3, 0.05, () => c.interaction.range, v => { c.interaction.range = v; }),
      this.def("Interaction", "Target switch bias", 0, 0.6, 0.01, () => c.interaction.targetSwitchBias, v => { c.interaction.targetSwitchBias = v; }),
      this.def("Harvesting", "Hatchet swing", 0.7, 1.5, 0.01, () => c.harvesting.hatchetSwingDuration, v => { c.harvesting.hatchetSwingDuration = v; }),
      this.def("Harvesting", "Hatchet impact", 0.3, 0.75, 0.01, () => c.harvesting.hatchetImpactTiming, v => { c.harvesting.hatchetImpactTiming = v; }),
      this.def("Harvesting", "Pickaxe swing", 0.65, 1.35, 0.01, () => c.harvesting.pickaxeSwingDuration, v => { c.harvesting.pickaxeSwingDuration = v; }),
      this.def("Harvesting", "Pickaxe impact", 0.3, 0.75, 0.01, () => c.harvesting.pickaxeImpactTiming, v => { c.harvesting.pickaxeImpactTiming = v; }),
      this.def("Harvesting", "Move cancel", 0.05, 0.6, 0.01, () => c.harvesting.movementCancelThreshold, v => { c.harvesting.movementCancelThreshold = v; }),
      this.def("Harvesting", "Hit reaction", 0.1, 1.2, 0.05, () => c.harvesting.hitReactionStrength, v => { c.harvesting.hitReactionStrength = v; }),
      this.def("Harvesting", "Particles", 0.2, 1.4, 0.05, () => c.harvesting.particleIntensity, v => { c.harvesting.particleIntensity = v; }),
    ];
  }

  private def(group: string, label: string, min: number, max: number, step: number, get: () => number, set: (value: number) => void): ControlDefinition {
    return { group, label, min, max, step, get, set };
  }

  private render(): void {
    this.element.innerHTML = `<header><div><small>VISUAL MILESTONE V1</small><h2>Calibration</h2></div><span>F1</span></header><div class="calibration-scroll"></div>`;
    const scroll = this.element.querySelector<HTMLElement>(".calibration-scroll");
    if (!scroll) return;
    let activeGroup = "";
    for (const control of this.controls) {
      if (control.group !== activeGroup) {
        activeGroup = control.group;
        const heading = document.createElement("h3");
        heading.textContent = activeGroup;
        scroll.append(heading);
      }
      const row = document.createElement("label");
      row.className = "calibration-row";
      row.innerHTML = `<span>${control.label}</span>`;
      const range = document.createElement("input");
      range.type = "range";
      range.min = String(control.min); range.max = String(control.max); range.step = String(control.step); range.value = String(control.get());
      const number = document.createElement("input");
      number.type = "number";
      number.min = String(control.min); number.max = String(control.max); number.step = String(control.step); number.value = String(control.get());
      const update = (value: string): void => {
        const parsed = Math.max(control.min, Math.min(control.max, Number(value)));
        if (!Number.isFinite(parsed)) return;
        control.set(parsed); range.value = String(parsed); number.value = String(parsed); this.onChange();
      };
      range.addEventListener("input", () => { update(range.value); });
      number.addEventListener("change", () => { update(number.value); });
      row.append(range, number);
      scroll.append(row);
    }
    const qualityRow = document.createElement("label");
    qualityRow.className = "calibration-row calibration-select-row";
    qualityRow.innerHTML = "<span>Quality preset</span>";
    const qualitySelect = document.createElement("select");
    for (const preset of ["low", "medium", "high", "ultra"] satisfies VisualQualityPreset[]) {
      const option = document.createElement("option");
      option.value = preset;
      option.textContent = preset.toUpperCase();
      option.selected = preset === this.config.visual.qualityPreset;
      qualitySelect.append(option);
    }
    qualitySelect.addEventListener("change", () => {
      this.config.visual.qualityPreset = qualitySelect.value as VisualQualityPreset;
      this.onChange();
    });
    qualityRow.append(qualitySelect);
    scroll.append(qualityRow);
    const toolHeading = document.createElement("h3");
    toolHeading.textContent = "Prototype Tools";
    scroll.append(toolHeading);
    const toolControls = document.createElement("div");
    toolControls.className = "prototype-tools";
    for (const [tool, label] of [["hatchet", "Hatchet"], ["pickaxe", "Pickaxe"]] satisfies [HarvestTool, string][]) {
      const row = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.checked = this.tools.hasTool(tool);
      checkbox.addEventListener("change", () => { this.tools.setTool(tool, checkbox.checked); });
      row.append(checkbox, document.createTextNode(label));
      toolControls.append(row);
    }
    scroll.append(toolControls);
    const actions = document.createElement("div");
    actions.className = "calibration-actions";
    actions.innerHTML = `<button data-action="save">Save calibration</button><button data-action="copy">Copy config</button><button data-action="reset" class="muted">Reset</button>`;
    actions.addEventListener("click", (event) => {
      const button = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!button) return;
      if (button.dataset.action === "save") {
        localStorage.setItem(GAME_CONFIG.localStorageKey, JSON.stringify(this.config));
        this.flash(button, "Saved");
      } else if (button.dataset.action === "copy") {
        void navigator.clipboard.writeText(JSON.stringify(this.config, null, 2)).then(() => { this.flash(button, "Copied"); }).catch(() => { this.flash(button, "Clipboard denied"); });
      } else if (button.dataset.action === "reset") {
        const defaults = cloneCalibration(DEFAULT_CALIBRATION);
        Object.assign(this.config.camera, defaults.camera);
        Object.assign(this.config.player, defaults.player);
        Object.assign(this.config.world, defaults.world);
        Object.assign(this.config.lighting, defaults.lighting);
        Object.assign(this.config.interaction, defaults.interaction);
        Object.assign(this.config.harvesting, defaults.harvesting);
        Object.assign(this.config.visual, defaults.visual);
        localStorage.removeItem(GAME_CONFIG.localStorageKey);
        for (const key of GAME_CONFIG.legacyCalibrationKeys) localStorage.removeItem(key);
        this.onChange(); this.render();
      }
    });
    scroll.append(actions);
  }

  private flash(button: HTMLButtonElement, text: string): void {
    const original = button.textContent;
    button.textContent = text;
    window.setTimeout(() => { button.textContent = original; }, 1200);
  }
}
