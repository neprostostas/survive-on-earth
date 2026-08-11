import type { EnergyPool } from "../survival/NeedPool.ts";
import {
  effectiveEnergyCost,
  getLocation,
  LOCATION_REGISTRY,
  type DiscoveryState,
  type LocationDefinition,
  type LocationId,
} from "./LocationRegistry.ts";

export type LocationChangeListener = (previous: LocationId, next: LocationId) => void;
export type TravelMode = "walk" | "run" | "vehicle";

/**
 * Session location / travel controller with discovery fog + multi-mode travel.
 * Full Babylon world swap layered by Game via listener hooks.
 */
export class LocationManager {
  private current: LocationId = "home";
  private readonly unlocked = new Set<LocationId>(
    LOCATION_REGISTRY.filter((l) => l.unlockedByDefault).map((l) => l.id),
  );
  private readonly discovered = new Set<LocationId>(
    LOCATION_REGISTRY.filter((l) => l.unlockedByDefault).map((l) => l.id),
  );
  private readonly visited = new Set<LocationId>(["home"]);
  private readonly completed = new Set<LocationId>();
  private readonly listeners = new Set<LocationChangeListener>();
  private bunkerAccessGranted = false;
  private bunkerSecurityLevel = 0;
  private bunkerFloorUnlocked = new Set<LocationId>(["bunker-echo"]);
  private travelMode: TravelMode = "walk";
  private vehicleAvailable = false;

  constructor(private readonly energy: EnergyPool) {}

  get currentId(): LocationId { return this.current; }
  get currentDefinition(): LocationDefinition { return getLocation(this.current); }
  get unlockedIds(): readonly LocationId[] { return Object.freeze([...this.unlocked]); }
  get hasBunkerAccess(): boolean { return this.bunkerAccessGranted; }
  get securityLevel(): number { return this.bunkerSecurityLevel; }
  get mode(): TravelMode { return this.travelMode; }
  get hasVehicle(): boolean { return this.vehicleAvailable; }

  setTravelMode(mode: TravelMode): void {
    if (mode === "vehicle" && !this.vehicleAvailable) return;
    this.travelMode = mode;
  }

  unlockVehicle(): void {
    this.vehicleAvailable = true;
  }

  grantBunkerAccess(): void {
    this.bunkerAccessGranted = true;
    this.unlocked.add("bunker-echo");
    this.discover("bunker-echo");
  }

  setSecurityLevel(level: number): void {
    this.bunkerSecurityLevel = Math.max(0, Math.min(5, Math.floor(level)));
    if (this.bunkerSecurityLevel >= 2) {
      this.bunkerFloorUnlocked.add("bunker-echo-f2");
      this.unlock("bunker-echo-f2");
    }
    if (this.bunkerSecurityLevel >= 3) {
      this.bunkerFloorUnlocked.add("bunker-echo-f3");
      this.unlock("bunker-echo-f3");
    }
    if (this.bunkerSecurityLevel >= 4) {
      this.bunkerFloorUnlocked.add("bunker-echo-f4");
      this.unlock("bunker-echo-f4");
    }
    if (this.bunkerSecurityLevel >= 5) {
      this.bunkerFloorUnlocked.add("bunker-echo-f5");
      this.unlock("bunker-echo-f5");
    }
  }

  unlock(id: LocationId): void {
    this.unlocked.add(id);
    this.discover(id);
  }

  discover(id: LocationId): void {
    this.discovered.add(id);
  }

  markCompleted(id: LocationId): void {
    this.completed.add(id);
  }

  isUnlocked(id: LocationId): boolean { return this.unlocked.has(id); }
  isDiscovered(id: LocationId): boolean { return this.discovered.has(id); }
  isVisited(id: LocationId): boolean { return this.visited.has(id); }
  isCompleted(id: LocationId): boolean { return this.completed.has(id); }

  discoveryState(id: LocationId): DiscoveryState {
    if (this.completed.has(id)) return "completed";
    if (this.visited.has(id)) return "visited";
    if (this.unlocked.has(id)) return "discovered";
    if (this.discovered.has(id)) return "undiscovered";
    return "hidden";
  }

  canTravelTo(id: LocationId): { ok: boolean; reason: string | null; energyCost: number } {
    const cost = effectiveEnergyCost(id, this.travelMode);
    if (id === this.current) return { ok: false, reason: "already-here", energyCost: cost };
    if (!this.unlocked.has(id)) return { ok: false, reason: "locked", energyCost: cost };
    const dest = getLocation(id);
    if (dest.type === "bunker" || dest.parentLocation === "bunker-echo") {
      if ((id === "bunker-echo" || dest.parentLocation === "bunker-echo") && !this.bunkerAccessGranted) {
        return { ok: false, reason: "need-access-card", energyCost: cost };
      }
      if (id === "bunker-echo-f2" && !this.bunkerFloorUnlocked.has("bunker-echo-f2")) {
        return { ok: false, reason: "floor-locked", energyCost: cost };
      }
      if (id === "bunker-echo-f3" && !this.bunkerFloorUnlocked.has("bunker-echo-f3")) {
        return { ok: false, reason: "floor-locked", energyCost: cost };
      }
      if (id === "bunker-echo-f4" && !this.bunkerFloorUnlocked.has("bunker-echo-f4")) {
        return { ok: false, reason: "floor-locked", energyCost: cost };
      }
      if (id === "bunker-echo-f5" && !this.bunkerFloorUnlocked.has("bunker-echo-f5")) {
        return { ok: false, reason: "floor-locked", energyCost: cost };
      }
    }
    if (this.travelMode === "vehicle" && !this.vehicleAvailable) {
      return { ok: false, reason: "no-vehicle", energyCost: cost };
    }
    if (this.energy.value < cost) return { ok: false, reason: "no-energy", energyCost: cost };
    return { ok: true, reason: null, energyCost: cost };
  }

  /**
   * Overworld proximity entry — energy already spent while walking the map.
   * Home is always free to re-enter when unlocked.
   */
  canEnterFromMap(id: LocationId): { ok: boolean; reason: string | null } {
    if (!this.unlocked.has(id)) return { ok: false, reason: "Locked" };
    const dest = getLocation(id);
    if (dest.parentLocation) return { ok: false, reason: "Use parent entrance" };
    if (id === "bunker-echo" && !this.bunkerAccessGranted) {
      return { ok: false, reason: "Need bunker access card" };
    }
    if (this.energy.isEmpty && id !== "home") {
      return { ok: false, reason: "Exhausted — walk home or rest" };
    }
    return { ok: true, reason: null };
  }

  /** Enter without recharging the old flat travel tax (paid on overworld walk). */
  enterFromMap(id: LocationId): { accepted: boolean; reason: string | null } {
    const check = this.canEnterFromMap(id);
    if (!check.ok) return { accepted: false, reason: check.reason };
    const previous = this.current;
    this.current = id;
    this.visited.add(id);
    this.discover(id);
    for (const listener of this.listeners) listener(previous, id);
    return { accepted: true, reason: null };
  }

  travelTo(id: LocationId): { accepted: boolean; reason: string | null } {
    const check = this.canTravelTo(id);
    if (!check.ok) return { accepted: false, reason: check.reason };
    this.energy.drain(check.energyCost);
    const previous = this.current;
    this.current = id;
    this.visited.add(id);
    this.discover(id);
    for (const listener of this.listeners) listener(previous, id);
    return { accepted: true, reason: null };
  }

  /** Free teleport home without energy (respawn). */
  forceSet(id: LocationId): void {
    const previous = this.current;
    this.current = id;
    this.unlocked.add(id);
    this.visited.add(id);
    this.discover(id);
    for (const listener of this.listeners) listener(previous, id);
  }

  unlockByLevel(level: number): void {
    if (level >= 1) {
      this.unlock("pine-woods");
      this.unlock("limestone-ridge");
      this.unlock("old-highway");
      this.unlock("abandoned-camp");
      this.unlock("riverbank");
      this.unlock("silt-cataract");
      this.unlock("survivor-camp");
    }
    if (level >= 3) this.unlock("dense-forest");
    if (level >= 3) this.unlock("copperleaf-basin");
    if (level >= 4) this.unlock("gas-station");
    if (level >= 5) this.unlock("industrial-yard");
    if (level >= 6) this.unlock("derelict-motel");
    if (level >= 6) this.unlock("wayfarer-post");
    if (level >= 7) this.unlock("abandoned-factory");
    if (level >= 8) this.unlock("frozen-pine-valley");
    if (level >= 8) this.unlock("swamp-hollow");
    if (level >= 9) this.unlock("glass-caldera");
    if (level >= 9) this.unlock("marauder-camp");
    if (level >= 9) this.unlock("hunters-cabin");
    if (level >= 10) this.unlock("underground-depot");
    if (level >= 10) this.unlock("greyhaven-outskirts");
    if (level >= 11) this.unlock("ironbound-fort");
    if (level >= 12) this.unlock("greyhaven-residential");
    if (level >= 12) this.unlock("blacksite-ruins");
    if (level >= 13) this.unlock("greyhaven-commercial");
    if (level >= 13) this.unlock("smuggler-harbor");
    if (level >= 14) this.unlock("greyhaven-industrial");
    if (level >= 14) this.unlock("metro-central");
    if (level >= 15) this.unlock("abandoned-hospital");
    if (level >= 15) this.unlock("desert-ruin");
    if (level >= 16) this.unlock("ironbound-prison");
    if (level >= 16) this.unlock("wayfarer-airport");
    if (level >= 17) this.unlock("coastal-power-plant");
    if (level >= 18) this.unlock("blacksite-core");
    if (level >= 18) this.unlock("ash-jackal-outpost");
    if (level >= 19) this.unlock("deep-mine");
    if (level >= 20) this.unlock("exclusion-safehouse");
    if (level >= 22) this.unlock("exclusion-wastes");
    if (level >= 25) this.unlock("helix-core");
  }

  serialize(): {
    current: LocationId;
    unlocked: LocationId[];
    discovered: LocationId[];
    visited: LocationId[];
    completed: LocationId[];
    bunkerAccess: boolean;
    security: number;
    floors: LocationId[];
    vehicle: boolean;
    mode: TravelMode;
  } {
    return {
      current: this.current,
      unlocked: [...this.unlocked],
      discovered: [...this.discovered],
      visited: [...this.visited],
      completed: [...this.completed],
      bunkerAccess: this.bunkerAccessGranted,
      security: this.bunkerSecurityLevel,
      floors: [...this.bunkerFloorUnlocked],
      vehicle: this.vehicleAvailable,
      mode: this.travelMode,
    };
  }

  load(data: Partial<ReturnType<LocationManager["serialize"]>>): void {
    if (data.current && LOCATION_REGISTRY.some((l) => l.id === data.current)) this.current = data.current;
    this.unlocked.clear();
    this.discovered.clear();
    this.visited.clear();
    this.completed.clear();
    for (const id of data.unlocked ?? []) if (LOCATION_REGISTRY.some((l) => l.id === id)) this.unlocked.add(id);
    for (const id of data.discovered ?? []) if (LOCATION_REGISTRY.some((l) => l.id === id)) this.discovered.add(id);
    for (const id of data.visited ?? []) if (LOCATION_REGISTRY.some((l) => l.id === id)) this.visited.add(id);
    for (const id of data.completed ?? []) if (LOCATION_REGISTRY.some((l) => l.id === id)) this.completed.add(id);
    this.bunkerAccessGranted = !!data.bunkerAccess;
    this.bunkerSecurityLevel = data.security ?? 0;
    this.bunkerFloorUnlocked = new Set(data.floors ?? ["bunker-echo"]);
    this.vehicleAvailable = !!data.vehicle;
    this.travelMode = data.mode ?? "walk";
    // Ensure at least defaults
    for (const l of LOCATION_REGISTRY.filter((x) => x.unlockedByDefault)) {
      this.unlocked.add(l.id);
      this.discovered.add(l.id);
    }
  }

  subscribe(listener: LocationChangeListener): () => void {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }
}
