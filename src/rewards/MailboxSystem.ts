import type { ItemStack } from "../items/ItemSystem.ts";
import { createItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { WorldContainerInventory } from "../containers/WorldContainer.ts";

/**
 * Field Mailbox at Home — overflow rewards when inventory is full.
 */
export class MailboxSystem {
  private readonly box = new WorldContainerInventory("home-mailbox", "Field Mailbox", 20);

  get inventory(): WorldContainerInventory { return this.box; }

  /** Try inventory first, overflow to mailbox. Atomic preference order. */
  deliver(stack: ItemStack, inventory: PlayerInventory): { destination: "inventory" | "mailbox" | "failed" } {
    if (inventory.tryInsert(stack).accepted) return { destination: "inventory" };
    if (this.box.tryInsert(stack)) return { destination: "mailbox" };
    return { destination: "failed" };
  }

  claimAll(inventory: PlayerInventory): number {
    let moved = 0;
    for (let i = 0; i < this.box.slotCount; i += 1) {
      const stack = this.box.take(i);
      if (!stack) continue;
      if (inventory.tryInsert(stack).accepted) moved += 1;
      else {
        this.box.place(i, stack);
        break;
      }
    }
    return moved;
  }

  serialize(): readonly { itemId: string; quantity: number; currentDurability?: number }[] {
    return this.box.getSlots()
      .filter((s) => s.stack)
      .map((s) => ({
        itemId: s.stack!.itemId,
        quantity: s.stack!.quantity,
        currentDurability: s.stack!.currentDurability,
      }));
  }

  load(rows: readonly { itemId: string; quantity: number; currentDurability?: number }[]): void {
    for (let i = 0; i < this.box.slotCount; i += 1) this.box.place(i, null);
    for (const row of rows) {
      this.box.tryInsert(createItemStack(
        row.itemId as ItemStack["itemId"],
        row.quantity,
        row.currentDurability !== undefined ? { currentDurability: row.currentDurability } : undefined,
      ));
    }
  }
}
