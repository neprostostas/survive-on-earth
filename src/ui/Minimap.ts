import type { MinimapFrame, MinimapMarker } from "./minimapTypes";

export interface MinimapOptions {
  /** Visible radius around the player in world units (disc edge when circular). */
  readonly worldRadius?: number;
  /** Clip to circle (HUD) or draw full square/rect canvas (expanded map). */
  readonly square?: boolean;
  /**
   * `camera` — align to gameplay camera yaw (HUD minimap; world bounds look diamond at ~45°).
   * `world` — north-up / axis-aligned (expanded location map).
   */
  readonly orientation?: "camera" | "world";
  /**
   * Extra CCW rotation of the map basis in radians (world mode).
   * Use `Math.PI / 2` for a 90° right (clockwise visual) turn from default north-up.
   */
  readonly worldYawOffsetRad?: number;
  /**
   * `follow` — player-centered viewport (HUD).
   * `location` — entire location in frame, world-origin centered (expanded map).
   */
  readonly coverage?: "follow" | "location";
}

/**
 * Off-screen stream headroom (world units) past the visible rim.
 * Fixed for sprint-scale motion so gait never zooms or re-fades the HUD map —
 * only whether far markers are already drawn before they enter the disc.
 */
const STREAM_LEAD_UNITS = 9;
/** Soft edge fade as a fraction of disc radius (constant; not gait-linked). */
const SOFT_RIM_FRAC = 0.22;

export class Minimap {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  /** Nominal visible radius around the player in world units. */
  private worldRadius: number;
  private readonly square: boolean;
  private readonly orientation: "camera" | "world";
  private readonly worldYawOffsetRad: number;
  private readonly coverage: "follow" | "location";
  /** Logical (CSS) drawing size. */
  private width = 180;
  private height = 180;

  private bufferScaleX = 1;
  private bufferScaleY = 1;
  private bufferDirty = true;
  private resizeObserver: ResizeObserver | null = null;
  /** Sticky keys so stream desync does not flicker at the load band. */
  private stickyMarkerKeys = new Set<string>();

  constructor(canvas: HTMLCanvasElement, options: MinimapOptions = {}) {
    const context = canvas.getContext("2d", { alpha: true, desynchronized: true });
    if (!context) throw new Error("Minimap canvas context is unavailable");
    this.canvas = canvas;
    this.context = context;
    this.worldRadius = options.worldRadius ?? 18;
    this.square = options.square ?? false;
    this.orientation = options.orientation ?? "camera";
    this.worldYawOffsetRad = options.worldYawOffsetRad ?? 0;
    this.coverage = options.coverage ?? "follow";
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
    const pad = Math.max(8, Math.min(w, h) * 0.035);
    const fullLocation = this.coverage === "location";
    const half = Math.max(8, frame.worldHalfExtent);
    // Visible projection stays fixed (walk / sneak / sprint must not zoom the map).
    const projectRadius = fullLocation ? half * 1.06 : this.worldRadius;
    // Stream further than the disc so markers exist before the soft rim reveals them.
    const streamRadius = fullLocation
      ? Number.POSITIVE_INFINITY
      : this.worldRadius + STREAM_LEAD_UNITS;
    const streamRadiusSq = streamRadius * streamRadius;
    const stickyRadiusSq = fullLocation ? streamRadiusSq : (streamRadius * 1.28) * (streamRadius * 1.28);
    const worldScale = (Math.min(w, h) / 2 - pad) / projectRadius;
    // Origin: world center for full location; player for HUD follow.
    const originX = fullLocation ? 0 : frame.playerX;
    const originZ = fullLocation ? 0 : frame.playerZ;

    let srx: number;
    let srz: number;
    let sux: number;
    let suz: number;
    if (this.orientation === "world") {
      // Default: +X → right, +Z → up. Optional CCW offset rotates the map basis.
      // +π/2 turns the picture 90° right (clockwise) from that default.
      const cos = Math.cos(this.worldYawOffsetRad);
      const sin = Math.sin(this.worldYawOffsetRad);
      srx = cos;
      srz = sin;
      sux = -sin;
      suz = cos;
    } else {
      const { cameraYawRad } = frame;
      sux = -Math.sin(cameraYawRad);
      suz = -Math.cos(cameraYawRad);
      srx = suz;
      srz = -sux;
    }

    const project = (wx: number, wz: number): { x: number; y: number } => {
      const dx = wx - originX;
      const dz = wz - originZ;
      const right = dx * srx + dz * srz;
      const up = dx * sux + dz * suz;
      return { x: centerX + right * worldScale, y: centerY - up * worldScale };
    };

    const distSqToPlayer = (wx: number, wz: number): number => {
      const dx = wx - frame.playerX;
      const dz = wz - frame.playerZ;
      return dx * dx + dz * dz;
    };

    const nextSticky = new Set<string>();
    const streamed = (key: string, distSq: number): boolean => {
      if (fullLocation) return true;
      if (distSq <= streamRadiusSq) {
        nextSticky.add(key);
        return true;
      }
      if (this.stickyMarkerKeys.has(key) && distSq <= stickyRadiusSq) {
        nextSticky.add(key);
        return true;
      }
      return false;
    };

    c.setTransform(this.bufferScaleX, 0, 0, this.bufferScaleY, 0, 0);
    c.clearRect(0, 0, w, h);
    c.imageSmoothingEnabled = true;
    c.imageSmoothingQuality = "high";

    c.save();
    const discR = Math.min(centerX, centerY);
    if (!this.square) {
      c.beginPath();
      c.arc(centerX, centerY, discR, 0, Math.PI * 2);
      c.clip();
      // Circular HUD minimap keeps a solid disc so it reads on the game chrome.
      c.fillStyle = "rgba(38, 48, 36, 0.95)";
      c.fillRect(0, 0, w, h);
    } else if (fullLocation) {
      // Full-location expanded map: solid field fill behind markers.
      c.fillStyle = "rgba(22, 28, 20, 0.92)";
      c.fillRect(0, 0, w, h);
    }

    // Soft rim hides hard cut at stream edge; width is fixed (not walk/sprint/sneak).
    const rimFrac = fullLocation || this.square ? 0 : SOFT_RIM_FRAC;
    const fadeStart = discR * (1 - rimFrac);
    const fadeEnd = discR - 1.5;
    const screenAlpha = (px: number, py: number): number => {
      if (fullLocation || this.square || rimFrac <= 0) return 1;
      const d = Math.hypot(px - centerX, py - centerY);
      if (d <= fadeStart) return 1;
      if (d >= fadeEnd) return 0;
      return 1 - (d - fadeStart) / (fadeEnd - fadeStart);
    };

    // Playable bounds
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
    c.strokeStyle = fullLocation ? "rgba(214, 198, 120, 0.75)" : "rgba(214, 198, 120, 0.55)";
    c.lineWidth = fullLocation ? 2 : 1.6;
    c.setLineDash(fullLocation ? [] : [4, 3]);
    c.stroke();
    c.setLineDash([]);
    // Soft fill only inside playable bounds (not the whole canvas).
    c.fillStyle = fullLocation
      ? "rgba(28, 36, 24, 0.55)"
      : this.square ? "rgba(18, 24, 16, 0.42)" : "rgba(18, 24, 16, 0.22)";
    c.fill();

    // Detail grid for full-location view (landmarks read against a surface).
    if (fullLocation) {
      c.save();
      c.beginPath();
      c.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i += 1) c.lineTo(corners[i].x, corners[i].y);
      c.closePath();
      c.clip();
      const step = Math.max(4, half / 7);
      c.strokeStyle = "rgba(160, 180, 140, 0.12)";
      c.lineWidth = 1;
      for (let u = -half + step; u < half; u += step) {
        const a = project(u, -half);
        const b = project(u, half);
        c.beginPath();
        c.moveTo(a.x, a.y);
        c.lineTo(b.x, b.y);
        c.stroke();
        const c0 = project(-half, u);
        const c1 = project(half, u);
        c.beginPath();
        c.moveTo(c0.x, c0.y);
        c.lineTo(c1.x, c1.y);
        c.stroke();
      }
      // Cross at world origin
      const o = project(0, 0);
      c.strokeStyle = "rgba(214, 198, 120, 0.22)";
      c.beginPath();
      c.arc(o.x, o.y, 3.5, 0, Math.PI * 2);
      c.stroke();
      c.restore();
    }

    for (const marker of frame.markers) {
      if (marker.kind === "house-floor") {
        const dsq = distSqToPlayer(marker.x, marker.z);
        if (!fullLocation && !this.square && !streamed(`floor:${marker.x.toFixed(1)},${marker.z.toFixed(1)}`, dsq)) continue;
        const p = project(marker.x, marker.z);
        const alpha = screenAlpha(p.x, p.y);
        if (alpha <= 0.02) continue;
        c.globalAlpha = alpha;
        this.drawHouseFloor(c, project, marker);
        c.globalAlpha = 1;
      } else if (marker.kind === "wall") {
        const mx = (marker.x0 + marker.x1) * 0.5;
        const mz = (marker.z0 + marker.z1) * 0.5;
        const dsq = distSqToPlayer(mx, mz);
        if (!fullLocation && !this.square && !streamed(`wall:${marker.x0.toFixed(1)},${marker.z0.toFixed(1)}`, dsq)) continue;
        const p = project(mx, mz);
        const alpha = screenAlpha(p.x, p.y);
        if (alpha <= 0.02) continue;
        c.globalAlpha = alpha;
        this.drawWall(c, project, marker);
        c.globalAlpha = 1;
      }
    }

    // Dense full-site view needs slightly smaller icons so landmarks stay readable.
    const iconScale = fullLocation
      ? Math.max(0.55, Math.min(w, h) / 340)
      : Math.max(0.9, Math.min(w, h) / 180);
    for (const marker of frame.markers) {
      if (marker.kind === "house-floor" || marker.kind === "wall") continue;
      const dsq = distSqToPlayer(marker.x, marker.z);
      const key = `${marker.kind}:${marker.x.toFixed(2)},${marker.z.toFixed(2)}`;
      if (!fullLocation && !this.square && !streamed(key, dsq)) continue;
      const p = project(marker.x, marker.z);
      if (!this.inView(p.x, p.y, centerX, centerY)) continue;
      const alpha = screenAlpha(p.x, p.y);
      if (alpha <= 0.02) continue;
      c.globalAlpha = alpha;
      this.drawPointMarker(c, p.x, p.y, marker.kind, marker.yaw, srx, srz, sux, suz, iconScale);
      c.globalAlpha = 1;
    }
    this.stickyMarkerKeys = fullLocation ? new Set() : nextSticky;

    // Player indicator at true world position (not always canvas center on full location map).
    const playerP = project(frame.playerX, frame.playerZ);
    const faceDirX = Math.sin(frame.facingYaw);
    const faceDirZ = Math.cos(frame.facingYaw);
    const faceRight = faceDirX * srx + faceDirZ * srz;
    const faceUp = faceDirX * sux + faceDirZ * suz;
    const faceAngle = Math.atan2(faceRight, faceUp);
    const playerIcon = fullLocation ? Math.max(0.85, iconScale * 1.35) : iconScale;

    if (fullLocation) {
      c.beginPath();
      c.arc(playerP.x, playerP.y, 11 * playerIcon, 0, Math.PI * 2);
      c.strokeStyle = "rgba(245, 242, 226, 0.55)";
      c.lineWidth = 1.5;
      c.stroke();
    }

    c.translate(playerP.x, playerP.y);
    c.rotate(faceAngle);
    c.scale(playerIcon, playerIcon);
    c.fillStyle = "#f5f2e2";
    c.strokeStyle = "#1c261c";
    c.lineWidth = 1.5 / playerIcon;
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
      case "workbench": {
        c.fillStyle = "#7a5a36";
        c.strokeStyle = "#2f2212";
        c.lineWidth = 1.1;
        c.fillRect(-5, -3.2, 10, 6.4);
        c.strokeRect(-5, -3.2, 10, 6.4);
        c.fillStyle = "#a0a8b0";
        c.fillRect(1.6, -1.4, 2.4, 2.8);
        break;
      }
      case "stump": {
        c.fillStyle = "#6b4a2a";
        c.strokeStyle = "#2a1c10";
        c.lineWidth = 1.1;
        c.beginPath();
        c.ellipse(0, 0.6, 5.2, 3.6, 0, 0, Math.PI * 2);
        c.fill();
        c.stroke();
        c.fillStyle = "#9a7a4a";
        c.beginPath();
        c.ellipse(0, -0.4, 4.4, 2.8, 0, 0, Math.PI * 2);
        c.fill();
        c.strokeStyle = "rgba(50, 34, 18, 0.55)";
        c.stroke();
        break;
      }
      case "farm": {
        c.fillStyle = "#4a6a32";
        c.strokeStyle = "#243818";
        c.lineWidth = 1.1;
        c.fillRect(-4.5, -3.2, 9, 6.4);
        c.strokeRect(-4.5, -3.2, 9, 6.4);
        c.fillStyle = "#6f9a48";
        c.fillRect(-3, -1.8, 2.2, 3.6);
        c.fillRect(0.8, -1.8, 2.2, 3.6);
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
      case "death-bag": {
        c.fillStyle = "#d4a017";
        c.strokeStyle = "#3a2a0c";
        c.lineWidth = 1.3;
        c.beginPath();
        c.moveTo(-5, 3);
        c.lineTo(-4, -3);
        c.lineTo(4, -3);
        c.lineTo(5, 3);
        c.closePath();
        c.fill();
        c.stroke();
        c.fillStyle = "rgba(255, 220, 120, 0.85)";
        c.beginPath();
        c.arc(0, -4.5, 1.6, 0, Math.PI * 2);
        c.fill();
        break;
      }
      default:
        break;
    }
    c.restore();
  }
}
