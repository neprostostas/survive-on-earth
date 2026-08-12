/**
 * NPC dialogue + barter domain.
 */
import assert from "node:assert/strict";
import { NpcSystem, SURVIVOR_CAMP_NPCS } from "../src/npc/NpcSystem.ts";
import {
  defaultDialogueNode,
  npcIdFromInteractable,
  npcInteractableId,
  npcsAtLocation,
} from "../src/npc/NpcHub.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(npcInteractableId("quest-jon"), "npc-quest-jon");
assert.equal(npcIdFromInteractable("npc-quest-jon"), "quest-jon");
assert.equal(npcsAtLocation(SURVIVOR_CAMP_NPCS, "survivor-camp").length, 2);
assert.equal(defaultDialogueNode("trader-mira"), "mira-hello");

const npcs = new NpcSystem();
for (const n of SURVIVOR_CAMP_NPCS) npcs.registerNpc(n);
npcs.registerDialogue(Object.freeze({
  id: "jon-hello",
  text: "Need fiber?",
  choices: Object.freeze([
    Object.freeze({ id: "accept", label: "I'll help.", next: "jon-accept", startQuest: "collect-pine-logs", grantReputation: 5 }),
    Object.freeze({ id: "leave", label: "Later.", end: true }),
  ]),
}));
npcs.registerDialogue(Object.freeze({
  id: "jon-accept",
  text: "Good.",
  choices: Object.freeze([Object.freeze({ id: "ok", label: "Understood.", end: true })]),
}));
npcs.registerDialogue(Object.freeze({
  id: "mira-hello",
  text: "Trading today.",
  choices: Object.freeze([
    Object.freeze({ id: "browse", label: "Show wares.", end: true }),
    Object.freeze({ id: "leave", label: "Later.", end: true }),
  ]),
}));
npcs.setOffers("trader-mira", Object.freeze([
  Object.freeze({
    id: "bandage-trade",
    costs: Object.freeze([{ itemId: "plant-fiber", quantity: 6 }]),
    offer: createItemStack("bandage", 2),
  }),
]));

assert.equal(npcs.beginDialogue("quest-jon", "jon-hello"), true);
assert.ok(npcs.activeNode);
const step = npcs.choose("accept");
assert.equal(step.ended, false);
assert.equal(step.startQuest, "collect-pine-logs");
assert.equal(step.reputation, 5);
assert.equal(npcs.activeNode?.id, "jon-accept");
assert.equal(npcs.choose("ok").ended, true);
assert.equal(npcs.dialogueOpen, false);

const inv = new PlayerInventory();
assert.equal(inv.tryInsert(createItemStack("plant-fiber", 6)).accepted, true);
const ok = npcs.tryBarter("trader-mira", "bandage-trade", inv);
assert.equal(ok.accepted, true, ok.reason ?? "trade");
assert.ok(inv.findFirstSlotByItemId("bandage") !== null);
assert.equal(inv.findFirstSlotByItemId("plant-fiber"), null);

const miss = npcs.tryBarter("trader-mira", "bandage-trade", inv);
assert.equal(miss.accepted, false);

console.log("ok npc dialogue + barter domain");
