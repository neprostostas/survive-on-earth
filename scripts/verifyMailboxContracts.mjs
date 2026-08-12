/**
 * Mailbox overflow + contract board domain.
 */
import assert from "node:assert/strict";
import { MailboxSystem } from "../src/rewards/MailboxSystem.ts";
import { PlayerInventory } from "../src/inventory/PlayerInventory.ts";
import { createItemStack } from "../src/items/ItemSystem.ts";
import { ContractSystem } from "../src/contracts/ContractSystem.ts";
import {
  firstExploreMatch,
  locationMatchesContractHint,
  lootProfileForContract,
} from "../src/contracts/ContractRules.ts";

// Mailbox
{
  const box = new MailboxSystem();
  const inv = new PlayerInventory();
  // Fill pockets small capacity: base 10 slots
  for (let i = 0; i < 20; i += 1) {
    inv.tryInsert(createItemStack("pine-log", 20));
  }
  const overflow = createItemStack("nails", 4);
  const result = box.deliver(overflow, inv);
  assert.equal(result.destination, "mailbox");
  assert.ok(box.occupiedCount() >= 1);

  // Empty a pocket and claim
  const slot = inv.findFirstSlotByItemId("pine-log");
  assert.notEqual(slot, null);
  const stack = inv.getSlot(/** @type {number} */ (slot)).stack;
  assert.ok(stack);
  inv.exchangeWholeStack(/** @type {number} */ (slot), stack, null);
  const moved = box.claimAll(inv);
  assert.ok(moved >= 1);
  console.log("ok mailbox deliver + claim");
}

// Contracts
{
  assert.equal(locationMatchesContractHint("ash-jackal-outpost", "ash-jackal-outpost"), true);
  assert.equal(locationMatchesContractHint("pine-woods", "forest edge"), true);
  assert.equal(locationMatchesContractHint("home", "home"), true);

  const contracts = new ContractSystem();
  contracts.tick(2.5);
  assert.ok(contracts.boardContracts.length >= 1 && contracts.boardContracts.length <= 3);
  const first = contracts.boardContracts[0];
  assert.ok(first);
  assert.equal(contracts.accept(first.id), true);
  assert.equal(contracts.activeContracts.length, 1);
  assert.equal(contracts.boardContracts.some((c) => c.id === first.id), false);

  // Explore match
  const explore = contracts.activeContracts[0];
  if (explore && explore.kind === "explore") {
    const hit = firstExploreMatch(contracts.activeContracts, explore.targetLocationHint);
    // may or may not match depending on template pick
    void hit;
  }

  const fake = {
    id: "t1",
    kind: /** @type {const} */ ("explore"),
    title: "Map the Transit Hubs",
    description: "x",
    factionId: /** @type {const} */ ("wayfarer-network"),
    difficulty: /** @type {const} */ (3),
    rewardXp: 50,
    rewardReputation: 12,
    rewardHint: "map intel",
    targetLocationHint: "greyhaven-transit",
    completed: false,
    claimed: false,
  };
  assert.ok(firstExploreMatch([fake], "greyhaven-transit"));
  assert.equal(lootProfileForContract(fake), "event-supply");

  contracts.complete(first.id);
  assert.equal(contracts.activeContracts[0]?.completed, true);
  const claimed = contracts.claim(first.id);
  assert.ok(claimed);
  assert.equal(claimed.claimed, true);
  console.log("ok contracts accept / complete / claim");
}
