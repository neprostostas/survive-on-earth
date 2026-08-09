import type { Vector3 } from "@babylonjs/core/Maths/math.vector";
import type { Interactable } from "../interaction/Interactable";

export class Minimap {
  private readonly context: CanvasRenderingContext2D;
  private readonly size = 180;
  private readonly worldRadius = 15;

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Minimap canvas context is unavailable");
    this.context = context;
    canvas.width = this.size;
    canvas.height = this.size;
  }

  update(player: Readonly<Vector3>, facingYaw: number, interactables: readonly Interactable[]): void {
    const c = this.context;
    const center = this.size / 2;
    c.clearRect(0, 0, this.size, this.size);
    c.save();
    c.beginPath(); c.arc(center, center, center - 4, 0, Math.PI * 2); c.clip();
    c.fillStyle = "rgba(43,53,39,.88)"; c.fillRect(0, 0, this.size, this.size);
    c.strokeStyle = "rgba(215,225,195,.13)"; c.lineWidth = 1;
    for (const radius of [0.33, 0.66, 0.94]) { c.beginPath(); c.arc(center, center, center * radius, 0, Math.PI * 2); c.stroke(); }
    c.beginPath(); c.moveTo(center, 7); c.lineTo(center, this.size - 7); c.moveTo(7, center); c.lineTo(this.size - 7, center); c.stroke();
    for (const target of interactables) {
      if (!target.isInteractionEnabled()) continue;
      const position = target.getInteractionPosition();
      const dx = position.x - player.x;
      const dz = position.z - player.z;
      if (Math.abs(dx) > this.worldRadius || Math.abs(dz) > this.worldRadius) continue;
      const x = center + dx / this.worldRadius * (center - 10);
      const y = center - dz / this.worldRadius * (center - 10);
      const id = target.interactionId;
      c.fillStyle = id.startsWith("tree") ? "#82915a" : id.startsWith("rock") ? "#929487" : id.startsWith("campfire") ? "#d68a47" : "#c7b47a";
      c.beginPath(); c.arc(x, y, id.startsWith("tree") ? 3.2 : 2.5, 0, Math.PI * 2); c.fill();
    }
    c.translate(center, center); c.rotate(facingYaw);
    c.fillStyle = "#f4f1df"; c.strokeStyle = "#28352b"; c.lineWidth = 2;
    c.beginPath(); c.moveTo(0, -9); c.lineTo(6, 7); c.lineTo(0, 4); c.lineTo(-6, 7); c.closePath(); c.fill(); c.stroke();
    c.restore();
  }
}
