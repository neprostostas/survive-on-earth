/**
 * Journal counts + faction rows (domain).
 */
import assert from "node:assert/strict";
import { JournalSystem } from "../src/progression/JournalSystem.ts";
import { ReputationSystem } from "../src/progression/ReputationSystem.ts";
import {
  factionRows,
  journalCounts,
  journalNoteRows,
  reputationTierLabelKey,
} from "../src/progression/JournalView.ts";

const journal = new JournalSystem();
assert.equal(journalCounts(journal).notes, 0);
journal.discoverLocation("home");
journal.discoverItem("pine-log");
journal.discoverEnemy("shambler-worker");
journal.addNote("lore-1", "Camp bulletin.");
assert.deepEqual(journalCounts(journal), {
  locations: 1,
  items: 1,
  enemies: 1,
  notes: 1,
});
assert.equal(journalNoteRows(journal).length, 1);
assert.equal(journalNoteRows(journal)[0]?.text, "Camp bulletin.");

const rep = new ReputationSystem();
rep.add("frontier-survivors", 30);
const rows = factionRows(rep);
assert.equal(rows.length, 4);
const frontier = rows.find((r) => r.id === "frontier-survivors");
assert.ok(frontier);
assert.equal(frontier.tier, "accepted");
assert.equal(reputationTierLabelKey("hostile"), "journal.tier.hostile");

console.log("ok journal view + faction rows domain");
