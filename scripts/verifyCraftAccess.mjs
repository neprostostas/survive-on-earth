/**
 * Workbench craft-access domain checks.
 */
import assert from "node:assert/strict";
import {
  CRAFT_BENCH_RANGE,
  CRAFT_BENCH_PIECE_IDS,
  HOME_WORKBENCH_ID,
  builtCraftInteractableId,
  isCraftBenchInteractionId,
  isCraftBenchPiece,
  playerNearCraftBench,
} from "../src/crafting/CraftAccess.ts";
import { isCraftBenchPiece as wiringIsCraft, isInteractableBuildPiece, isStationPiece } from "../src/building/BuiltPieceWiring.ts";

assert.ok(CRAFT_BENCH_RANGE > 1.5);
assert.ok(CRAFT_BENCH_PIECE_IDS.includes("assembly-bench"));
assert.equal(isCraftBenchPiece("assembly-bench"), true);
assert.equal(isCraftBenchPiece("metalwork-bench"), true);
assert.equal(isCraftBenchPiece("furnace"), false);
assert.equal(wiringIsCraft("assembly-bench"), true);
assert.equal(isStationPiece("assembly-bench"), false);
assert.equal(isInteractableBuildPiece("assembly-bench"), true);
assert.equal(isInteractableBuildPiece("furnace"), true);

assert.equal(isCraftBenchInteractionId(HOME_WORKBENCH_ID), true);
assert.equal(isCraftBenchInteractionId(builtCraftInteractableId("build-2", "assembly-bench")), true);
assert.equal(isCraftBenchInteractionId("built-station-build-1:furnace"), false);
assert.equal(isCraftBenchInteractionId("campfire-01"), false);

assert.equal(playerNearCraftBench({
  playerX: 0,
  playerZ: 0,
  range: CRAFT_BENCH_RANGE,
  benches: [{ x: 0, z: 0, enabled: true }],
}), true);

assert.equal(playerNearCraftBench({
  playerX: 0,
  playerZ: 0,
  range: CRAFT_BENCH_RANGE,
  benches: [{ x: 10, z: 0, enabled: true }],
}), false);

assert.equal(playerNearCraftBench({
  playerX: 0,
  playerZ: 0,
  range: CRAFT_BENCH_RANGE,
  benches: [{ x: 0, z: 0, enabled: false }],
}), false);

// Edge of range
assert.equal(playerNearCraftBench({
  playerX: 0,
  playerZ: 0,
  range: 2,
  benches: [{ x: 2, z: 0, enabled: true }],
}), true);
assert.equal(playerNearCraftBench({
  playerX: 0,
  playerZ: 0,
  range: 2,
  benches: [{ x: 2.05, z: 0, enabled: true }],
}), false);

console.log("verifyCraftAccess: ok");
