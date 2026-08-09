import assert from "node:assert/strict";
import { InteractionTargetSelector } from "../src/interaction/InteractionTargetSelector.ts";

const player = { x: 0, y: 0, z: 0 };
const selector = new InteractionTargetSelector();

function target(id, x, z, radius = 0, enabled = true) {
  const position = { x, y: 0, z };
  return {
    interactionId: id,
    interactionType: "resource",
    getInteractionPosition: () => position,
    getInteractionRadius: () => radius,
    isInteractionEnabled: () => enabled,
  };
}

const far = target("far", 4, 0);
assert.equal(selector.select([far], player, 0, 1.55, 0.2, 0.08, null).target, null, "out-of-range target must not select");

const boundaryAware = target("boundary-aware", 2, 0, 0.5);
assert.equal(selector.select([boundaryAware], player, 0, 1.55, 0.2, 0.08, null).target, boundaryAware, "target radius must reduce effective distance");

const sticky = target("sticky", 1, 0);
const tinyLead = target("tiny-lead", 0.9, 0);
assert.equal(selector.select([sticky, tinyLead], player, 0, 1.55, 0.2, 0.08, sticky).target, sticky, "switch bias must prevent flicker");

const clearWinner = target("clear-winner", 0.6, 0);
assert.equal(selector.select([sticky, clearWinner], player, 0, 1.55, 0.2, 0.08, sticky).target, clearWinner, "clearly closer target must eventually win");

const side = target("side", 1, 0);
const facing = target("facing", 0, 1.04);
assert.equal(selector.select([side, facing], player, 0, 1.55, 0.2, 0.08, null).target, facing, "facing may break a near-distance tie");

const disabled = target("disabled", 0.2, 0, 0, false);
assert.equal(selector.select([disabled], player, 0, 1.55, 0.2, 0.08, null).target, null, "disabled target must not select");

console.log("Interaction selector verification passed");
