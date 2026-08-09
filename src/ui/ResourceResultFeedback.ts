import type { Engine } from "@babylonjs/core/Engines/engine";
import { Matrix, Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Scene } from "@babylonjs/core/scene";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import type { ItemId } from "../items/ItemId";
import type { ItemResult, ResourceResultSink, ResultWorldPoint } from "../items/ItemResult";

interface FeedbackEntry {
  readonly element: HTMLElement;
  readonly position: Vector3;
  active: boolean;
  elapsed: number;
  duration: number;
  lane: number;
}

const ITEM_ICONS: Record<ItemId, string> = {
  "pine-log": `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M7 9.5 21.5 5l4 4.3-2 14.2L9 27l-4-4.1z"/><path d="m7 9.5 4.2 4.2L9 27M11.2 13.7l14.3-4.4M17.3 7.2l3.8 4.2-1.5 12.9"/><path d="M12.5 17.5c2.4-1 4.5-.7 6.3.8"/></svg>`,
  limestone: `<svg viewBox="0 0 32 32" aria-hidden="true"><path d="m5 21 4.2-11.2L19 5l8.1 7.4-.9 10.2L17 27 8.4 25z"/><path d="m9.2 9.8 7 5.1L19 5M16.2 14.9 8.4 25M16.2 14.9l10.9-2.5M16.2 14.9l.8 12.1"/></svg>`,
};

export class ResourceResultFeedback implements ResourceResultSink {
  readonly definitionCount = ITEM_REGISTRY.getAll().length;
  lastResult: ItemResult | null = null;
  resultCount = 0;
  private readonly entries: FeedbackEntry[] = [];
  private readonly identity = Matrix.Identity();

  constructor(private readonly root: HTMLElement, private readonly scene: Scene, private readonly engine: Engine) {
    for (let index = 0; index < 4; index += 1) {
      const element = document.createElement("div");
      element.className = "resource-result-feedback";
      element.setAttribute("aria-hidden", "true");
      root.append(element);
      this.entries.push({ element, position: Vector3.Zero(), active: false, elapsed: 0, duration: 1.05, lane: 0 });
    }
  }

  handle(result: ItemResult, position: ResultWorldPoint): void {
    const entry = this.entries.find((candidate) => !candidate.active)
      ?? this.entries.reduce((oldest, candidate) => candidate.elapsed > oldest.elapsed ? candidate : oldest);
    const definition = ITEM_REGISTRY.get(result.itemId);
    entry.active = true;
    entry.elapsed = 0;
    entry.duration = 1.05;
    entry.lane = this.resultCount % 3 - 1;
    entry.position.set(position.x, position.y, position.z);
    entry.element.innerHTML = `<span class="result-item-icon">${ITEM_ICONS[definition.iconId]}</span><span class="result-item-copy"><b>+${result.quantity}</b><small>${definition.displayName}</small></span>`;
    entry.element.style.opacity = "0";
    entry.element.style.display = "flex";
    this.lastResult = result;
    this.resultCount += 1;
  }

  update(delta: number): void {
    const camera = this.scene.activeCamera;
    if (!camera) return;
    const renderWidth = Math.max(1, this.engine.getRenderWidth());
    const renderHeight = Math.max(1, this.engine.getRenderHeight());
    const viewport = camera.viewport.toGlobal(renderWidth, renderHeight);
    const scaleX = this.root.clientWidth / renderWidth;
    const scaleY = this.root.clientHeight / renderHeight;
    for (const entry of this.entries) {
      if (!entry.active) continue;
      entry.elapsed += delta;
      if (entry.elapsed >= entry.duration) {
        entry.active = false;
        entry.element.style.display = "none";
        continue;
      }
      const projected = Vector3.Project(entry.position, this.identity, this.scene.getTransformMatrix(), viewport);
      if (projected.z < 0 || projected.z > 1) {
        entry.element.style.opacity = "0";
        continue;
      }
      const progress = entry.elapsed / entry.duration;
      const fadeIn = Math.min(1, progress / 0.12);
      const fadeOut = Math.min(1, (1 - progress) / 0.3);
      const opacity = fadeIn * fadeOut;
      const lift = 2 + progress * 24;
      const scale = 0.9 + Math.min(1, progress / 0.18) * 0.1;
      entry.element.style.left = `${projected.x * scaleX + entry.lane * 18}px`;
      entry.element.style.top = `${projected.y * scaleY}px`;
      entry.element.style.opacity = String(opacity);
      entry.element.style.transform = `translate(-50%, -100%) translateY(${-lift}px) scale(${scale})`;
    }
  }
}
