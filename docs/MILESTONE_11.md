# Milestone 11 — Defensive Combat / Armor Damage Mitigation

## Status

Complete. M11 applies LDOE-style Player armor mitigation to incoming enemy damage without durability, enemy armor, respawn, weapons, or new enemy types.

## Goal

Roaming Zombie impacts still emit **raw** damage `6`. At impact resolution time the Player path reads live `PlayerEquipment.totalArmor`, applies armor mitigation, rounds final damage to the nearest whole number, then writes that final amount into the existing Player `HealthPool`.

## Reference formula

LDOE armor rule:

```text
DamageReduction = Armor / (Armor + 50/3)
DamageTakenMultiplier = 1 - DamageReduction
unroundedDamage = rawDamage × DamageTakenMultiplier
finalDamage = round(unroundedDamage)
```

Production implementation is pure and centralized in `src/combat/ArmorMitigation.ts` with a single constant `ARMOR_DAMAGE_CONSTANT = 50 / 3`. Rounding uses nearest-whole-number (`Math.round`).

## Current equipment examples

Production metadata is unchanged from M07:

| Item | Slot | Armor |
|------|------|------:|
| Dad Hat | head | 2 |
| Shirt | torso | 3 |
| Cargo Pants | legs | 3 |
| Sneakers | feet | 0 |

Full current set totalArmor = **8**. Sneakers remain visual/occupancy-only for damage purposes.

For raw damage `6`:

| Armor | Final |
|------:|------:|
| 0–1 | 6 |
| 2–5 | 5 |
| 6–11 | 4 |
| 12–23 | 3 |

Project acceptance baselines:

- Armor 0 → final 6 → `100 → 94`
- Armor 8 → final 4 → `100 → 96`
- Exactly 25 successful full-armor impacts (final 4) reduce `100 → 0`

## Player damage flow

```text
RoamingZombie (raw 6)
→ EnemySystem impact callback
→ PlayerDamageResolver.applyRawDamage(raw)
→ PlayerEquipment.totalArmor (live)
→ calculateArmorMitigatedDamage
→ HealthPool.applyDamage(final)
→ onPlayerDamage feedback uses finalDamage
```

Architecture boundaries:

- `PlayerEquipment` remains the armor source of truth.
- Armor is read at **impact time**, not attack windup start; equip/unequip mid-attack affects the next impact immediately.
- `RoamingZombie` and pure enemy AI stay equipment-agnostic and keep profile damage as raw `6`.
- `HealthPool` remains armor-agnostic; it never imports equipment or the LDOE formula.
- `EnemySystem` does not own or cache armor; it delegates through `applyIncomingDamage`.

## Raw vs final damage

- Profile/source damage: always raw (`ROAMING_ZOMBIE_PROFILE.damage = 6`).
- Player HUD HP: receives only final mitigated amounts.
- World damage numbers for Player hits: display `finalDamage` (`-6` unarmored, `-4` with armor 8).
- Outgoing fists and enemy HP paths are unchanged (still six-damage punches; zombie dies after seven impacts).

## Debug and freeze

- F2 Player diagnostics report live `ARMOR`, last raw/final damage and reduction from the production `PlayerDamageResolver.lastResult`.
- F3 freeze still supplies zero enemy delta; no mitigation event can fire while frozen.

## Tests

```bash
npm run test:armor
```

Coverage includes the pure formula matrix, production equipment metadata totals, resolver integration for bare/partial/full armor, live equip and unequip between hits, impact-time equip/unequip during windup, dual-zombie independent mitigation, full-armor defeat (25 hits), enemy raw profile integrity, and domain boundary guards (no durability fields, no HealthPool/enemy armor coupling).

## Explicitly deferred

Armor durability/wear/breaking/repair, enemy armor mitigation, armor penetration, damage types, dodge/block/parry, healing, respawn/corpse/item loss, weapon/tool equipment, enemy variants/loot/XP, and related scope remain out of M11.
