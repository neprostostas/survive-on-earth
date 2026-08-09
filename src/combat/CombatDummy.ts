import { COMBAT_CONFIG } from "./combatConfig.ts";
import type { CombatPoint, CombatTarget } from "./CombatTarget.ts";
import { HealthPool, type DamageResult } from "./HealthPool.ts";

export class CombatDummy implements CombatTarget {
  readonly combatId: string;
  readonly displayName = "Combat Dummy";
  readonly health = new HealthPool(COMBAT_CONFIG.dummyMaxHealth);
  private readonly position: CombatPoint;

  constructor(combatId: string, position: CombatPoint) {
    if (!combatId) throw new Error("Combat Dummy ID is required");
    this.combatId = combatId;
    this.position = Object.freeze({ ...position });
  }

  getCombatPosition(): CombatPoint { return this.position; }
  isCombatAlive(): boolean { return this.health.alive; }
  receiveDamage(amount: number): DamageResult { return this.health.applyDamage(amount); }
}
