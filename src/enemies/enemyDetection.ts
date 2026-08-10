/**
 * LDOE-style notice rules for idle enemies:
 * - Vision: frontal FOV cone (sees crouchers who walk into their eyes)
 * - Hearing (standing / sprint only): roughly 360° shorter range when walking, near full when running
 * - Crouch: no hearing — only vision (and damage / already-provoked)
 * - Side / rear while crouching: safe until inside FOV
 */

/** Half of total horizontal FOV (~110° total, LDOE-ish frontal cone). */
export const ENEMY_VISION_HALF_FOV_RAD = (55 * Math.PI) / 180;

/** Standing walk noise as fraction of acquireRange (omni). */
export const ENEMY_WALK_HEAR_RANGE_FRACTION = 0.42;

/** Sprint footfalls draw from almost full acquire radius. */
export const ENEMY_SPRINT_HEAR_RANGE_FRACTION = 0.95;

export interface DetectionSample {
  readonly distance: number;
  /** Absolute yaw delta from enemy facing toward player, radians in [0, π]. */
  readonly angleFromFacing: number;
  readonly sneaking: boolean;
  readonly sprinting: boolean;
  readonly acquireRange: number;
}

/** Angle between enemy forward (facingYaw) and vector to player, absolute, 0..π. */
export function angleFromFacingToTarget(
  enemyX: number,
  enemyZ: number,
  facingYaw: number,
  targetX: number,
  targetZ: number,
): number {
  const dx = targetX - enemyX;
  const dz = targetZ - enemyZ;
  if (dx * dx + dz * dz < 1e-8) return 0;
  const toYaw = Math.atan2(dx, dz);
  let diff = toYaw - facingYaw;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff);
}

/**
 * Whether an idle, unprovoked enemy notices the player this frame.
 * Once aggressive / damaged, callers skip this and stay in chase.
 */
export function idleEnemyNoticesPlayer(sample: DetectionSample): boolean {
  const range = sample.acquireRange;
  if (!(range > 0) || sample.distance > range) return false;

  const inVision =
    sample.distance <= range && sample.angleFromFacing <= ENEMY_VISION_HALF_FOV_RAD;

  // LDOE: crouch = silent; eyesight only. Walk into the cone → spotted.
  if (sample.sneaking) return inVision;

  if (inVision) return true;

  const hearFrac = sample.sprinting
    ? ENEMY_SPRINT_HEAR_RANGE_FRACTION
    : ENEMY_WALK_HEAR_RANGE_FRACTION;
  return sample.distance <= range * hearFrac;
}
