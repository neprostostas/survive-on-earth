/**
 * World-event location anchors + map pins (domain).
 */
import assert from "node:assert/strict";
import {
  EVENT_ANCHOR_POOL,
  eventAnchorLocation,
  eventAnchorPoolFor,
  eventMapPins,
  unclaimedEventAt,
} from "../src/world/EventAnchors.ts";
import { WorldEventDirector } from "../src/world/WorldEventDirector.ts";

assert.ok(EVENT_ANCHOR_POOL.includes("pine-woods"));
assert.ok(eventAnchorPoolFor("medical-camp").includes("abandoned-hospital"));
assert.equal(
  eventAnchorLocation({ kind: "supply-drop", seed: 5 }),
  EVENT_ANCHOR_POOL[5 % EVENT_ANCHOR_POOL.length],
);

const dir = new WorldEventDirector();
const a = dir.spawnRandom(1, "supply-drop");
const b = dir.spawnRandom(1, "medical-camp");
assert.ok(a);
assert.ok(b);

const locA = eventAnchorLocation(a);
assert.equal(unclaimedEventAt(dir.events, locA)?.id, a.id);

const medLoc = eventAnchorLocation(b);
assert.ok(eventAnchorPoolFor("medical-camp").includes(medLoc));

const pins = eventMapPins(dir.events);
assert.equal(pins.length, 2);
assert.ok(pins.every((p) => p.x >= 0.02 && p.x <= 0.98 && p.y >= 0.02 && p.y <= 0.98));
assert.ok(pins.some((p) => p.eventId === a.id && p.locationId === locA));

const claim = dir.claim(a.id);
assert.equal(claim.accepted, true);
assert.equal(unclaimedEventAt(dir.events, locA)?.id === a.id, false);
assert.equal(eventMapPins(dir.events).length, 1);
assert.ok(!eventMapPins(dir.events).some((p) => p.eventId === a.id));

console.log("ok world-event anchors + map pins domain");
