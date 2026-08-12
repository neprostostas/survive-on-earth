import { createItemStack, expandToLegalStacks, isStackMergeable, type ItemStack } from "../items/ItemSystem.ts";
import { ITEM_REGISTRY } from "../items/ItemSystem.ts";
import type { InteractionPoint } from "../interaction/InteractionTypes.ts";
import type { Interactable } from "../interaction/Interactable.ts";

/** Session world container — chests, crates, corpses. */
export type ContainerAccessMode = "take-all" | "storage";

export class WorldContainerInventory {
  readonly id: string;
  readonly title: string;
  private readonly capacity: number;
  private readonly stacks: Array<ItemStack | null>;

  constructor(id: string, title: string, capacity: number, initial: readonly ItemStack[] = []) {
    this.id = id;
    this.title = title;
    this.capacity = capacity;
    this.stacks = Array.from({ length: capacity }, () => null);
    let next = 0;
    for (const stack of initial) {
      if (next >= capacity) break;
      this.stacks[next] = createItemStack(
        stack.itemId,
        stack.quantity,
        stack.currentDurability !== undefined ? { currentDurability: stack.currentDurability } : undefined,
      );
      next += 1;
    }
  }

  get slotCount(): number { return this.capacity; }

  getSlot(index: number): ItemStack | null {
    if (!Number.isInteger(index) || index < 0 || index >= this.capacity) throw new RangeError(`container slot ${index}`);
    return this.stacks[index] ?? null;
  }

  getSlots(): readonly { index: number; stack: ItemStack | null }[] {
    return Object.freeze(this.stacks.map((stack, index) => Object.freeze({ index, stack })));
  }

  /** Take whole stack out of container (identity preserved). */
  take(index: number): ItemStack | null {
    const stack = this.getSlot(index);
    if (!stack) return null;
    this.stacks[index] = null;
    return stack;
  }

  place(index: number, stack: ItemStack | null): boolean {
    if (!Number.isInteger(index) || index < 0 || index >= this.capacity) return false;
    if (stack) ITEM_REGISTRY.get(stack.itemId);
    this.stacks[index] = stack;
    return true;
  }

  tryInsert(stack: ItemStack): boolean {
    let chunks: readonly ItemStack[];
    try {
      chunks = expandToLegalStacks(stack);
    } catch {
      return false;
    }
    for (const chunk of chunks) {
      if (!this.insertLegalChunk(chunk)) return false;
    }
    return true;
  }

  private insertLegalChunk(chunk: ItemStack): boolean {
    let remaining: ItemStack | null = chunk;
    if (isStackMergeable(chunk)) {
      for (let i = 0; i < this.capacity && remaining; i += 1) {
        const existing = this.stacks[i];
        if (!existing || existing.itemId !== remaining.itemId || !isStackMergeable(existing)) continue;
        const max = ITEM_REGISTRY.get(remaining.itemId).maxStack;
        if (existing.quantity >= max) continue;
        const room = max - existing.quantity;
        const take = Math.min(room, remaining.quantity);
        this.stacks[i] = createItemStack(remaining.itemId, existing.quantity + take);
        remaining = take === remaining.quantity
          ? null
          : createItemStack(remaining.itemId, remaining.quantity - take);
      }
    }
    if (!remaining) return true;
    for (let i = 0; i < this.capacity; i += 1) {
      if (this.stacks[i] !== null) continue;
      this.stacks[i] = remaining;
      return true;
    }
    return false;
  }
}

export class WorldContainerEntity implements Interactable {
  readonly interactionId: string;
  readonly interactionType = "container";
  readonly accessMode: ContainerAccessMode;
  private readonly position: InteractionPoint;
  readonly inventory: WorldContainerInventory;
  private active = true;

  constructor(
    id: string,
    title: string,
    position: InteractionPoint,
    capacity: number,
    initial?: readonly ItemStack[],
    accessMode: ContainerAccessMode = "take-all",
  ) {
    this.interactionId = id;
    this.accessMode = accessMode;
    this.position = Object.freeze({ ...position });
    this.inventory = new WorldContainerInventory(id, title, capacity, initial ?? []);
  }

  isInteractionEnabled(): boolean { return this.active; }
  getInteractionPosition(): InteractionPoint { return this.position; }
  getInteractionRadius(): number { return 0.85; }
  tryInteract(): boolean { return this.active; }
  setActive(active: boolean): void { this.active = active; }
}
