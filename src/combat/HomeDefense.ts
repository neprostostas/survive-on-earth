/**
 * Home defense probe waves (pure encounter defs for HordeController).
 */
import type { HordeEncounterDef } from "./HordeController.ts";

/** Hold-the-gate style probe at Home — 3 short waves. */
export const HOME_GATE_DEFENSE: HordeEncounterDef = Object.freeze({
  id: "home-gate-probe",
  waves: Object.freeze([
    Object.freeze({ archetype: "shambler" as const, count: 3, delay: 0 }),
    Object.freeze({ archetype: "runner-infected" as const, count: 2, delay: 6 }),
    Object.freeze({ archetype: "marauder-scout" as const, count: 2, delay: 8 }),
  ]),
});

export function isHomeDefenseContractHint(hint: string): boolean {
  const h = hint.toLowerCase();
  return h === "home" || h.includes("home") || h.includes("gate");
}

/** Ring spawn around home yard (world units). */
export function homeDefenseSpawnPoint(index: number): { x: number; y: number; z: number } {
  const angle = (index * 2.39996) % (Math.PI * 2);
  const radius = 12 + (index % 4) * 0.85;
  return Object.freeze({
    x: Math.cos(angle) * radius,
    y: 0,
    z: Math.sin(angle) * radius,
  });
}
