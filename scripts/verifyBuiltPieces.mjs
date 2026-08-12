/**
 * Built station/chest piece wiring domain tests.
 */
import assert from "node:assert/strict";
import {
  builtChestContainerId,
  builtStationInteractableId,
  CHEST_PIECE_CAPACITY,
  isChestPiece,
  isInteractableBuildPiece,
  isStandalonePowerPiece,
  isStationPiece,
  pieceIdFromBuiltChestContainer,
  STATION_PIECE_TO_KIND,
} from "../src/building/BuiltPieceWiring.ts";
import { BuildingRegistry } from "../src/building/BuildingRegistry.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { WorldContainerEntity } from "../src/containers/WorldContainer.ts";
import { createInteractable } from "../src/interaction/Interactable.ts";
import { gridToWorld } from "../src/building/buildConfig.ts";

assert.equal(isStationPiece("furnace"), true);
assert.equal(isStationPiece("chest-small"), false);
assert.equal(isChestPiece("chest-small"), true);
assert.equal(STATION_PIECE_TO_KIND.furnace, "furnace");
assert.equal(STATION_PIECE_TO_KIND["woodworking-bench"], "woodworking");
assert.equal(STATION_PIECE_TO_KIND["chemistry-station"], "chemistry");
assert.equal(isStationPiece("chemistry-station"), true);
assert.equal(STATION_PIECE_TO_KIND["water-collector"], "water");
assert.equal(STATION_PIECE_TO_KIND.composter, "composter");
assert.equal(isStationPiece("water-collector"), true);
assert.equal(isStationPiece("composter"), true);
assert.equal(STATION_PIECE_TO_KIND.recycler, "recycler");
assert.equal(isStationPiece("recycler"), true);
assert.equal(isStandalonePowerPiece("camp-generator"), true);
assert.equal(isInteractableBuildPiece("camp-generator"), true);
assert.equal(isInteractableBuildPiece("lantern-post"), true);
assert.equal(CHEST_PIECE_CAPACITY["chest-small"], 8);
assert.equal(CHEST_PIECE_CAPACITY["metal-chest"], 16);
assert.equal(CHEST_PIECE_CAPACITY["medical-cabinet"], 10);
assert.equal(CHEST_PIECE_CAPACITY["shelf-basic"], 6);
assert.equal(CHEST_PIECE_CAPACITY["weapon-rack"], 4);
assert.equal(isChestPiece("medical-cabinet"), true);
assert.equal(isChestPiece("shelf-basic"), true);
assert.equal(isChestPiece("weapon-rack"), true);
assert.equal(isStationPiece("medical-cabinet"), false);
assert.equal(builtStationInteractableId("build-3"), "built-station-build-3");
assert.equal(builtChestContainerId("build-9"), "built-chest-build-9");
assert.equal(pieceIdFromBuiltChestContainer("built-chest-build-9"), "build-9");
assert.equal(pieceIdFromBuiltChestContainer("home-supply-crate"), null);

// Domain place flow creates ids matching wiring helpers
const inv = new PlayerInventory();
/** @param {string} id @param {number} qty */
function give(id, qty) {
  let left = qty;
  while (left > 0) {
    const take = Math.min(left, 20);
    assert.equal(inv.tryInsert(createItemStack(/** @type {any} */ (id), take)).accepted, true, `give ${id}`);
    left -= take;
  }
}
give("wood-plank", 40);
give("nails", 20);
give("pine-log", 20);
give("stone", 20);
give("charcoal", 4);
const building = new BuildingRegistry();
building.select("floor-l1");
assert.ok(building.placeWithCost(inv, 0, 0).piece);
building.select("furnace");
const furnace = building.placeWithCost(inv, 0, 0).piece;
assert.ok(furnace);
assert.equal(furnace.pieceId, "furnace");
const stationId = `${builtStationInteractableId(furnace.id)}:${furnace.pieceId}`;
const pos = gridToWorld(furnace.gridX, furnace.gridZ);
const stationIx = createInteractable({
  id: stationId,
  type: "station",
  position: () => ({ x: pos.x, y: 0, z: pos.z }),
  radius: () => 0.95,
  enabled: () => true,
});
assert.equal(stationIx.interactionType, "station");
assert.ok(stationIx.interactionId.includes("furnace"));

building.select("floor-l1");
assert.ok(building.placeWithCost(inv, 1, 0).piece);
building.select("chest-small");
const chest = building.placeWithCost(inv, 1, 0).piece;
assert.ok(chest);
const chestEntity = new WorldContainerEntity(
  builtChestContainerId(chest.id),
  "Small Chest",
  Object.freeze({ x: 0, y: 0, z: 0 }),
  CHEST_PIECE_CAPACITY["chest-small"],
  [createItemStack("nails", 2)],
  "storage",
);
assert.equal(chestEntity.accessMode, "storage");
assert.equal(chestEntity.inventory.getSlot(0)?.itemId, "nails");
const take = chestEntity.inventory.take(0);
assert.ok(take);
assert.equal(chestEntity.inventory.getSlot(0), null);
assert.equal(chestEntity.inventory.tryInsert(take), true);

const loot = new WorldContainerEntity("crate", "Crate", { x: 0, y: 0, z: 0 }, 4, []);
assert.equal(loot.accessMode, "take-all");

// Demolish removes mapping keys
const removed = building.demolishAt(1, 0);
assert.equal(removed?.id, chest.id);
assert.equal(building.all.some((p) => p.id === chest.id), false);

console.log("verifyBuiltPieces: ok");
