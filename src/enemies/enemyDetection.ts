/**
 * LDOE-style notice rules for idle enemies:
 * - Vision: frontal FOV cone (sees crouchers who walk into their eyes)
 * - Hearing: 360° — gait radius + one-shot player noise bursts
 * - Crouch: no gait/burst hearing — only vision (and damage / already-provoked)
 * - Side / rear while crouching: safe until inside FOV
 */

/** Half of total horizontal FOV (~110° total, LDOE-ish frontal cone). */
export const ENEMY_VISION_HALF_FOV_RAD = (55 * Math.PI) / 180;

/** Standing walk noise as fraction of acquireRange (omni). Legacy baseline. */
export const ENEMY_WALK_HEAR_RANGE_FRACTION = 0.42;

/** Sprint footfalls draw from almost full acquire radius. Legacy baseline. */
export const ENEMY_SPRINT_HEAR_RANGE_FRACTION = 0.95;

export interface DetectionSample {
  readonly distance: number;
  /** Absolute yaw delta from enemy facing toward player, radians in [0, π]. */
  readonly angleFromFacing: number;
  readonly sneaking: boolean;
  readonly sprinting: boolean;
  readonly acquireRange: number;
  /**
   * Optional live player noise radius (continuous gait + burst spikes).
   * Combined with legacy walk/sprint fractions so sprint still hits full cone.
   */
  readonly playerNoiseRadius?: number;
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

/** Effective omni hear distance for a sample (legacy gait × noise radius). */
export function effectiveHearRange(sample: DetectionSample): number {
  if (sample.sneaking) return 0;
  const legacy = sample.sprinting
    ? sample.acquireRange * ENEMY_SPRINT_HEAR_RANGE_FRACTION
    : sample.acquireRange * ENEMY_WALK_HEAR_RANGE_FRACTION;
  const noise = sample.playerNoiseRadius ?? 0;
  return Math.max(legacy, noise);
}

/**
 * Whether an idle, unprovoked enemy notices the player this frame.
 * Once aggressive / damaged, callers skip this and stay in chase.
 */
export function idleEnemyNoticesPlayer(sample: DetectionSample): boolean {
  const range = sample.acquireRange;
  if (!(range > 0) || sample.distance > range) {
    // Burst noise can still wake beyond nominal acquire if louder than the cone.
    // Cap at 1.35× acquire so a scream across the map never happens.
    const hearCap = range * 1.35;
    if (sample.sneaking || sample.distance > hearCap) return false;
    const hear = effectiveHearRange(sample);
    return sample.distance <= hear && hear > range;
  }

  const inVision =
    sample.distance <= range && sample.angleFromFacing <= ENEMY_VISION_HALF_FOV_RAD;

  // LDOE: crouch = silent; eyesight only. Walk into the cone → spotted.
  if (sample.sneaking) return inVision;

  if (inVision) return true;

  return sample.distance <= effectiveHearRange(sample);
}

/**
 * Soft awareness 0..1 for UI (yellow bars). Full 1 means "about to / is chasing".
 * Instant when vision/hearing would notice; partial for near-miss hearing outside range.
 */
export function computeAwarenessMeter(sample: DetectionSample): number {
  if (idleEnemyNoticesPlayer(sample)) return 1;
  const range = sample.acquireRange;
  if (!(range > 0) || sample.distance > range * 1.4) return 0;
  if (sample.sneaking) {
    // Soft vision edge: half FOV fringe
    if (sample.angleFromFacing > ENEMY_VISION_HALF_FOV_RAD * 1.35) return 0;
    const edge = 1 - sample.distance / range;
    const cone = 1 - sample.angleFromFacing / (ENEMY_VISION_HALF_FOV_RAD * 1.35);
    return Math.max(0, Math.min(0.85, edge * cone * 0.7));
  }
  const hear = effectiveHearRange(sample);
  if (hear <= 0) return 0;
  // Soft gradient just outside footfall range (investigate / yellow pips).
  const horizon = Math.max(hear * 1.65, 0.01);
  if (sample.distance > horizon) return 0;
  const proximity = 1 - sample.distance / horizon;
  return Math.max(0, Math.min(0.9, proximity * 1.35));
}
