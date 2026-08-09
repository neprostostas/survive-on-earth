# Milestone 03 — Harvestable Resources

## Goal

Deliver the first complete resource interaction loop without starting the item layer: select an existing contextual resource, face it, show the required procedural tool, animate a timed impact, preserve deterministic remaining hits, and remove the depleted resource from interaction, collision, and the minimap.

## LDOE reference behavior

- Pine Tree: exactly 4 successful Hatchet impacts.
- Limestone Rock: exactly 5 successful Pickaxe impacts.
- Tap: one complete swing.
- Hold: repeated game-timed swings until release, interruption, or depletion.
- The durations and impact positions are screen/gameplay-feel calibrated approximations, not claimed internal LDOE timings.

Hit counts are fixed gameplay reference data and are not exposed as calibration sliders.

## Architecture

- `harvesting/HarvestableResource.ts` is the resource contract and deterministic `remainingHits` model. It adapts directly to the existing `Interactable` contract, so the Interaction System remains the only target source.
- `harvesting/HarvestingSession.ts` is a rendering-independent timing model for alignment, wind-up, impact, recovery, tap/hold repetition, and cancellation.
- `harvesting/HarvestingSystem.ts` connects the selected target, semantic action state, movement intent, tool availability, player facing/pose, impact callbacks, and depletion cleanup. It does not read DOM events or scan scene meshes.
- `PrototypeToolLoadout` implements the small `HarvestToolAvailability` contract. It only answers whether Hatchet or Pickaxe is available.
- Tree and Rock own only their visual hit/depletion reactions. They do not read input, resolve tools, or start player animation.
- `HarvestImpactEffects` preallocates a bounded debris pool and reuses shared world materials. No material or unbounded particle allocation occurs per hit.

## Input and sessions

Keyboard `E`/`Space` and the contextual pointer button expose `pressedThisFrame`, `isHeld`, and `releasedThisFrame`. Browser key repeat never creates impacts; the harvesting session cadence does.

A session temporarily locks the already-selected Interaction target. It ends when:

- the current tap finishes recovery;
- held input is released and the current swing finishes;
- meaningful movement exceeds the calibrated deadzone;
- the target leaves interaction range or becomes invalid;
- the required tool becomes unavailable;
- the resource is depleted.

Movement cancellation is immediate. Partial progress remains on the resource and resumes from the same `remainingHits` when the player returns.

## Tools and animation

Hatchet and Pickaxe are original procedural meshes attached to the player's right-arm transform. They are hidden during normal locomotion and shown only while harvesting. `PlayerAnimator` applies distinct chop and mining poses with upper-body participation, arm motion, weight shift, impact, and recovery. Existing idle/locomotion animation remains the baseline outside the harvest override.

The player uses the existing `requestFacing` shortest-angle rotation path. Swing time does not advance out of the aligning phase until facing is within a small tolerance.

## Resource feedback and depletion

Tree impacts add a short trunk/canopy impulse and pooled wood chips. The fourth impact immediately disables interaction and collision, then starts a deterministic fall away from the player before hiding the visual.

Rock impacts add a restrained local impulse and pooled stone chips. The fifth impact disables interaction and collision, shifts the secondary fragments, settles/shrinks the main visual, and then hides it.

The gameplay anchor never moves. Disabled interactables are automatically omitted by the existing minimap loop, so no ghost marker remains. Depleted resources do not respawn until the location/browser session is recreated.

F3 freeze supplies zero delta to resource reactions/effects and pauses harvesting timing. It does not mutate resource state.

## UI and diagnostics

- The contextual button displays original SVG Hatchet/Pickaxe icons for resource targets.
- Missing tools keep the target selected, dim the tool icon, and show a short non-modal required-tool hint after an attempted action.
- F1 exposes swing duration, normalized impact timing, movement cancel threshold, hit reaction strength, particle intensity, and non-persistent Prototype Tool toggles.
- F2 reports resource ID/kind, required tool, availability, remaining hits, phase, held state, target lock, and last depleted resource.

## Persistence and limitations

Calibration persistence is version 6 and merges harvesting defaults into older saved camera/visual settings without resetting them.

`PrototypeToolLoadout` is temporary. It exists only because Item System, Inventory, tool possession, Equipment, and durability are not implemented. A future resolver can replace it through `HarvestToolAvailability` without rewriting harvesting.

This milestone intentionally has no drops, Pine Logs, Limestone items, loot, inventory, equipment, durability, XP, audio, combat, respawn timer, location lifecycle, or save-game resource persistence. A browser reload may recreate all resources. Future location reset behavior belongs to the location lifecycle/world milestone.
