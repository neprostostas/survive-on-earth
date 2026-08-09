/** LDOE-style armor constant used as Armor / (Armor + C). */
export const ARMOR_DAMAGE_CONSTANT = 50 / 3;

export interface ArmorMitigationResult {
  readonly rawDamage: number;
  readonly armorPoints: number;
  readonly damageReduction: number;
  readonly finalDamage: number;
}

/**
 * Pure LDOE armor mitigation:
 * DamageReduction = Armor / (Armor + 50/3)
 * finalDamage = round(rawDamage × (1 - DamageReduction))
 */
export function calculateArmorMitigatedDamage(rawDamage: number, armorPoints: number): ArmorMitigationResult {
  if (!Number.isFinite(rawDamage) || rawDamage < 0) throw new RangeError(`Invalid raw damage: ${rawDamage}`);
  if (!Number.isFinite(armorPoints) || armorPoints < 0) throw new RangeError(`Invalid armor points: ${armorPoints}`);

  const damageReduction = armorPoints <= 0 ? 0 : armorPoints / (armorPoints + ARMOR_DAMAGE_CONSTANT);
  const finalDamage = Math.round(rawDamage * (1 - damageReduction));

  return Object.freeze({
    rawDamage,
    armorPoints,
    damageReduction,
    finalDamage,
  });
}
