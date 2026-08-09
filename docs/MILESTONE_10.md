# Milestone 10 — Roaming Zombie / Enemy AI + Player Health Foundation

## Status and scope

Complete. M10 adds one production-style hostile type, live Player health, enemy-to-Player melee damage, and a minimal terminal defeated gate. It deliberately does not add enemy variants, loot, XP, healing, armor mitigation, pathfinding, respawn, weapon equipment, or durability.

## Reference and project calibration

Verified LDOE reference used for the basic Roaming Zombie is 40 HP, 0 Armor, 6 Damage, movement-speed reference 14, and an attack speed described as “Very Slow”. Player base health is 100 HP.

The current Survive on Earth world uses centralized project calibration:

- maximum health: 40;
- damage: 6;
- movement speed: 1.6 world units/second;
- attack rate: 0.8/second;
- derived attack cycle: 1.25 seconds;
- normalized impact time: 0.42;
- acquire/lose ranges: 4.0/8.0;
- attack-start/hit ranges: 1.05/1.15;
- collision radius: 0.3.

Numeric cadence, world movement speed, impact timing, and ranges are project values for the current scale, not claimed internal LDOE constants.

## Health and Player defeat

The existing pure `HealthPool` is reused by Combat Dummies, Roaming Zombies, and the Player. The Player owns one 100-health pool; HUD, F2, EnemySystem, and the defeat gate read that production state rather than storing duplicate HP.

A successful enemy impact applies 6 raw damage and 6 final damage. Equipment armor metadata remains visible but has no reduction formula. Health clamps at zero and the `becameDead` transition occurs once.

At zero health, M10 enters a temporary terminal `PLAYER DEFEATED` gameplay state: movement and joystick input stop, Player Attack is cancelled/suppressed, harvesting is cancelled, contextual actions are gated, Inventory/Crafting close and cannot reopen, and enemies stop attacking. Rendering continues. There is no corpse, dropped inventory, respawn, teleport, timer, healing, or regeneration; reload starts another calibration session.

## Enemy architecture

`RoamingZombie` is a pure deterministic state machine and an implementation of the unchanged `CombatTarget` contract. `CombatTargetSystem` remains the only selector used by Player melee. `InteractionSystem` remains contextual-world-interaction only. Combat Dummy remains passive: being a CombatTarget does not imply AI.

`EnemySystem` is a narrow coordinator for registered Roaming Zombies. It supplies actual Player position/alive state, advances each agent independently, applies impacts to Player HealthPool, and performs one-shot unregister/collision/death cleanup. Babylon geometry and animation live in `EnemyPresentation`.

## AI states and aggro

The states are `IDLE`, `CHASE`, `ATTACK`, `RECOVERY`, and `DEAD`.

- IDLE acquires a living Player at 4.0 units.
- An already aggressive Zombie remains aggressive through 8.0 units.
- Positive Player damage provokes a surviving Zombie without a faction or attribution framework.
- CHASE faces and directly steers toward current Player position at 1.6 units/second.
- Entering 1.05 units starts a stationary timed attack.
- Impact occurs once at normalized 0.42 and revalidates Player life and 1.15 hit range.
- Moving outside hit range makes the attack miss; there is no homing or sliding during the cycle.
- Recovery completes the derived 1.25-second cycle before chase/attack can start again.
- A dead Zombie immediately leaves AI and combat selection, so a pending attack cannot damage the Player.

Detection is radial with no line of sight, vision cone, hearing, noise, stealth, or shared group aggro.

## Collision and update order

Enemy movement reuses `CollisionWorld` and logical XZ circles. Dynamic enemy collision centers are synchronized after each resolved move; an enemy ignores its own circle but can collide with existing world blockers and other combat fixtures. Zombies do not push the Player and stop through logical melee spacing.

Movement is direct steering only. There is no physics, navmesh, A*, obstacle graph, or waypoint planning. If a building/tree/rock blocks the straight line, the Zombie may get stuck.

The relevant deterministic frame order is Player input/movement → Player melee impact → enemy AI/attack impact → interaction/harvesting → presentation/HUD. Therefore a Player lethal impact resolves and unregisters the enemy before that enemy can update later in the frame.

## Combat, presentation, and fixtures

Player fists retain 6 damage and 1.8 attacks/second. Roaming Zombie health follows `40 → 34 → 28 → 22 → 16 → 10 → 4 → 0`, so seven successful fist impacts kill a fresh enemy. The existing target ring, target health display, and pooled `-6` feedback are reused.

The original procedural Zombie visual is Player-scale and combines an unhealthy palette, hunched body, asymmetric arms, idle sway, slow shamble, windup/swipe/recovery pose, short hit recoil, and death fall/cleanup. Animation is presentation-only; game timing remains authoritative.

Three deterministic fixtures are registered:

1. `roaming-zombie-01` at `(-1.5, 0, 10)`;
2. `roaming-zombie-02` at `(4.6, 0, 8.5)`;
3. `roaming-zombie-03` at `(-5.5, 0, 6.5)`.

They are calibration fixtures, not a production spawn system. Existing M09 dummies remain present.

## System coexistence

Zombie aggro or Player damage does not automatically cancel harvesting. Choosing Player Attack keeps the M09 cancellation path. Inventory/Crafting suppress Player controls but do not pause enemy AI, so a Zombie may chase and damage the Player behind an open panel. A lethal hit closes those panels.

F3 motion freeze passes zero delta to enemy AI, movement, attack impact, animations, hit feedback, and death motion. F2 reads actual Player HealthPool, EnemySystem agent state, CombatTargetSystem selection, enemy distance/health, and last result.

## Verification

`npm run test:enemies` covers profile constants, Player health/clamping, deterministic aggro and hysteresis, damage provocation, chase displacement, stationary attack timing, exactly-once damage, cadence, dodge miss, dead-attacker cancellation, seven-hit kill, passive dummy distinction, independent multiple hits, terminal defeat, registration/cleanup, and dependency/scope boundaries.

The full regression pass includes every M01–M09 verification command, `test:enemies`, production build, and git whitespace validation. Manual browser flows cover visible pacing, collision, responsive HUD, F2/F3, panels, defeat, and runtime console when a browser is available.

## Explicitly deferred

Fast Biter and all other variants, random spawning, patrols, group AI, line of sight, pathfinding, stealth/sneak damage, special/ranged attacks, poison, stun, knockback, i-frames, enemy loot, corpses, XP, Player respawn/corpse/item loss, healing/regeneration, hunger/thirst, armor reduction/durability, weapons/tools as equipment or combat sources, crafted-tool harvesting integration, critical hits, AUTO combat, audio, gore, screen shake, and persistence are not implemented.
