import type { DamageResult, HealthPool } from "./HealthPool.ts";

export interface CombatPoint {
  readonly x: number;
  readonly y: number;
  readonly z: number;
}

export interface CombatTarget {
  readonly combatId: string;
  readonly displayName: string;
  readonly health: HealthPool;
  getCombatPosition(): CombatPoint;
  isCombatAlive(): boolean;
  receiveDamage(amount: number): DamageResult;
}

export function combatDistanceSquared(left: CombatPoint, right: CombatPoint): number {
  const dx = left.x - right.x;
  const dz = left.z - right.z;
  return dx * dx + dz * dz;
}
