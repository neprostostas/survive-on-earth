/**
 * Dungeon location anchors + reset naming (domain).
 */
import assert from "node:assert/strict";
import { DungeonResetSystem } from "../src/world/DungeonReset.ts";
import {
  dungeonForLocation,
  dungeonTitle,
  formatDungeonResetNames,
  locksForDungeon,
  locationsForDungeon,
  playerInsideResetDungeon,
} from "../src/world/DungeonAnchors.ts";

assert.equal(dungeonForLocation("bunker-echo-f3"), "bunker-echo");
assert.equal(dungeonForLocation("home"), null);
assert.ok(locationsForDungeon("bunker-echo").includes("bunker-echo-f5"));
assert.deepEqual(locksForDungeon("bunker-echo"), ["bunker-armory"]);
assert.equal(dungeonTitle("bunker-echo"), "Bunker Echo");
assert.equal(formatDungeonResetNames(["bunker-echo", "helix-core"]), "Bunker Echo, Helix Core");
assert.equal(playerInsideResetDungeon("bunker-echo-f3", ["bunker-echo"]), true);
assert.equal(playerInsideResetDungeon("home", ["bunker-echo"]), false);

const sys = new DungeonResetSystem();
assert.equal(sys.getState("bunker-echo")?.bossDefeated, false);
sys.markBossDefeated("bunker-echo");
assert.equal(sys.getState("bunker-echo")?.bossDefeated, true);

// Force cycle: lastReset at 0, tick at 2+ days
const reset = sys.tick(2.1);
assert.ok(reset.includes("bunker-echo"));
assert.equal(sys.getState("bunker-echo")?.bossDefeated, false, "reset clears boss flag");
assert.ok((sys.getState("bunker-echo")?.lootWave ?? 0) >= 1);

console.log("ok dungeon anchors + reset cycle domain");
