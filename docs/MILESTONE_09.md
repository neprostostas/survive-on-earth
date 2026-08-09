# Milestone 09 — Melee Combat Foundation / Unarmed

## Status

Complete. This milestone adds deterministic unarmed melee combat against three procedural Combat Dummies without adding enemies, AI, player damage, weapons, durability, or loot.

## Central calibration

`src/combat/combatConfig.ts` is the single source of truth for the first combat profile:

- fist damage: 6;
- attack rate: 1.8 attacks/second;
- cycle duration: `1 / 1.8` seconds;
- normalized impact time: 0.38;
- target acquisition range: 2.2 world units;
- hit validation range: 1.15 world units;
- target switch bias: 0.16 world units;
- Combat Dummy health: 40;
- Combat Dummy collision radius: 0.3 world units;
- death presentation duration: 0.32 seconds.

The dummy health sequence is deterministic: `40 → 34 → 28 → 22 → 16 → 10 → 4 → 0`. Exactly seven accepted fist impacts kill a fresh dummy.

## Domain boundaries

- `HealthPool` owns clamped current/max health, alive/dead state, immutable snapshots, damage results, and state-change subscriptions.
- `CombatTarget` is a narrow Babylon/DOM-free contract containing runtime identity, display name, position, health, and damage reception.
- `CombatDummy` composes that contract with a 40-health `HealthPool`.
- `CombatTargetSystem` considers only explicitly registered targets. It never scans Babylon meshes or reuses contextual interactables.
- `MeleeCombatSystem` owns the ready/attacking/recovery lifecycle, target locking, impact scheduling, alternating fists, and movement commitment.
- `CombatPresentation` is the thin Babylon/DOM adapter for dummy meshes, target ring and health UI, pooled damage feedback, recoil, and death presentation.

The existing `InteractionSystem` remains the only contextual target selector for harvesting, Ground Loot, and ordinary interaction. Combat selection is separate so the two concepts can coexist in the same area without one contract accumulating unrelated responsibilities.

## Target selection

Only live, registered targets inside acquisition range are candidates. Candidates sort by squared distance and then stable runtime ID. A small switch bias prevents noisy target changes when candidates are nearly equal. Removing a target invalidates it immediately; dead, removed, and out-of-range targets cannot remain selectable.

Three deterministic targets are created by `Game`:

1. `combat-dummy-01` at `(1.25, 0, 3.55)`;
2. `combat-dummy-02` at `(2.30, 0, 4.55)`;
3. `combat-dummy-03` at `(1.75, 0, 5.85)`.

Each receives explicit collision registration and explicit combat-target registration.

## Attack lifecycle

An intentional attack press while ready validates the currently selected target, locks it for the cycle, stops harvesting, stops current movement, faces the target through the existing player orientation path, and begins the appropriate right/left fist pose.

The attack applies no damage on button/key press. At normalized time 0.38 it revalidates that the locked target is registered, alive, and inside hit range, then applies exactly one 6-damage impact. Large frame deltas cannot duplicate that impact. A target dying, being removed, or leaving hit range before impact receives no damage.

Movement is committed only before impact. Once impact has been crossed, movement is permitted during recovery, although a new attack cannot start until the 1.8 attacks/second cycle returns to ready. There is no hidden input queue or automatic tap/hold cadence.

## Input and UI

- `F` issues one attack request on a non-repeated keydown.
- The existing HUD attack button issues one request on pointerdown and does not repeat while held.
- Inventory, Crafting, and the Fidelity panel suppress both gameplay action inputs.
- The attack button displays unavailable, in-range, out-of-range, pressed, and recovery states without replacing the existing HUD shell or icon.
- The target presentation displays `Combat Dummy`, current health, and a compact health bar.
- A fixed pool of damage elements displays `-6`; it does not create unbounded DOM nodes.

## Animation and presentation

Fists alternate right then left. The pose is applied through the existing character pivots and uses the centralized impact time, allowing equipped sleeves and the existing procedural hierarchy to remain synchronized. The character mesh, collision radius, camera, world, equipment visuals, and harvesting rig are not rebuilt.

Combat Dummies use original procedural geometry and shared materials. The current target receives a ring and health display. Accepted impacts produce restrained recoil and damage feedback. Death unregisters combat targeting and collision immediately, plays a short fall/shrink presentation, and disposes the dummy visuals. No loot, corpse interaction, AI, or reward is created.

F3 freeze supplies zero presentation delta and skips combat simulation, so attacks, recoil, and death motion do not advance during comparison frames. F2 diagnostics expose selected target, distance, health, combat state, last fist, damage, and attack rate.

## Verification

Run:

```bash
npm run test:combat
```

The deterministic combat suite covers centralized calibration, HealthPool clamping and one-shot death, the seven-hit dummy calibration, selection order/ties/removal/range, target locking, impact timing, one-impact guarantees under large deltas, cooldown/movement gating, pre-impact invalidation, fist alternation, keyboard repeat suppression, existing item/equipment/crafting boundaries, HUD wiring, explicit registration/cleanup, and the absence of tool-combat coupling.

The full regression pass also runs all earlier milestone verification commands and `npm run build`.

## Explicitly deferred

Milestone 09 does not implement Zombies, enemy AI, player health or death, damage intake, armor mitigation, weapons, equipped-tool combat, durability, combo systems, knockback physics, stamina, enemy loot, audio, save/load, or persistence.
