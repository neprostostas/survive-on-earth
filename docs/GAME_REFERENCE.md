# Game Reference

**Primary gameplay reference: Last Day on Earth: Survival.**

Reference means camera, character/world proportions, movement feeling, survival gameplay structure, building-grid proportions, interaction distances, and pacing. It does not mean copying proprietary code, art, audio, branding, UI assets, or content.

When future development must choose between a novel interpretation and behavior closer to LDOE, the default choice is the behavior closer to LDOE. All final values still require visual calibration against lawful reference footage using original procedural or project-owned assets.

## Stable presentation rules from Fidelity F1

- Treat the current Kefir gameplay/help interface as the HUD-generation reference; do not mix it with older layouts.
- Primary play is a high oblique, horizon-free, near-orthographic composition. Exact yaw/pitch remain screenshot-calibrated estimates rather than claimed source values.
- The survivor should read at roughly one fifth of viewport height in the reviewed mobile landscape framing.
- The player sits near horizontal center and slightly above vertical center, leaving more actionable ground below.
- Building cell width is approximately 1.4 player heights; wall height approximately 1.3 player heights.
- Major HUD circles use normalized anchors and height-relative sizing. The joystick is intentionally large and inward from the lower-left edge; minimap and action hierarchy carry comparable weight on the right.
- Minimap, joystick, AUTO, contextual/attack/sneak hierarchy, and bottom utility strip are persistent composition elements, even when a prototype exposes only presentation shells.
- Environment palette is muted olive survival green. Fine clutter must remain subordinate to trees, rocks, the survivor, and interactable feedback.
- Keep original project assets and symbols. Reference similarity applies to hierarchy, proportions, spacing, behavior category, and screen composition—not copyrighted artwork.
- Camera pixel snapping and stable shadow projection are required regression guards.

## Harvesting baseline from Milestone 03

- Pine Tree requires exactly 4 successful Hatchet impacts.
- Limestone Rock requires exactly 5 successful Pickaxe impacts.
- A tap performs one swing; holding the contextual action repeats swings using game-controlled cadence.
- Movement interrupts harvesting immediately, while partial remaining hits persist for the current location session.
- Tool swing durations and normalized impact timings are screen/gameplay-feel calibrated approximations, not official internal LDOE timing values.
- Harvesting ends at depleted resource state in Milestone 03. Resource results/items begin in Milestone 04.

## Resource results from Milestone 04

- Pine Tree depletion produces 3 Pine Logs (`pine-log`).
- Limestone Rock depletion produces 3 Limestone (`limestone`).
- Pine Log max stack is 20.
- Limestone max stack is 20.
- The compact icon/amount feedback duration is a project gameplay-feel approximation, not an official LDOE internal timing.
- Milestone 04 produces a valid transient item result only. Physical Ground Loot and pickup begin in Milestone 05; player storage remains a later milestone.
