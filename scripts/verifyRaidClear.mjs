/**
 * Raid anchors + clear rules (domain).
 */
import assert from "node:assert/strict";
import {
  raidAnchorLocation,
  raidMapPins,
  raidReinforcementCount,
  RAID_ANCHOR_POOL,
  unclearedRaidAt,
} from "../src/raids/RaidAnchors.ts";
import { RaidSystem } from "../src/raids/RaidSystem.ts";

assert.ok(RAID_ANCHOR_POOL.includes("ash-jackal-outpost"));
assert.equal(raidAnchorLocation({ seed: 1001 }), RAID_ANCHOR_POOL[1001 % RAID_ANCHOR_POOL.length]);

const raids = new RaidSystem();
const a = raids.generate(1001, 2);
const b = raids.generate(1002, 3);
const c = raids.generate(1003, 4);
assert.equal(raids.list().length, 3);

const locA = raidAnchorLocation(a);
assert.equal(unclearedRaidAt(raids.list(), locA)?.id, a.id);

// Two raids might share the pool anchor (different seeds); first match wins
const firstAtA = unclearedRaidAt(raids.list(), locA);
assert.ok(firstAtA);

assert.ok(raidReinforcementCount(b) >= 4);
assert.ok(raidReinforcementCount(c) >= 4);

const pins = raidMapPins(raids.list());
assert.equal(pins.length, 3);
assert.ok(pins.every((p) => p.x >= 0 && p.x <= 1 && p.y >= 0 && p.y <= 1));

assert.equal(raids.markCleared(a.id), true);
assert.equal(raids.markCleared(a.id), false, "already cleared");
assert.equal(unclearedRaidAt(raids.list(), locA)?.id !== a.id || !unclearedRaidAt(raids.list(), locA), true);
const pinsAfter = raidMapPins(raids.list());
assert.equal(pinsAfter.length, 2);
assert.ok(!pinsAfter.some((p) => p.raidId === a.id));

console.log("ok raid anchors + markCleared domain");
