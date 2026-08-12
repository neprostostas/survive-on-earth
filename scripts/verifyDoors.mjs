/**
 * Built doors/gates: open state + interact ids.
 */
import assert from "node:assert/strict";
import {
  BuildingRegistry,
  isPassagePieceId,
} from "../src/building/BuildingRegistry.ts";
import {
  builtDoorInteractableId,
  isBuiltDoorInteractionId,
  isDoorPiece,
  isInteractableBuildPiece,
  pieceInstanceFromBuiltDoor,
} from "../src/building/BuiltPieceWiring.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(isDoorPiece("door-l1"), true);
assert.equal(isDoorPiece("gate-wood"), true);
assert.equal(isDoorPiece("door-reinforced"), true);
assert.equal(isPassagePieceId("wall-l1"), false);
assert.equal(isInteractableBuildPiece("door-l1"), true);

const inv = new PlayerInventory();
/** @param {string} id @param {number} qty */
function give(id, qty) {
  let left = qty;
  while (left > 0) {
    const take = Math.min(left, 20);
    assert.equal(inv.tryInsert(createItemStack(/** @type {any} */ (id), take)).accepted, true);
    left -= take;
  }
}
give("wood-plank", 60);
give("nails", 40);
give("rope", 2);

const building = new BuildingRegistry();
building.select("floor-l1");
assert.ok(building.placeWithCost(inv, 0, 0).piece);
building.select("door-l1");
const door = building.placeWithCost(inv, 0, 0).piece;
assert.ok(door);
assert.equal(door.isOpen, false);

const open1 = building.togglePassage(door.id);
assert.equal(open1, true);
assert.equal(building.isPassageOpen(door.id), true);
assert.equal(building.togglePassage(door.id), false);
assert.equal(building.isPassageOpen(door.id), false);
assert.equal(building.togglePassage("missing"), null);

// save/load preserves open flag
building.togglePassage(door.id);
const snap = building.serialize();
const restored = new BuildingRegistry();
restored.load([...snap]);
assert.equal(restored.isPassageOpen(door.id), true);

const ixId = builtDoorInteractableId(door.id, door.pieceId);
assert.equal(isBuiltDoorInteractionId(ixId), true);
assert.equal(pieceInstanceFromBuiltDoor(ixId), door.id);

// gate also toggles
building.select("floor-l1");
assert.ok(building.placeWithCost(inv, 1, 0).piece);
building.select("gate-wood");
const gate = building.placeWithCost(inv, 1, 0).piece;
assert.ok(gate);
assert.equal(building.togglePassage(gate.id), true);

console.log("ok doors/gates open-close domain");
