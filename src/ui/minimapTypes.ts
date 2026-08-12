/** Lightweight minimap projection markers (screen-relative, not gameplay state). */

export type MinimapMarkerKind =
  | "tree"
  | "rock"
  | "campfire"
  | "workbench"
  | "stump"
  | "farm"
  | "crate"
  | "enemy"
  | "dummy"
  | "death-bag"
  | "house-floor"
  | "wall";

export interface MinimapPointMarker {
  readonly kind: Exclude<MinimapMarkerKind, "wall" | "house-floor">;
  readonly x: number;
  readonly z: number;
  /** World yaw for directional markers (enemies). */
  readonly yaw?: number;
}

export interface MinimapRectMarker {
  readonly kind: "house-floor";
  readonly x: number;
  readonly z: number;
  readonly halfX: number;
  readonly halfZ: number;
}

export interface MinimapSegmentMarker {
  readonly kind: "wall";
  readonly x0: number;
  readonly z0: number;
  readonly x1: number;
  readonly z1: number;
}

export type MinimapMarker = MinimapPointMarker | MinimapRectMarker | MinimapSegmentMarker;

export interface MinimapFrame {
  readonly playerX: number;
  readonly playerZ: number;
  readonly facingYaw: number;
  readonly cameraYawRad: number;
  readonly worldHalfExtent: number;
  readonly markers: readonly MinimapMarker[];
}
