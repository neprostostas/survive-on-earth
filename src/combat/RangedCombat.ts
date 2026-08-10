import type { ItemId } from "../items/ItemId.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot.ts";

export interface RangedWeaponMeta {
  readonly ammoItemId: ItemId;
  readonly magazineSize: number;
  readonly damage: number;
  readonly range: number;
  readonly fireCooldown: number;
  readonly reloadTime: number;
}

type ReadonlyPartialRecord<K extends string, V> = { readonly [P in K]?: V };

/** Item-linked ranged metadata (original firearm foundation). */
export const RANGED_WEAPON_META: ReadonlyPartialRecord<ItemId, RangedWeaponMeta> = Object.freeze({
  "basic-pistol": Object.freeze({
    ammoItemId: "pistol-ammo" as const,
    magazineSize: 8,
    damage: 14,
    range: 6.5,
    fireCooldown: 0.35,
    reloadTime: 1.4,
  }),
});

export interface RangedWeaponState {
  mag: number;
  cooldown: number;
  reloading: number;
}

/**
 * Minimal hitscan/ranged foundation on top of PlayerWeaponSlot.
 * Magazine state is session-owned (not on ItemStack) for the active weapon.
 */
export class RangedCombatSystem {
  private state: RangedWeaponState = { mag: 0, cooldown: 0, reloading: 0 };

  constructor(
    private readonly inventory: PlayerInventory,
    private readonly weaponSlot: PlayerWeaponSlot,
  ) {}

  get meta(): RangedWeaponMeta | null {
    const stack = this.weaponSlot.current;
    if (!stack) return null;
    return RANGED_WEAPON_META[stack.itemId] ?? null;
  }

  get magazine(): number { return this.state.mag; }
  get isReloading(): boolean { return this.state.reloading > 0; }
  get fireReady(): boolean { return this.state.cooldown <= 0 && this.state.reloading <= 0 && this.state.mag > 0; }

  onWeaponChanged(): void {
    const meta = this.meta;
    this.state = { mag: meta ? 0 : 0, cooldown: 0, reloading: 0 };
  }

  tick(delta: number): void {
    this.state.cooldown = Math.max(0, this.state.cooldown - delta);
    if (this.state.reloading > 0) {
      this.state.reloading = Math.max(0, this.state.reloading - delta);
    }
  }

  tryReload(): { accepted: boolean; reason: string | null } {
    const meta = this.meta;
    if (!meta) return { accepted: false, reason: "not-ranged" };
    if (this.state.reloading > 0) return { accepted: false, reason: "busy" };
    if (this.state.mag >= meta.magazineSize) return { accepted: false, reason: "full" };
    const need = meta.magazineSize - this.state.mag;
    const taken = this.consumeAmmoFromInventory(meta.ammoItemId, need);
    if (taken <= 0) return { accepted: false, reason: "no-ammo" };
    this.state.mag += taken;
    this.state.reloading = meta.reloadTime;
    return { accepted: true, reason: null };
  }

  tryFire(): { accepted: boolean; damage: number; range: number; reason: string | null } {
    const meta = this.meta;
    if (!meta) return { accepted: false, damage: 0, range: 0, reason: "not-ranged" };
    if (this.state.reloading > 0) return { accepted: false, damage: 0, range: 0, reason: "reloading" };
    if (this.state.cooldown > 0) return { accepted: false, damage: 0, range: 0, reason: "cooldown" };
    if (this.state.mag < 1) return { accepted: false, damage: 0, range: 0, reason: "empty" };
    this.state.mag -= 1;
    this.state.cooldown = meta.fireCooldown;
    return { accepted: true, damage: meta.damage, range: meta.range, reason: null };
  }

  private consumeAmmoFromInventory(ammoId: ItemId, amount: number): number {
    let remaining = amount;
    let consumed = 0;
    for (let i = 0; i < this.inventory.slotCount && remaining > 0; i += 1) {
      const stack = this.inventory.getSlot(i).stack;
      if (!stack || stack.itemId !== ammoId) continue;
      const take = Math.min(stack.quantity, remaining);
      if (stack.quantity === take) {
        this.inventory.exchangeWholeStack(i, stack, null);
      } else {
        const next: ItemStack = Object.freeze({ itemId: stack.itemId, quantity: stack.quantity - take });
        this.inventory.exchangeWholeStack(i, stack, next);
      }
      consumed += take;
      remaining -= take;
    }
    // validate ammo exists in registry
    ITEM_REGISTRY.get(ammoId);
    return consumed;
  }
}
