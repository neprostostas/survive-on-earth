/**
 * Authored locked containers + support interactables (pure domain).
 */
import type { ItemId } from "../items/ItemId.ts";
import type { LocationId } from "../locations/LocationRegistry.ts";

export type LockedSupportKind = "key-stash" | "breaker";

export interface LockedSiteSupport {
  readonly id: string;
  readonly kind: LockedSupportKind;
  readonly x: number;
  readonly z: number;
  /** Seeded into key-stash containers. */
  readonly keyItem?: ItemId;
  readonly title?: string;
}

export interface LockedSiteDef {
  readonly lockId: string;
  readonly locationId: LocationId;
  readonly containerId: string;
  readonly title: string;
  readonly x: number;
  readonly z: number;
  readonly capacity: number;
  readonly lootProfile: string;
  readonly support?: LockedSiteSupport;
}

export const LOCKED_SITES: readonly LockedSiteDef[] = Object.freeze([
  Object.freeze({
    lockId: "motel-room-7",
    locationId: "derelict-motel" as const,
    containerId: "lock-chest:motel-room-7",
    title: "Room 7 Safe",
    x: 2.4,
    z: -1.2,
    capacity: 6,
    lootProfile: "event-supply",
    support: Object.freeze({
      id: "lock-support:motel-desk",
      kind: "key-stash" as const,
      x: -1.6,
      z: 2.0,
      keyItem: "rusted-key" as const,
      title: "Reception Desk",
    }),
  }),
  Object.freeze({
    lockId: "factory-warehouse",
    locationId: "abandoned-factory" as const,
    containerId: "lock-chest:factory-warehouse",
    title: "Warehouse Cage",
    x: 3.0,
    z: 1.5,
    capacity: 8,
    lootProfile: "industrial-loot",
    support: Object.freeze({
      id: "lock-support:factory-breaker",
      kind: "breaker" as const,
      x: -2.2,
      z: 2.4,
      title: "Breaker Box",
    }),
  }),
  Object.freeze({
    lockId: "bunker-armory",
    locationId: "bunker-echo" as const,
    containerId: "lock-chest:bunker-armory",
    title: "Armory Locker",
    x: -2.0,
    z: -1.8,
    capacity: 8,
    lootProfile: "raid-mid",
    support: Object.freeze({
      id: "lock-support:bunker-office",
      kind: "key-stash" as const,
      x: 2.2,
      z: 2.6,
      keyItem: "security-badge" as const,
      title: "Security Desk",
    }),
  }),
]);

export function lockIdFromContainerId(containerId: string): string | null {
  if (!containerId.startsWith("lock-chest:")) return null;
  return containerId.slice("lock-chest:".length) || null;
}

export function lockedSitesAt(locationId: LocationId): readonly LockedSiteDef[] {
  return Object.freeze(LOCKED_SITES.filter((s) => s.locationId === locationId));
}

export function isLockSupportId(interactionId: string): boolean {
  return interactionId.startsWith("lock-support:");
}

export function lockSupportSite(interactionId: string): LockedSiteDef | null {
  return LOCKED_SITES.find((s) => s.support?.id === interactionId) ?? null;
}
