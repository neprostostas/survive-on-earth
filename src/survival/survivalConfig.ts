/**
 * Survival need pools — frame-rate independent via dt seconds.
 *
 * Drain paced like LDOE: full bars last a long session (idle), not a few minutes.
 * Approx. real-time empty-from-full (standing, no sprint drain):
 *   hunger ~45 min, thirst ~32 min (thirst slightly hungrier).
 */
export const SURVIVAL_CONFIG = Object.freeze({
  hunger: Object.freeze({
    max: 100,
    /** New game / session start: full bar. */
    initial: 100,
    /** ~100 / 0.037 ≈ 45 min to empty. */
    drainPerSecond: 0.037,
    starvationThreshold: 0,
    starvationDamagePerSecond: 1.5,
  }),
  thirst: Object.freeze({
    max: 100,
    /** New game / session start: full bar. */
    initial: 100,
    /** ~100 / 0.052 ≈ 32 min to empty (LDOE thirst declines a bit faster). */
    drainPerSecond: 0.052,
    dehydrationThreshold: 0,
    dehydrationDamagePerSecond: 2,
  }),
  energy: Object.freeze({
    max: 100,
    initial: 100,
    regenPerSecond: 0.15,
    travelCostDefault: 10,
  }),
  cold: Object.freeze({
    risePerSecond: 4,
    fallPerSecond: 6,
    damagePerSecond: 2,
  }),
  heat: Object.freeze({
    dehydrationMulPerHeat: 0.4,
  }),
});
