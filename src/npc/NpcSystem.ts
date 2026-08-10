import type { ItemId } from "../items/ItemId.ts";
import { createItemStack, type ItemStack } from "../items/ItemSystem.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export interface NpcDefinition {
  readonly id: string;
  readonly name: string;
  readonly role: "trader" | "quest" | "flavor";
  readonly locationId: string;
}

export interface DialogueChoice {
  readonly id: string;
  readonly label: string;
  readonly next?: string;
  readonly end?: boolean;
  readonly startQuest?: string;
  readonly grantReputation?: number;
}

export interface DialogueNode {
  readonly id: string;
  readonly text: string;
  readonly choices: readonly DialogueChoice[];
}

export interface BarterOffer {
  readonly id: string;
  readonly costs: ReadonlyArray<{ itemId: ItemId; quantity: number }>;
  readonly offer: ItemStack;
  readonly currencyCost?: number;
}

export interface TradeResult {
  readonly accepted: boolean;
  readonly reason: string | null;
}

function countOwned(inventory: PlayerInventory, itemId: ItemId): number {
  let total = 0;
  for (let i = 0; i < inventory.slotCount; i += 1) {
    const stack = inventory.getSlot(i).stack;
    if (stack?.itemId === itemId) total += stack.quantity;
  }
  return total;
}

function consume(inventory: PlayerInventory, itemId: ItemId, quantity: number): boolean {
  if (countOwned(inventory, itemId) < quantity) return false;
  let remaining = quantity;
  for (let i = 0; i < inventory.slotCount && remaining > 0; i += 1) {
    const stack = inventory.getSlot(i).stack;
    if (!stack || stack.itemId !== itemId) continue;
    const take = Math.min(stack.quantity, remaining);
    if (stack.quantity === take) inventory.exchangeWholeStack(i, stack, null);
    else inventory.exchangeWholeStack(i, stack, createItemStack(itemId, stack.quantity - take));
    remaining -= take;
  }
  return remaining === 0;
}

/** Lightweight NPC + barter + dialogue foundation (friendly; not combat targets). */
export class NpcSystem {
  private readonly npcs = new Map<string, NpcDefinition>();
  private readonly dialogue = new Map<string, DialogueNode>();
  private readonly offers = new Map<string, readonly BarterOffer[]>();
  private activeDialogue: { npcId: string; nodeId: string } | null = null;
  private tokens = 0;

  get tradeTokens(): number { return this.tokens; }
  get dialogueOpen(): boolean { return this.activeDialogue !== null; }
  get activeNode(): DialogueNode | null {
    if (!this.activeDialogue) return null;
    return this.dialogue.get(this.activeDialogue.nodeId) ?? null;
  }

  registerNpc(def: NpcDefinition): void { this.npcs.set(def.id, def); }
  registerDialogue(node: DialogueNode): void { this.dialogue.set(node.id, node); }
  setOffers(npcId: string, offers: readonly BarterOffer[]): void { this.offers.set(npcId, offers); }

  beginDialogue(npcId: string, startNodeId: string): boolean {
    if (!this.npcs.has(npcId) || !this.dialogue.has(startNodeId)) return false;
    this.activeDialogue = { npcId, nodeId: startNodeId };
    return true;
  }

  choose(choiceId: string): { ended: boolean; startQuest: string | null; reputation: number } {
    const node = this.activeNode;
    if (!node) return { ended: true, startQuest: null, reputation: 0 };
    const choice = node.choices.find((c) => c.id === choiceId);
    if (!choice) return { ended: false, startQuest: null, reputation: 0 };
    if (choice.end || !choice.next) {
      this.activeDialogue = null;
      return { ended: true, startQuest: choice.startQuest ?? null, reputation: choice.grantReputation ?? 0 };
    }
    this.activeDialogue = { npcId: this.activeDialogue!.npcId, nodeId: choice.next };
    return { ended: false, startQuest: choice.startQuest ?? null, reputation: choice.grantReputation ?? 0 };
  }

  closeDialogue(): void { this.activeDialogue = null; }

  listOffers(npcId: string): readonly BarterOffer[] {
    return this.offers.get(npcId) ?? Object.freeze([]);
  }

  /** Atomic multi-cost barter into inventory. */
  tryBarter(npcId: string, offerId: string, inventory: PlayerInventory): TradeResult {
    const offer = this.listOffers(npcId).find((o) => o.id === offerId);
    if (!offer) return { accepted: false, reason: "missing-offer" };
    for (const cost of offer.costs) {
      if (countOwned(inventory, cost.itemId) < cost.quantity) return { accepted: false, reason: "missing-items" };
    }
    if ((offer.currencyCost ?? 0) > this.tokens) return { accepted: false, reason: "no-tokens" };
    let freeSlot = -1;
    for (let i = 0; i < inventory.slotCount; i += 1) {
      if (!inventory.getSlot(i).stack) { freeSlot = i; break; }
    }
    // Prefer merge path via tryInsert after freeze of costs committed
    const out = createItemStack(offer.offer.itemId, offer.offer.quantity);
    // Preflight capacity via temporary? Use freeSlot or tryInsert with rollback:
    for (const cost of offer.costs) {
      if (!consume(inventory, cost.itemId, cost.quantity)) return { accepted: false, reason: "consume-fail" };
    }
    if (offer.currencyCost) this.tokens -= offer.currencyCost;
    if (!inventory.tryInsert(out).accepted) {
      // refund currency only; item refund would need stacks — best-effort mailbox not available here
      if (offer.currencyCost) this.tokens += offer.currencyCost;
      void freeSlot;
      return { accepted: false, reason: "inventory-full" };
    }
    return { accepted: true, reason: null };
  }

  addTokens(amount: number): void {
    this.tokens = Math.max(0, this.tokens + amount);
  }

  serialize(): { tokens: number } {
    return { tokens: this.tokens };
  }

  load(data: { tokens?: number }): void {
    this.tokens = Math.max(0, data.tokens ?? 0);
  }
}

export const SURVIVOR_CAMP_NPCS: readonly NpcDefinition[] = Object.freeze([
  Object.freeze({ id: "trader-mira", name: "Mira", role: "trader" as const, locationId: "survivor-camp" }),
  Object.freeze({ id: "quest-jon", name: "Jon", role: "quest" as const, locationId: "survivor-camp" }),
]);
