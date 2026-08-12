import type { HealthPool } from "../combat/HealthPool.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { PlayerQuickSlot } from "../equipment/PlayerQuickSlot.ts";
import type { HungerPool, ThirstPool } from "../survival/NeedPool.ts";
import type { ColdPool } from "../survival/ColdPool.ts";
import { applyWarmingClear } from "../survival/WarmingConsumables.ts";
import { ITEM_REGISTRY, createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import type { StatusEffectSystem } from "../status/StatusEffectSystem.ts";

export type ConsumableSource = "inventory" | "quick-slot";

export interface ConsumableUseResult {
  readonly accepted: boolean;
  readonly reason: string | null;
  readonly applied: number;
  /** Extra flags for feedback (optional). */
  readonly clearedBleeding?: boolean;
  readonly clearedInfection?: boolean;
  readonly appliedRegen?: boolean;
  /** Environmental cold points removed. */
  readonly warmthCleared?: number;
}

/** Items that stop bleeding / support wound care at full HP. */
const BLEED_TREATMENTS = new Set([
  "bandage",
  "sterile-bandage",
  "bleeding-treatment",
  "first-aid-kit",
]);

/** Clears bite infection (heal or drink). */
const INFECTION_CURES = new Set([
  "herbal-drink",
  "toxic-treatment",
]);

const REGEN_ON_USE = new Set([
  "sterile-bandage",
  "first-aid-kit",
]);

/**
 * Applies consumable effects against production survival pools.
 * Mutates inventory / quick slot only after successful effect commit.
 */
export class ConsumableUseSystem {
  private readonly inventory: PlayerInventory;
  private readonly health: HealthPool;
  private readonly hunger: HungerPool;
  private readonly thirst: ThirstPool;
  private readonly quickSlots: readonly PlayerQuickSlot[];
  private readonly status?: StatusEffectSystem;
  private readonly cold?: ColdPool;

  constructor(
    inventory: PlayerInventory,
    health: HealthPool,
    hunger: HungerPool,
    thirst: ThirstPool,
    quickSlots: readonly PlayerQuickSlot[],
    status?: StatusEffectSystem,
    cold?: ColdPool,
  ) {
    this.inventory = inventory;
    this.health = health;
    this.hunger = hunger;
    this.thirst = thirst;
    this.quickSlots = quickSlots;
    this.status = status;
    this.cold = cold;
  }

  useFromInventory(slotIndex: number, expected?: ItemStack): ConsumableUseResult {
    if (!this.health.alive) return { accepted: false, reason: "defeated", applied: 0 };
    const stack = this.inventory.getSlot(slotIndex).stack;
    if (!stack) return { accepted: false, reason: "empty", applied: 0 };
    if (expected && stack !== expected) return { accepted: false, reason: "stale", applied: 0 };
    const effect = this.applyEffect(stack.itemId);
    if (!effect.accepted) return effect;
    // Consume one: exchange partial quantity.
    if (stack.quantity === 1) {
      this.inventory.exchangeWholeStack(slotIndex, stack, null);
    } else {
      this.inventory.exchangeWholeStack(slotIndex, stack, createItemStack(stack.itemId, stack.quantity - 1));
    }
    return effect;
  }

  useFromQuickSlot(index = 0): ConsumableUseResult {
    if (!this.health.alive) return { accepted: false, reason: "defeated", applied: 0 };
    const quickSlot = this.quickSlots[index] ?? this.quickSlots[0];
    if (!quickSlot) return { accepted: false, reason: "empty", applied: 0 };
    if (quickSlot.cooldown > 0) return { accepted: false, reason: "cooldown", applied: 0 };
    const stack = quickSlot.current;
    if (!stack) return { accepted: false, reason: "empty", applied: 0 };
    const effect = this.applyEffect(stack.itemId);
    if (!effect.accepted) return effect;
    quickSlot.consumeOne();
    quickSlot.setCooldown(0.35);
    return effect;
  }

  private applyEffect(itemId: string): ConsumableUseResult {
    const def = ITEM_REGISTRY.get(itemId);
    const meta = def.consumable;
    if (!meta) return { accepted: false, reason: "not-consumable", applied: 0 };
    if (meta.kind === "heal") {
      const bleeding = this.status?.has("bleeding") ?? false;
      const canTreatBleed = BLEED_TREATMENTS.has(itemId) && bleeding;
      const canCureInfection = INFECTION_CURES.has(itemId) && (this.status?.has("infection") ?? false);
      if (
        meta.rejectWhenFull
        && this.health.currentHealth >= this.health.maxHealth
        && !canTreatBleed
        && !canCureInfection
      ) {
        return { accepted: false, reason: "full-health", applied: 0 };
      }
      const heal = this.health.heal(meta.amount);
      let clearedBleeding = false;
      let clearedInfection = false;
      let appliedRegen = false;
      if (BLEED_TREATMENTS.has(itemId) && this.status) {
        clearedBleeding = this.status.remove("bleeding");
        if (REGEN_ON_USE.has(itemId)) {
          this.status.apply("regeneration");
          appliedRegen = true;
        }
      }
      if (INFECTION_CURES.has(itemId) && this.status) {
        clearedInfection = this.status.remove("infection");
      }
      if (itemId === "pain-relief" && this.status?.has("slow")) {
        this.status.remove("slow");
      }
      if (heal.applied <= 0 && !clearedBleeding && !clearedInfection) {
        return { accepted: false, reason: "no-effect", applied: 0 };
      }
      return Object.freeze({
        accepted: true,
        reason: null,
        applied: heal.applied,
        clearedBleeding,
        clearedInfection,
        appliedRegen,
      });
    }
    if (meta.kind === "food") {
      return this.applyNeedWithWarmth("food", itemId, meta.amount, meta.rejectWhenFull);
    }
    if (meta.kind === "drink") {
      return this.applyNeedWithWarmth("drink", itemId, meta.amount, meta.rejectWhenFull);
    }
    return { accepted: false, reason: "unknown-kind", applied: 0 };
  }

  private applyNeedWithWarmth(
    kind: "food" | "drink",
    itemId: string,
    amount: number,
    rejectWhenFull: boolean,
  ): ConsumableUseResult {
    const pool = kind === "food" ? this.hunger : this.thirst;
    const fullReason = kind === "food" ? "full-hunger" : "full-thirst";
    const coldNow = this.cold?.current ?? 0;
    const warmthCleared = this.cold ? applyWarmingClear(coldNow, itemId) : 0;
    const canWarm = warmthCleared > 0;
    const canCureInfection = INFECTION_CURES.has(itemId) && (this.status?.has("infection") ?? false);

    if (rejectWhenFull && pool.isFull && !canWarm && !canCureInfection) {
      return { accepted: false, reason: fullReason, applied: 0 };
    }

    let applied = 0;
    if (!pool.isFull) {
      applied = pool.restore(amount);
    }
    if (canWarm && this.cold) {
      this.cold.set(coldNow - warmthCleared);
    }
    let clearedInfection = false;
    if (canCureInfection && this.status) {
      clearedInfection = this.status.remove("infection");
    }
    if (applied <= 0 && !canWarm && !clearedInfection) {
      return { accepted: false, reason: "no-effect", applied: 0 };
    }
    return Object.freeze({
      accepted: true,
      reason: null,
      applied: applied > 0 ? applied : (canWarm ? warmthCleared : 1),
      warmthCleared: canWarm ? warmthCleared : undefined,
      clearedInfection: clearedInfection || undefined,
    });
  }
}
