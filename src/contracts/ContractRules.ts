/**
 * Contract board domain helpers (pure).
 */
import type { ContractDef, ContractKind } from "./ContractSystem.ts";

/** Location id / visit matches a contract target hint. */
export function locationMatchesContractHint(locationId: string, hint: string): boolean {
  const loc = locationId.toLowerCase();
  const h = hint.toLowerCase().trim();
  if (!h) return false;
  if (loc === h) return true;
  if (loc.includes(h) || h.includes(loc)) return true;
  const slug = h.replace(/\s+/g, "-");
  if (loc.includes(slug) || slug.includes(loc)) return true;
  // Soft keyword links for free-text templates
  if (h.includes("forest") && (loc.includes("pine") || loc.includes("dense-forest"))) return true;
  if (h.includes("industrial") && (loc.includes("industrial") || loc.includes("factory"))) return true;
  if (h.includes("swamp") && loc.includes("swamp")) return true;
  if (h.includes("hospital") && loc.includes("hospital")) return true;
  if (h.includes("home") && loc === "home") return true;
  if (h.includes("highway") && loc.includes("highway")) return true;
  if (h.includes("metro") && loc.includes("metro")) return true;
  if (h.includes("bunker") && loc.includes("bunker")) return true;
  if (h.includes("marauder") && loc.includes("marauder")) return true;
  if (h.includes("ash") && loc.includes("ash-jackal")) return true;
  if (h.includes("blacksite") && loc.includes("blacksite")) return true;
  return false;
}

export function lootProfileForContract(c: ContractDef): string {
  if (c.kind === "boss" || c.difficulty >= 5) return "raid-high";
  if (c.kind === "raid" || c.difficulty >= 4) return "raid-mid";
  if (c.kind === "gather") return "rocky-loot";
  if (c.kind === "recover") return "industrial-loot";
  if (c.kind === "explore") return "event-supply";
  return "event-supply";
}

/** First incomplete active contract of kinds that complete on location enter. */
export function firstExploreMatch(
  active: readonly ContractDef[],
  locationId: string,
): ContractDef | null {
  for (const c of active) {
    if (c.completed || c.claimed) continue;
    if (c.kind !== "explore" && c.kind !== "recover" && c.kind !== "rescue") continue;
    if (locationMatchesContractHint(locationId, c.targetLocationHint)) return c;
  }
  return null;
}

export function firstIncompleteOfKind(
  active: readonly ContractDef[],
  kind: ContractKind,
): ContractDef | null {
  return active.find((c) => c.kind === kind && !c.completed) ?? null;
}
