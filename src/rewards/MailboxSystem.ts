import type { ItemStack } from "../items/ItemSystem.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { WorldContainerEntity } from "../containers/WorldContainer.ts";

/** Matches HOME_HOUSE_ORIGIN in TestLocation (x: 8, z: -10). */
const MAILBOX_POS = Object.freeze({ x: 8 + 2.4, y: 0, z: -10 + 1.6 });

/**
 * Field Mailbox at Home — overflow rewards when inventory is full.
 * Interact as storage chest beside the house.
 */
export class MailboxSystem {
  readonly entity: WorldContainerEntity;

  constructor() {
    this.entity = new WorldContainerEntity(
      "home-mailbox",
      "Field Mailbox",
      MAILBOX_POS,
      20,
      [],
      "storage",
    );
  }

  get inventory() {
    return this.entity.inventory;
  }

  /** Try inventory first, overflow to mailbox. Atomic preference order. */
  deliver(stack: ItemStack, inventory: PlayerInventory): { destination: "inventory" | "mailbox" | "failed" } {
    if (inventory.tryInsert(stack).accepted) return { destination: "inventory" };
    if (this.entity.inventory.tryInsert(stack)) return { destination: "mailbox" };
    return { destination: "failed" };
  }

  claimAll(inventory: PlayerInventory): number {
    let moved = 0;
    for (let i = 0; i < this.entity.inventory.slotCount; i += 1) {
      const stack = this.entity.inventory.take(i);
      if (!stack) continue;
      if (inventory.tryInsert(stack).accepted) moved += 1;
      else {
        this.entity.inventory.place(i, stack);
        break;
      }
    }
    return moved;
  }

  occupiedCount(): number {
    let n = 0;
    for (let i = 0; i < this.entity.inventory.slotCount; i += 1) {
      if (this.entity.inventory.getSlot(i)) n += 1;
    }
    return n;
  }

  serialize(): readonly { itemId: string; quantity: number; currentDurability?: number }[] {
    return this.entity.inventory.getSlots()
      .filter((s) => s.stack)
      .map((s) => ({
        itemId: s.stack!.itemId,
        quantity: s.stack!.quantity,
        currentDurability: s.stack!.currentDurability,
      }));
  }

  load(rows: readonly { itemId: string; quantity: number; currentDurability?: number }[]): void {
    for (let i = 0; i < this.entity.inventory.slotCount; i += 1) this.entity.inventory.place(i, null);
    for (const row of rows) {
      this.entity.inventory.tryInsert(createItemStack(
        row.itemId as ItemStack["itemId"],
        row.quantity,
        row.currentDurability !== undefined ? { currentDurability: row.currentDurability } : undefined,
      ));
    }
  }
}
