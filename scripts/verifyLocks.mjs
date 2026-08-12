/**
 * LockSystem + locked site helpers (domain).
 */
import assert from "node:assert/strict";
import { LockSystem } from "../src/world/LockSystem.ts";
import {
  LOCKED_SITES,
  isLockSupportId,
  lockIdFromContainerId,
  lockSupportSite,
  lockedSitesAt,
} from "../src/world/LockedSites.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";

assert.equal(LOCKED_SITES.length, 3);
assert.equal(lockIdFromContainerId("lock-chest:motel-room-7"), "motel-room-7");
assert.equal(lockedSitesAt("derelict-motel").length, 1);
assert.ok(isLockSupportId("lock-support:factory-breaker"));
assert.equal(lockSupportSite("lock-support:factory-breaker")?.lockId, "factory-warehouse");

const locks = new LockSystem();
locks.register({ id: "motel-room-7", kind: "key", requiredKey: "rusted-key", locked: true });
locks.register({ id: "factory-warehouse", kind: "power", locked: true, powered: false });
locks.register({ id: "bunker-armory", kind: "access-card", requiredKey: "security-badge", locked: true });

const inv = new PlayerInventory();
assert.equal(locks.tryUnlockWithInventory("motel-room-7", inv).ok, false);
assert.equal(locks.tryUnlockWithInventory("motel-room-7", inv).reason, "need-key");

assert.equal(inv.tryInsert(createItemStack("rusted-key", 1)).accepted, true);
assert.equal(locks.tryUnlockWithInventory("motel-room-7", inv).ok, true);
assert.equal(locks.isLocked("motel-room-7"), false);
assert.equal(inv.findFirstSlotByItemId("rusted-key"), null, "rusted key consumed");

assert.equal(locks.tryUnlockWithInventory("factory-warehouse", inv).reason, "no-power");
locks.setPowered("factory-warehouse", true);
assert.equal(locks.tryUnlockWithInventory("factory-warehouse", inv).ok, true);
assert.equal(locks.isLocked("factory-warehouse"), false);

assert.equal(inv.tryInsert(createItemStack("security-badge", 1)).accepted, true);
assert.equal(locks.tryUnlockWithInventory("bunker-armory", inv).ok, true);
assert.ok(inv.findFirstSlotByItemId("security-badge") !== null, "badge retained");

console.log("ok locks + locked sites domain");
