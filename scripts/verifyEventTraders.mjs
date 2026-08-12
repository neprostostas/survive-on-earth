/**
 * Event trader caravan domain.
 */
import assert from "node:assert/strict";
import {
  caravanOffersFor,
  eventTraderNpcId,
  isBarterEventKind,
  isEventTraderNpcId,
} from "../src/npc/EventCaravan.ts";
import { WorldEventDirector } from "../src/world/WorldEventDirector.ts";
import { eventAnchorLocation, eventMapPins, unclaimedEventAt } from "../src/world/EventAnchors.ts";
import { NpcSystem } from "../src/npc/NpcSystem.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(isBarterEventKind("trader"), true);
assert.equal(isBarterEventKind("supply-drop"), false);
assert.equal(eventTraderNpcId("evt-3"), "event-trader-evt-3");
assert.equal(isEventTraderNpcId("event-trader-evt-3"), true);

const a = caravanOffersFor("trader", 42);
const b = caravanOffersFor("trader", 42);
assert.equal(a.length, 3);
assert.deepEqual(a.map((o) => o.id), b.map((o) => o.id));
assert.notDeepEqual(
  a.map((o) => o.id),
  caravanOffersFor("trader", 99).map((o) => o.id),
);

const rare = caravanOffersFor("rare-trader", 7);
assert.ok(rare.length >= 3);
assert.ok(rare.some((o) => o.offer.itemId.startsWith("blueprint-") || o.offer.itemId === "power-cell" || o.offer.itemId === "servo-assembly" || o.offer.itemId === "hardened-alloy" || o.offer.itemId === "pistol-ammo" || o.offer.itemId === "first-aid-kit"));

const dir = new WorldEventDirector();
const evt = dir.spawnRandom(1, "trader");
assert.ok(evt);
const loc = eventAnchorLocation(evt);
assert.equal(unclaimedEventAt(dir.events, loc)?.id, evt.id);

const claim = dir.claim(evt.id);
assert.equal(claim.accepted, true);
assert.equal(eventMapPins(dir.events).some((p) => p.eventId === evt.id), false);
// Claimed barter stays until expiry (not removed on claim).
assert.equal(dir.events.some((e) => e.id === evt.id && e.claimed), true);
dir.tick(1.01);
assert.equal(dir.events.some((e) => e.id === evt.id), true);
dir.tick(evt.expiresAtWorldDay + 0.01);
assert.equal(dir.events.some((e) => e.id === evt.id), false);

// Loot events still drop on claim via tick.
const drop = dir.spawnRandom(2, "supply-drop");
assert.ok(drop);
dir.claim(drop.id);
dir.tick(2.01);
assert.equal(dir.events.some((e) => e.id === drop.id), false);

const npcId = eventTraderNpcId(evt.id);
const npcs = new NpcSystem();
npcs.registerNpc(Object.freeze({
  id: npcId,
  name: "Wayfarer Trader",
  role: "trader",
  locationId: loc,
}));
npcs.setOffers(npcId, caravanOffersFor("trader", evt.seed));
const inv = new PlayerInventory();
inv.tryInsert(createItemStack("plant-fiber", 20));
inv.tryInsert(createItemStack("scrap-metal", 20));
inv.tryInsert(createItemStack("trade-token", 2));
const offer = npcs.listOffers(npcId)[0];
assert.ok(offer);
const trade = npcs.tryBarter(npcId, offer.id, inv);
assert.equal(trade.accepted, true, trade.reason ?? "trade");

npcs.unregisterNpc(npcId);
assert.equal(npcs.getNpc(npcId), null);
assert.equal(npcs.listOffers(npcId).length, 0);

console.log("ok event trader caravans");
