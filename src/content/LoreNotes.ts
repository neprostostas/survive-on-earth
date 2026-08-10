/**
 * Collectible lore notes — original Survive on Earth world text.
 * Discovered notes feed JournalSystem when player finds matching triggers.
 */
export interface LoreNoteDef {
  readonly id: string;
  readonly title: string;
  readonly regionHint: string;
  readonly text: string;
}

export const LORE_NOTES: readonly LoreNoteDef[] = Object.freeze([
  Object.freeze({ id: "home-note-1", title: "Faded Grocery List", regionHint: "home", text: "Water. Nails. Matches. Check the ridge before dark." }),
  Object.freeze({ id: "home-note-2", title: "Door Scratch Count", regionHint: "home", text: "Four nights without claw marks. Do not get comfortable." }),
  Object.freeze({ id: "forest-note-1", title: "Hunter Tag", regionHint: "pine-woods", text: "Snare line pulled north. Big tracks. Keep quiet." }),
  Object.freeze({ id: "forest-note-2", title: "Trail Marker", regionHint: "dense-forest", text: "If the fungus is green, it is safe. Purple means run." }),
  Object.freeze({ id: "bunker-note-1", title: "Echo Log 12", regionHint: "bunker-echo", text: "Generators coughing. Seal bulkhead C before next surge." }),
  Object.freeze({ id: "bunker-note-2", title: "Echo Log 41", regionHint: "bunker-echo-f3", text: "Something moved past the outer cage. Do not go alone." }),
  Object.freeze({ id: "bunker-note-3", title: "Access Memo", regionHint: "bunker-echo-f4", text: "Keycards fail after radiation spike. Manual override only." }),
  Object.freeze({ id: "city-note-1", title: "Transit Flyer", regionHint: "greyhaven-outskirts", text: "Metro runs delayed indefinitely. Seek raised road." }),
  Object.freeze({ id: "city-note-2", title: "Storefront Scrawl", regionHint: "greyhaven-commercial", text: "Leave tinned food. Take tools only." }),
  Object.freeze({ id: "city-note-3", title: "Apartment Note", regionHint: "greyhaven-residential", text: "We left for the waterfront at dawn. Follow blue tape." }),
  Object.freeze({ id: "city-note-4", title: "Police Desk Pad", regionHint: "greyhaven-government", text: "Armory emptied. Evidence room may still have ammo." }),
  Object.freeze({ id: "hospital-note-1", title: "Ward Shift Log", regionHint: "abandoned-hospital", text: "Contaminant cases moved to basement freezers." }),
  Object.freeze({ id: "hospital-note-2", title: "Pharmacy Order", regionHint: "greyhaven-hospital-district", text: "Saline exhausted. Use distilled rain if sealed." }),
  Object.freeze({ id: "prison-note-1", title: "Yard Roster", regionHint: "ironbound-prison", text: "Block D riot incomplete. Gates jammed on half power." }),
  Object.freeze({ id: "prison-note-2", title: "Warden Memo", regionHint: "ironbound-prison", text: "External contractors renamed the warden. Ignore radio names." }),
  Object.freeze({ id: "metro-note-1", title: "Platform Chalk", regionHint: "metro-central", text: "Flooded line south. Lights still work on security spur." }),
  Object.freeze({ id: "metro-note-2", title: "Tunnel Map Scrap", regionHint: "metro-flooded", text: "Maintenance room behind panel 7C. Tools first." }),
  Object.freeze({ id: "industrial-note-1", title: "Yard Safety Card", regionHint: "industrial-yard", text: "Press line offline. Scavenge motors and belts." }),
  Object.freeze({ id: "industrial-note-2", title: "Power Memo", regionHint: "coastal-power-plant", text: "Grid spit brownouts. Core coolant still hot." }),
  Object.freeze({ id: "blacksite-note-1", title: "Redacted Page", regionHint: "blacksite-ruins", text: "Subject transfer delayed. Helix claim still active." }),
  Object.freeze({ id: "blacksite-note-2", title: "Containment Slip", regionHint: "blacksite-core", text: "Do not open specimen drawers without gas seal." }),
  Object.freeze({ id: "faction-frontier-1", title: "Camp Bulletin", regionHint: "survivor-camp", text: "Frontier needs planks and antivenom. Barter fair." }),
  Object.freeze({ id: "faction-iron-1", title: "Forge Schedule", regionHint: "ironbound-fort", text: "Steel quota delayed. Bring ore if you want bullets." }),
  Object.freeze({ id: "faction-way-1", title: "Wayfarer Relay", regionHint: "wayfarer-post", text: "Maps update at dusk. Trade tokens preferred." }),
  Object.freeze({ id: "swamp-note-1", title: "Mire Warning", regionHint: "swamp-hollow", text: "Fog hides nests. Boots rot in three days." }),
  Object.freeze({ id: "snow-note-1", title: "Cabin Scratch", regionHint: "frozen-pine-valley", text: "Fur trades for fuel. Stay windward of the ridge." }),
  Object.freeze({ id: "desert-note-1", title: "Wreck Tag", regionHint: "desert-ruin", text: "Convoy turned back. Salvage glass before sand takes it." }),
  Object.freeze({ id: "survivor-journal-1", title: "Day 19 Entry", regionHint: "abandoned-camp", text: "If Home collapses, rebuild floors first. Walls can wait." }),
  Object.freeze({ id: "survivor-journal-2", title: "Day 63 Entry", regionHint: "hunters-cabin", text: "The infected learn doors. Leave false rooms open." }),
  Object.freeze({ id: "map-fragment-lore-1", title: "Chart Edge", regionHint: "old-highway", text: "Fragment marks a hatch east of the motel ruins." }),
]);

export function loreNotesForLocation(locationId: string): readonly LoreNoteDef[] {
  return LORE_NOTES.filter((n) => n.regionHint === locationId || locationId.startsWith(n.regionHint));
}
