/**
 * Story act framing for main progression without locking sandbox.
 * Acts are organizational — players may free-roam.
 */

import type { LocationId } from "../locations/LocationRegistry.ts";

export type StoryActId = "act-1" | "act-2" | "act-3" | "act-4" | "post";

export interface StoryActDef {
  readonly id: StoryActId;
  readonly title: string;
  readonly summary: string;
  readonly milestoneHints: readonly string[];
}

export const STORY_ACTS: readonly StoryActDef[] = Object.freeze([
  Object.freeze({
    id: "act-1" as const,
    title: "Act I — Survive",
    summary: "Secure Home, tools, food, and first travel.",
    milestoneHints: Object.freeze([
      "Craft hatchet and pickaxe",
      "Equip a backpack",
      "Travel to Pine Woods",
      "Place storage at Home",
    ]),
  }),
  Object.freeze({
    id: "act-2" as const,
    title: "Act II — Networks",
    summary: "Meet settlements, assemble a bike, breach Bunker Echo.",
    milestoneHints: Object.freeze([
      "Visit Survivor Camp",
      "Assemble Salvaged Bike",
      "Enter Bunker Echo",
      "Face The Warden",
    ]),
  }),
  Object.freeze({
    id: "act-3" as const,
    title: "Act III — Greyhaven",
    summary: "Industrial craft, city districts, advanced equipment.",
    milestoneHints: Object.freeze([
      "Reach Greyhaven Outskirts",
      "Link Metro Central",
      "Assemble Trailrunner ATV",
      "Power advanced stations",
    ]),
  }),
  Object.freeze({
    id: "act-4" as const,
    title: "Act IV — Depth",
    summary: "Blacksite, Exclusion Zone, Helix Core.",
    milestoneHints: Object.freeze([
      "Infiltrate Blacksite Core",
      "Enter Exclusion Wastes with filters",
      "Breach Helix Core",
      "Defeat Helix Sovereign",
    ]),
  }),
  Object.freeze({
    id: "post" as const,
    title: "Aftermath",
    summary: "Sandbox continues with raids, contracts, and repeats.",
    milestoneHints: Object.freeze([
      "Clear hostile compounds",
      "Rank faction reputation",
      "Expand Home automation",
    ]),
  }),
]);

/** Lightweight act inference from level / locations — not forced progression gates. */
export function inferStoryAct(level: number, visited: ReadonlySet<LocationId> | readonly LocationId[]): StoryActId {
  const set = visited instanceof Set ? visited : new Set(visited);
  if (set.has("helix-core") || level >= 25) return "post";
  if (set.has("blacksite-core") || set.has("exclusion-wastes") || level >= 18) return "act-4";
  if (set.has("greyhaven-outskirts") || set.has("metro-central") || level >= 10) return "act-3";
  if (set.has("bunker-echo") || set.has("survivor-camp") || level >= 5) return "act-2";
  return "act-1";
}

export function getStoryAct(id: StoryActId): StoryActDef {
  return STORY_ACTS.find((a) => a.id === id) ?? STORY_ACTS[0]!;
}
