/**
 * NPC camp hub helpers (pure).
 */
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";
import { miraDialogueForInventory } from "./CourierRun.ts";
import {
  CARAVAN_DIALOGUE_ID,
  isEventTraderNpcId,
} from "./EventCaravan.ts";
import type { NpcDefinition } from "./NpcSystem.ts";

export function npcInteractableId(npcId: string): string {
  return `npc-${npcId}`;
}

export function npcIdFromInteractable(interactionId: string): string | null {
  if (!interactionId.startsWith("npc-")) return null;
  return interactionId.slice("npc-".length) || null;
}

export function npcsAtLocation(
  all: readonly NpcDefinition[],
  locationId: string,
): readonly NpcDefinition[] {
  return Object.freeze(all.filter((n) => n.locationId === locationId));
}

/** Starter dialogue node id per NPC (Mira switches when carrying the courier package). */
export function defaultDialogueNode(
  npcId: string,
  inventory?: PlayerInventory | null,
): string | null {
  if (npcId === "quest-jon") return "jon-hello";
  if (npcId === "trader-mira") {
    return inventory ? miraDialogueForInventory(inventory) : "mira-hello";
  }
  if (isEventTraderNpcId(npcId)) return CARAVAN_DIALOGUE_ID;
  return null;
}

/** Camp layout offsets from origin for interactables. */
export function npcCampOffset(npcId: string): { x: number; z: number } {
  if (npcId === "trader-mira") return Object.freeze({ x: 2.2, z: 1.4 });
  if (npcId === "quest-jon") return Object.freeze({ x: -1.8, z: 2.0 });
  if (isEventTraderNpcId(npcId)) return Object.freeze({ x: 1.6, z: -1.2 });
  return Object.freeze({ x: 0, z: 2 });
}
