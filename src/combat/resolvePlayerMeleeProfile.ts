import { ITEM_REGISTRY, stackDurability, type ItemStack } from "../items/ItemSystem.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";
import {
  createMeleeProfile,
  type MeleeCombatProfile,
  UNARMED_MELEE_PROFILE,
} from "./MeleeCombatProfile.ts";

/** Resolve live combat profile from Weapon Slot only. */
export function resolvePlayerMeleeProfile(weaponSlot: PlayerWeaponSlot): MeleeCombatProfile {
  const stack = weaponSlot.current;
  if (!stack) return UNARMED_MELEE_PROFILE;
  const definition = ITEM_REGISTRY.get(stack.itemId);
  const melee = definition.meleeCombat;
  if (!melee) return UNARMED_MELEE_PROFILE;
  if (stack.itemId === "hatchet") return createMeleeProfile("hatchet", melee.damage, melee.attacksPerSecond);
  if (stack.itemId === "pickaxe") return createMeleeProfile("pickaxe", melee.damage, melee.attacksPerSecond);
  return UNARMED_MELEE_PROFILE;
}

export function describeWeaponStack(stack: ItemStack | null): {
  readonly name: string;
  readonly durability: string;
  readonly damage: number;
  readonly attacksPerSecond: number;
} {
  if (!stack) {
    return Object.freeze({
      name: "Fists",
      durability: "none",
      damage: UNARMED_MELEE_PROFILE.damage,
      attacksPerSecond: UNARMED_MELEE_PROFILE.attacksPerSecond,
    });
  }
  const definition = ITEM_REGISTRY.get(stack.itemId);
  const melee = definition.meleeCombat;
  const durability = stackDurability(stack);
  return Object.freeze({
    name: definition.displayName,
    durability: durability ? `${durability.current} / ${durability.max}` : "none",
    damage: melee?.damage ?? UNARMED_MELEE_PROFILE.damage,
    attacksPerSecond: melee?.attacksPerSecond ?? UNARMED_MELEE_PROFILE.attacksPerSecond,
  });
}
