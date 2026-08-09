import assert from "node:assert/strict";
import { HarvestableResource } from "../src/harvesting/HarvestableResource.ts";
import { HarvestingSession } from "../src/harvesting/HarvestingSession.ts";

const position = { x: 1, y: 0, z: 1 };
const visual = { impact() {}, deplete() {}, update() {} };

function resource(id, kind) {
  return new HarvestableResource({ id, kind, position: () => position, radius: () => 0.5, visualEnabled: () => true, visual });
}

const tree = resource("tree-test", "pine-tree");
const rock = resource("rock-test", "limestone-rock");
assert.equal(tree.totalHits, 4, "pine tree must start with exactly four hits");
assert.equal(rock.totalHits, 5, "limestone rock must start with exactly five hits");
assert.equal(tree.requiredTool, "hatchet", "pine tree must require a hatchet");
assert.equal(rock.requiredTool, "pickaxe", "limestone rock must require a pickaxe");

assert.equal(tree.applyImpact(null).accepted, false, "missing tool must reject impact");
assert.equal(tree.remainingHits, 4, "rejected impact must not change remaining hits");
assert.equal(tree.applyImpact("pickaxe").accepted, false, "wrong tool must reject impact");
assert.equal(tree.applyImpact("hatchet").remainingHits, 3, "successful impact must decrement exactly once");
assert.equal(tree.remainingHits, 3, "interruption must not reset resource state");
for (let hit = 0; hit < 3; hit += 1) tree.applyImpact("hatchet");
assert.equal(tree.remainingHits, 0, "tree must deplete on fourth successful impact");
assert.equal(tree.isDepleted, true, "tree must enter depleted state");
assert.equal(tree.applyImpact("hatchet").accepted, false, "depleted resource must reject further impacts");
assert.equal(tree.remainingHits, 0, "remaining hits must never become negative");

for (let hit = 0; hit < 5; hit += 1) rock.applyImpact("pickaxe");
assert.equal(rock.remainingHits, 0, "rock must deplete on fifth successful impact");
assert.equal(rock.isDepleted, true, "rock must enter depleted state");

const timing = { duration: 1, impactNormalizedTime: 0.5 };
const sessionTree = resource("tree-session", "pine-tree");
const otherRock = resource("rock-nearby", "limestone-rock");
const session = new HarvestingSession();
session.begin(sessionTree, true);
assert.equal(session.target, sessionTree, "session must lock the resource selected at start");
assert.notEqual(session.target, otherRock, "nearby resource must not replace active target");
let event = session.update(0.5, timing, true, true, true, 0, 0.18, true);
assert.equal(event.impact, true, "impact must occur at configured animation moment");
sessionTree.applyImpact("hatchet");
event = session.update(0.5, timing, false, true, true, 0, 0.18, true);
assert.equal(event.completedCycle, true, "tap swing must be allowed to finish recovery");
assert.equal(session.active, false, "release must prevent a repeated swing");
assert.equal(sessionTree.remainingHits, 3, "ending a tap session must preserve remaining hits");

const holdTree = resource("tree-hold", "pine-tree");
session.begin(holdTree, true);
event = session.update(0.5, timing, true, true, true, 0, 0.18, true);
if (event.impact) holdTree.applyImpact("hatchet");
event = session.update(0.5, timing, true, true, true, 0, 0.18, true);
assert.equal(session.active, true, "held action must start the next game-timed swing");
event = session.update(0.5, timing, true, true, true, 0, 0.18, true);
if (event.impact) holdTree.applyImpact("hatchet");
assert.equal(holdTree.remainingHits, 2, "hold cadence must deliver one impact per animation cycle");
session.cancel();

session.begin(sessionTree, true);
event = session.update(0.1, timing, true, true, true, 0.4, 0.18, true);
assert.equal(event.cancelled, true, "meaningful movement must cancel harvesting");
assert.equal(session.active, false, "movement interruption must clear session");
assert.equal(sessionTree.remainingHits, 3, "movement cancellation must not reset hits");

session.begin(sessionTree, true);
event = session.update(0.1, timing, true, true, false, 0, 0.18, true);
assert.equal(event.cancelled, true, "invalid or out-of-range target must cancel harvesting");

session.begin(sessionTree, true);
event = session.update(0.1, timing, true, true, true, 0, 0.18, false);
assert.equal(event.cancelled, true, "tool becoming unavailable must cancel harvesting");

console.log("Harvesting verification passed");
