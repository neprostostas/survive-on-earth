import type { MinimapFrame, MinimapMarker } from "./minimapTypes";

export interface MinimapOptions {
  /** Visible radius around the player in world units. */
  readonly worldRadius?: number;
  /** Clip to circle (HUD) or draw full square/rect canvas (expanded map). */
  readonly square?: boolean;
  /**
   * `camera` — align to gameplay camera yaw (HUD minimap; world bounds look diamond at ~45°).
   * `world` — north-up / axis-aligned (expanded location map).
   */
  readonly orientation?: "camera" | "world";
}

export class Minimap {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  /** Visible radius around the player in world units. */
  private worldRadius: number;
  private readonly square: boolean;
  private readonly orientation: "camera" | "world";
  /** Logical (CSS) drawing size. */
  private width = 180;
  private height = 180;

  private bufferScaleX = 1;
  private bufferScaleY = 1;
  private bufferDirty = true;
  private resizeObserver: ResizeObserver | null = null;

  constructor(canvas: HTMLCanvasElement, options: MinimapOptions = {}) {
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) throw new Error("Minimap canvas context is unavailable");
    this.canvas = canvas;
    this.context = context;
    this.worldRadius = options.worldRadius ?? 18;
    this.square = options.square ?? false;
    this.orientation = options.orientation ?? "camera";
    if (typeof ResizeObserver !== "undefined") {
      this.resizeObserver = new ResizeObserver(() => { this.bufferDirty = true; });
      this.resizeObserver.observe(canvas);
    }
    this.syncBuffer();
  }

  setWorldRadius(radius: number): void {
    this.worldRadius = Math.max(8, radius);
  }

  update(frame: MinimapFrame): void {
    this.syncBuffer();
    const c = this.context;
    const w = this.width;
    const h = this.height;
    const centerX = w / 2;
    const centerY = h / 2;
    const pad = Math.max(10, Math.min(w, h) * 0.04);
    const worldScale = (Math.min(w, h) / 2 - pad) / this.worldRadius;

    let srx: number;
    let srz: number;
    let sux: number;
    let suz: number;
    if (this.orientation === "world") {
      // +X → right, +Z → up on map (axis-aligned / "straight")
      srx = 1;
      srz = 0;
      sux = 0;
      suz = 1;
    } else {
      const { cameraYawRad } = frame;
      sux = -Math.sin(cameraYawRad);
      suz = -Math.cos(cameraYawRad);
      srx = suz;
      srz = -sux;
    }

    const project = (wx: number, wz: number): { x: number; y: number } => {
      const dx = wx - frame.playerX;
      const dz = wz - frame.playerZ;
      const right = dx * srx + dz * srz;
      const up = dx * sux + dz * suz;
      return { x: centerX + right * worldScale, y: centerY - up * worldScale };
    };

    c.setTransform(this.bufferScaleX, 0, 0, this.bufferScaleY, 0, 0);
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";

    c.save();
    if (!this.square) {
      c.beginPath();
      c.arc(centerX, centerY, Math.min(centerX, centerY), 0, Math.PI * 2);
      c.clip();
      // Circular HUD minimap keeps a solid disc so it reads on the game chrome.
      c.fillStyle = "rgba(38, 48, 36, 0.95)";
      c.fillRect(0, 0, w, h);
    }
    // Expanded square map: no full-canvas wash — only the playable area / markers.

    // Playable bounds
    const half = frame.worldHalfExtent;
    const corners = [
      project(-half, -half),
      project(half, -half),
      project(half, half),
      project(-half, half),
    ];
    c.beginPath();
    c.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i += 1) c.lineTo(corners[i].x, corners[i].y);
    c.closePath();
    c.strokeStyle = "rgba(214, 198, 120, 0.55)";
    c.lineWidth = 1.6;
    c.setLineDash([4, 3]);
    c.stroke();
    c.setLineDash([]);
    // Soft fill only inside playable bounds (not the whole canvas).
    c.fillStyle = this.square ? "rgba(18, 24, 16, 0.42)" : "rgba(18, 24, 16, 0.22)";
    c.fill();

    for (const marker of frame.markers) {
      if (marker.kind === "house-floor") this.drawHouseFloor(c, project, marker);
      else if (marker.kind === "wall") this.drawWall(c, project, marker);
    }

    const iconScale = Math.max(0.9, Math.min(w, h) / 180);
    for (const marker of frame.markers) {
      if (marker.kind === "house-floor" || marker.kind === "wall") continue;
      const p = project(marker.x, marker.z);
      if (!this.inView(p.x, p.y, centerX, centerY)) continue;
      this.drawPointMarker(c, p.x, p.y, marker.kind, marker.yaw, srx, srz, sux, suz, iconScale);
    }

    const faceDirX = Math.sin(frame.facingYaw);
    const faceDirZ = Math.cos(frame.facingYaw);
    const faceRight = faceDirX * srx + faceDirZ * srz;
    const faceUp = faceDirX * sux + faceDirZ * suz;
    const faceAngle = Math.atan2(faceRight, faceUp);

    c.translate(centerX, centerY);
    c.rotate(faceAngle);
    c.scale(iconScale, iconScale);
    c.fillStyle = "#f5f2e2";
    c.strokeStyle = "#1c261c";
    c.lineWidth = 1.5 / iconScale;
    c.beginPath();
    c.moveTo(0, -10);
    c.lineTo(6.5, 8);
    c.lineTo(0, 4.2);
    c.lineTo(-6.5, 8);
    c.closePath();
    c.fill();
    c.stroke();
    c.restore();
  }

  /** Match backing store to CSS size × device pixel ratio. Measure only when dirty. */
  private syncBuffer(): void {
    if (!this.bufferDirty && this.width > 1 && this.height > 1) return;
    this.bufferDirty = false;
    // Prefer non-forcing box size when available
    const cssW = Math.max(1, Math.round(this.canvas.clientWidth || this.width || 180));
    const cssH = Math.max(1, Math.round(this.canvas.clientHeight || this.height || cssW));
    const dpr = Math.min(Math.max(window.devicePixelRatio || 1, 1), 3);
    const bufferW = Math.max(1, Math.round(cssW * dpr));
    const bufferH = Math.max(1, Math.round(cssH * dpr));
    if (this.canvas.width !== bufferW || this.canvas.height !== bufferH) {
      this.canvas.width = bufferW;
      this.canvas.height = bufferH;
    }
    this.width = cssW;
    this.height = cssH;
    this.bufferScaleX = dpr;
    this.bufferScaleY = dpr;
  }

  private inView(x: number, y: number, centerX: number, centerY: number): boolean {
    if (this.square) {
      const pad = 4;
      return x >= pad && y >= pad && x <= this.width - pad && y <= this.height - pad;
    }
    const dx = x - centerX;
    const dy = y - centerY;
    const r = Math.min(centerX, centerY) - 4;
    return dx * dx + dy * dy <= r * r;
  }

  private drawHouseFloor(
    c: CanvasRenderingContext2D,
    project: (x: number, z: number) => { x: number; y: number },
    marker: Extract<MinimapMarker, { kind: "house-floor" }>,
  ): void {
    const pts = [
      project(marker.x - marker.halfX, marker.z - marker.halfZ),
      project(marker.x + marker.halfX, marker.z - marker.halfZ),
      project(marker.x + marker.halfX, marker.z + marker.halfZ),
      project(marker.x - marker.halfX, marker.z + marker.halfZ),
    ];
    c.beginPath();
    c.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i += 1) c.lineTo(pts[i].x, pts[i].y);
    c.closePath();
    c.fillStyle = "rgba(92, 74, 52, 0.55)";
    c.fill();
    c.strokeStyle = "rgba(168, 140, 96, 0.7)";
    c.lineWidth = 1.2;
    c.stroke();
  }

  private drawWall(
    c: CanvasRenderingContext2D,
    project: (x: number, z: number) => { x: number; y: number },
    marker: Extract<MinimapMarker, { kind: "wall" }>,
  ): void {
    const a = project(marker.x0, marker.z0);
    const b = project(marker.x1, marker.z1);
    c.beginPath();
    c.moveTo(a.x, a.y);
    c.lineTo(b.x, b.y);
    c.strokeStyle = "rgba(138, 118, 88, 0.95)";
    c.lineWidth = 3.2;
    c.lineCap = "square";
    c.stroke();
    c.strokeStyle = "rgba(210, 190, 150, 0.55)";
    c.lineWidth = 1.1;
    c.stroke();
  }

  private drawPointMarker(
    c: CanvasRenderingContext2D,
    x: number,
    y: number,
    kind: Exclude<MinimapMarker["kind"], "wall" | "house-floor">,
    yaw: number | undefined,
    srx: number,
    srz: number,
    sux: number,
    suz: number,
    iconScale: number,
  ): void {
    c.save();
    c.translate(x, y);
    c.scale(iconScale, iconScale);
    switch (kind) {
      case "tree": {
        c.fillStyle = "#6f8a46";
        c.strokeStyle = "#2c3820";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, -6.5);
        c.lineTo(5.2, 4);
        c.lineTo(-5.2, 4);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#5a472f";
        c.fillRect(-1.1, 3.2, 2.2, 3);
        break;
      }
      case "rock": {
        c.fillStyle = "#9a9a8a";
        c.strokeStyle = "#4a4a42";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(-4.2, 1.5);
        c.lineTo(-2.2, -3.4);
        c.lineTo(2.6, -3.8);
        c.lineTo(4.4, 0.8);
        c.lineTo(1.4, 3.8);
        c.lineTo(-3.4, 3.4);
        c.closePath();
        c.fill();
        c.stroke();
        break;
      }
      case "campfire": {
        c.fillStyle = "#e08a35";
        c.strokeStyle = "#5a2d12";
        c.lineWidth = 1;
        c.beginPath();
        c.moveTo(0, -5.5);
        c.lineTo(4.5, 3.5);
        c.lineTo(-4.5, 3.5);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "#f3d66a";
        c.beginPath();
        c.moveTo(0, -2.8);
        c.lineTo(2.2, 2);
        c.lineTo(-2.2, 2);
        c.closePath();
        c.fill();
        break;
      }
      case "crate": {
        c.fillStyle = "#8b6a3e";
        c.strokeStyle = "#3d2c18";
        c.lineWidth = 1.2;
        c.fillRect(-4, -4, 8, 8);
        c.strokeRect(-4, -4, 8, 8);
        c.beginPath();
        c.moveTo(-4, -4);
        c.lineTo(4, 4);
        c.moveTo(4, -4);
        c.lineTo(-4, 4);
        c.strokeStyle = "rgba(210, 180, 120, 0.55)";
        c.lineWidth = 1;
        c.stroke();
        break;
      }
      case "enemy": {
        const ey = yaw ?? 0;
        const fx = Math.sin(ey);
        const fz = Math.cos(ey);
        const faceRight = fx * srx + fz * srz;
        const faceUp = fx * sux + fz * suz;
        c.rotate(Math.atan2(faceRight, faceUp));
        c.fillStyle = "#c4453a";
        c.strokeStyle = "#3a1210";
        c.lineWidth = 1.2;
        c.beginPath();
        c.moveTo(0, -6.5);
        c.lineTo(5, 5);
        c.lineTo(0, 2.5);
        c.lineTo(-5, 5);
        c.closePath();
        c.fill();
        c.stroke();
        break;
      }
      case "dummy": {
        c.fillStyle = "#c9b27a";
        c.strokeStyle = "#4a3c22";
        c.lineWidth = 1.2;
        c.beginPath();
        c.arc(0, 0, 4.4, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.beginPath();
        c.moveTo(-2.4, -2.4);
        c.lineTo(2.4, 2.4);
        c.moveTo(2.4, -2.4);
        c.lineTo(-2.4, 2.4);
        c.strokeStyle = "rgba(60, 45, 25, 0.75)";
        c.stroke();
        break;
      }
      default:
        break;
    }
    c.restore();
  }
}
