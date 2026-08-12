/**
 * Furniture storage capacities + base radio power/scan intel domain.
 */
import assert from "node:assert/strict";
import {
  CHEST_PIECE_CAPACITY,
  isChestPiece,
  isInteractableBuildPiece,
  isStandalonePowerPiece,
  POWER_PIECE_SPECS,
  powerDeviceIdForPiece,
} from "../src/building/BuiltPieceWiring.ts";
import { composeRadioBriefing } from "../src/base/RadioIntel.ts";
import { PowerGrid } from "../src/base/PowerGrid.ts";
import { BUILD_PIECES } from "../src/building/BuildingRegistry.ts";

assert.equal(isChestPiece("shelf-basic"), true);
assert.equal(isChestPiece("weapon-rack"), true);
assert.equal(CHEST_PIECE_CAPACITY["shelf-basic"], 6);
assert.equal(CHEST_PIECE_CAPACITY["weapon-rack"], 4);
assert.equal(isInteractableBuildPiece("shelf-basic"), true);
assert.equal(isInteractableBuildPiece("weapon-rack"), true);
assert.equal(isStandalonePowerPiece("base-radio"), true);
assert.equal(isChestPiece("base-radio"), false);
assert.ok(POWER_PIECE_SPECS["base-radio"]);
assert.equal(POWER_PIECE_SPECS["base-radio"].kind, "radio");
assert.equal(POWER_PIECE_SPECS["base-radio"].consumption, 1);
assert.ok(BUILD_PIECES.some((p) => p.id === "base-radio"));

// Briefing sorts by threat, skips cleared/claimed
{
  const briefing = composeRadioBriefing(
    [
      { title: "Supply Drop", danger: 2, claimed: false },
      { title: "Done Drop", danger: 5, claimed: true },
    ],
    [
      { title: "Ridge Fort", threat: 4, cleared: false },
      { title: "Old Camp", threat: 2, cleared: true },
    ],
  );
  assert.equal(briefing.empty, false);
  assert.equal(briefing.lines.length, 2);
  assert.equal(briefing.lines[0].title, "Ridge Fort");
  assert.equal(briefing.lines[0].kind, "raid");
  assert.equal(briefing.lines[1].title, "Supply Drop");
  assert.equal(briefing.lines[1].kind, "event");
}

{
  const empty = composeRadioBriefing(
    [{ title: "X", danger: 1, claimed: true }],
    [{ title: "Y", threat: 3, cleared: true }],
  );
  assert.equal(empty.empty, true);
  assert.equal(empty.lines.length, 0);
}

// Powered radio draws when enabled
{
  const grid = new PowerGrid();
  grid.syncBuildDevice({
    id: powerDeviceIdForPiece("r1"),
    kind: "generator",
    label: "Gen",
    production: 10,
    consumption: 0,
    priority: 1,
    enabled: true,
    fueled: true,
  });
  grid.syncBuildDevice({
    id: powerDeviceIdForPiece("radio"),
    kind: "radio",
    label: "Base Radio",
    production: 0,
    consumption: 1,
    priority: 4,
    enabled: false,
  });
  const radioId = powerDeviceIdForPiece("radio");
  assert.equal(grid.isPowered(radioId), false);
  const on = grid.tryInteractDevice(radioId, false);
  assert.equal(on.message, "on");
  assert.equal(grid.isPowered(radioId), true);
  assert.ok(grid.consumption >= 1);
  console.log("ok radio power + furniture storage domain");
}
