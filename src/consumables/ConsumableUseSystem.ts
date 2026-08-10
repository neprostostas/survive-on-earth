import type { HealthPool } from "../combat/HealthPool.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import type { PlayerQuickSlot } from "../equipment/PlayerQuickSlot.ts";
import type { HungerPool, ThirstPool } from "../survival/NeedPool.ts";
import { ITEM_REGISTRY, type ItemStack } from "../items/ItemSystem.ts";

export type ConsumableSource = "inventory" | "quick-slot";

export interface ConsumableUseResult {
  readonly accepted: boolean;
  readonly reason: string | null;
  readonly applied: number;
}

/**
 * Applies consumable effects against production survival pools.
 * Mutates inventory / quick slot only after successful effect commit.
 */
export class ConsumableUseSystem {
  constructor(
    private readonly inventory: PlayerInventory,
    private readonly health: HealthPool,
    private readonly hunger: HungerPool,
    private readonly thirst: ThirstPool,
    private readonly quickSlot: PlayerQuickSlot,
  ) {}

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
      this.inventory.exchangeWholeStack(slotIndex, stack, Object.freeze({
        itemId: stack.itemId,
        quantity: stack.quantity - 1,
      }));
    }
    return effect;
  }

  useFromQuickSlot(): ConsumableUseResult {
    if (!this.health.alive) return { accepted: false, reason: "defeated", applied: 0 };
    if (this.quickSlot.cooldown > 0) return { accepted: false, reason: "cooldown", applied: 0 };
    const stack = this.quickSlot.current;
    if (!stack) return { accepted: false, reason: "empty", applied: 0 };
    const effect = this.applyEffect(stack.itemId);
    if (!effect.accepted) return effect;
    this.quickSlot.consumeOne();
    this.quickSlot.setCooldown(0.35);
    return effect;
  }

  private applyEffect(itemId: string): ConsumableUseResult {
    const def = ITEM_REGISTRY.get(itemId);
    const meta = def.consumable;
    if (!meta) return { accepted: false, reason: "not-consumable", applied: 0 };
    if (meta.kind === "heal") {
      if (meta.rejectWhenFull && this.health.currentHealth >= this.health.maxHealth) {
        return { accepted: false, reason: "full-health", applied: 0 };
      }
      const heal = this.health.heal(meta.amount);
      if (heal.applied <= 0) return { accepted: false, reason: "no-effect", applied: 0 };
      return { accepted: true, reason: null, applied: heal.applied };
    }
    if (meta.kind === "food") {
      if (meta.rejectWhenFull && this.hunger.isFull) return { accepted: false, reason: "full-hunger", applied: 0 };
      const applied = this.hunger.restore(meta.amount);
      if (applied <= 0) return { accepted: false, reason: "no-effect", applied: 0 };
      return { accepted: true, reason: null, applied };
    }
    if (meta.kind === "drink") {
      if (meta.rejectWhenFull && this.thirst.isFull) return { accepted: false, reason: "full-thirst", applied: 0 };
      const applied = this.thirst.restore(meta.amount);
      if (applied <= 0) return { accepted: false, reason: "no-effect", applied: 0 };
      return { accepted: true, reason: null, applied };
    }
    return { accepted: false, reason: "unknown-kind", applied: 0 };
  }
}
