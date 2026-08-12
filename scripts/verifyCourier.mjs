/**
 * Courier package grant + Mira delivery (domain).
 */
import assert from "node:assert/strict";
import { NpcSystem, SURVIVOR_CAMP_NPCS } from "../src/npc/NpcSystem.ts";
import {
  COURIER_PACKAGE_ID,
  COURIER_QUEST_ID,
  miraDialogueForInventory,
  tryDeliverCourierPackage,
  tryGrantCourierPackage,
} from "../src/npc/CourierRun.ts";
import { defaultDialogueNode } from "../src/npc/NpcHub.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

const inv = new PlayerInventory();
assert.equal(miraDialogueForInventory(inv), "mira-hello");
assert.equal(defaultDialogueNode("trader-mira", inv), "mira-hello");

const grant = tryGrantCourierPackage(inv);
assert.equal(grant.ok, true);
assert.ok(inv.findFirstSlotByItemId(COURIER_PACKAGE_ID) !== null);
assert.equal(miraDialogueForInventory(inv), "mira-courier");
assert.equal(defaultDialogueNode("trader-mira", inv), "mira-courier");
assert.equal(tryGrantCourierPackage(inv).reason, "already-carrying");

const npcs = new NpcSystem();
for (const n of SURVIVOR_CAMP_NPCS) npcs.registerNpc(n);
npcs.registerDialogue(Object.freeze({
  id: "jon-hello",
  text: "Work?",
  choices: Object.freeze([
    Object.freeze({
      id: "courier",
      label: "Courier job",
      next: "jon-courier",
      startQuest: COURIER_QUEST_ID,
      grantItem: COURIER_PACKAGE_ID,
    }),
  ]),
}));
npcs.registerDialogue(Object.freeze({
  id: "jon-courier",
  text: "Take it to Mira.",
  choices: Object.freeze([Object.freeze({ id: "ok", label: "On it.", end: true })]),
}));
npcs.registerDialogue(Object.freeze({
  id: "mira-courier",
  text: "Package?",
  choices: Object.freeze([
    Object.freeze({
      id: "deliver",
      label: "Deliver",
      end: true,
      consumeItem: COURIER_PACKAGE_ID,
      completeQuest: COURIER_QUEST_ID,
      grantReputation: 8,
      grantTokens: 2,
    }),
  ]),
}));

// Fresh inv for dialogue grant path simulation
const inv2 = new PlayerInventory();
assert.equal(npcs.beginDialogue("quest-jon", "jon-hello"), true);
const peek = npcs.peekChoice("courier");
assert.equal(peek?.grantItem, COURIER_PACKAGE_ID);
assert.equal(tryGrantCourierPackage(inv2).ok, true);
const step = npcs.choose("courier");
assert.equal(step.startQuest, COURIER_QUEST_ID);
assert.equal(step.grantItem, COURIER_PACKAGE_ID);
assert.equal(step.ended, false);

assert.equal(npcs.beginDialogue("trader-mira", "mira-courier"), true);
const del = npcs.choose("deliver");
assert.equal(del.consumeItem, COURIER_PACKAGE_ID);
assert.equal(del.completeQuest, COURIER_QUEST_ID);
assert.equal(del.grantTokens, 2);
assert.equal(tryDeliverCourierPackage(inv2).ok, true);
assert.equal(inv2.findFirstSlotByItemId(COURIER_PACKAGE_ID), null);
assert.equal(tryDeliverCourierPackage(inv2).ok, false);

// sanity: createItemStack still works for package
assert.equal(createItemStack(COURIER_PACKAGE_ID, 1).itemId, COURIER_PACKAGE_ID);

console.log("ok courier package delivery domain");
