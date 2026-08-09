import type { PlayerEquipment } from "../equipment/PlayerEquipment.ts";
import { calculateArmorMitigatedDamage } from "./ArmorMitigation.ts";
import type { HealthPool } from "./HealthPool.ts";

export interface PlayerIncomingDamageResult {
  readonly rawDamage: number;
  readonly armor: number;
  readonly damageReduction: number;
  readonly finalDamage: number;
  readonly previousHealth: number;
  readonly currentHealth: number;
  readonly becameDefeated: boolean;
}

/**
 * Player-side incoming damage boundary: live equipment armor → mitigation → HealthPool.
 * Does not cache armor; each call reads PlayerEquipment.totalArmor at resolution time.
 */
export class PlayerDamageResolver {
  private readonly health: HealthPool;
  private readonly equipment: PlayerEquipment;
  private latest: PlayerIncomingDamageResult | null = null;

  constructor(health: HealthPool, equipment: PlayerEquipment) {
    this.health = health;
    this.equipment = equipment;
  }

  get lastResult(): PlayerIncomingDamageResult | null { return this.latest; }

  applyRawDamage(rawDamage: number): PlayerIncomingDamageResult {
    if (!Number.isFinite(rawDamage) || rawDamage < 0) throw new RangeError(`Invalid raw damage: ${rawDamage}`);

    const armor = this.equipment.totalArmor;
    const mitigation = calculateArmorMitigatedDamage(rawDamage, armor);
    const previousHealth = this.health.currentHealth;

    if (!this.health.alive || mitigation.finalDamage <= 0) {
      const result = Object.freeze({
        rawDamage,
        armor,
        damageReduction: mitigation.damageReduction,
        finalDamage: this.health.alive ? mitigation.finalDamage : 0,
        previousHealth,
        currentHealth: previousHealth,
        becameDefeated: false,
      });
      this.latest = result;
      return result;
    }

    const healthResult = this.health.applyDamage(mitigation.finalDamage);
    const result = Object.freeze({
      rawDamage,
      armor,
      damageReduction: mitigation.damageReduction,
      finalDamage: mitigation.finalDamage,
      previousHealth: healthResult.before,
      currentHealth: healthResult.current,
      becameDefeated: healthResult.becameDead,
    });
    this.latest = result;
    return result;
  }
}
