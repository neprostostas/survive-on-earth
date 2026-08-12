import type { ItemId } from "../items/ItemId.ts";
import type { PlayerInventory } from "../inventory/PlayerInventory.ts";

export type LockKind = "key" | "access-card" | "code" | "power" | "quest";

export interface LockState {
  readonly id: string;
  readonly kind: LockKind;
  readonly requiredKey?: ItemId;
  readonly code?: string;
  locked: boolean;
  powered?: boolean;
}

/**
 * Generic world locks for doors, chests, terminals.
 * Does not own meshes — Game/location layers wire visuals.
 */
export class LockSystem {
  private readonly locks = new Map<string, LockState>();

  register(lock: Omit<LockState, "locked"> & { locked?: boolean }): void {
    this.locks.set(lock.id, {
      ...lock,
      locked: lock.locked ?? true,
    });
  }

  get(id: string): LockState | null {
    return this.locks.get(id) ?? null;
  }

  isLocked(id: string): boolean {
    return this.locks.get(id)?.locked ?? false;
  }

  tryUnlockWithInventory(id: string, inventory: PlayerInventory, code?: string): { ok: boolean; reason: string | null } {
    const lock = this.locks.get(id);
    if (!lock) return { ok: false, reason: "missing" };
    if (!lock.locked) return { ok: true, reason: null };
    if (lock.kind === "power") {
      if (!lock.powered) return { ok: false, reason: "no-power" };
      lock.locked = false;
      return { ok: true, reason: null };
    }
    if (lock.kind === "code") {
      if (!code || code !== lock.code) return { ok: false, reason: "bad-code" };
      lock.locked = false;
      return { ok: true, reason: null };
    }
    if (lock.kind === "quest") return { ok: false, reason: "quest-required" };
    if (!lock.requiredKey) return { ok: false, reason: "no-key-def" };
    const slot = inventory.findFirstSlotByItemId(lock.requiredKey);
    if (slot === null) return { ok: false, reason: "need-key" };
    // Access cards & badges retained; single-use rusted keys consumed.
    if (lock.requiredKey === "rusted-key" || lock.requiredKey === "maintenance-key" || lock.requiredKey === "vault-key") {
      const stack = inventory.getSlot(slot).stack;
      if (stack) inventory.exchangeWholeStack(slot, stack, null);
    }
    lock.locked = false;
    return { ok: true, reason: null };
  }

  setPowered(id: string, powered: boolean): void {
    const lock = this.locks.get(id);
    if (!lock) return;
    lock.powered = powered;
  }

  /** Re-seal after a dungeon cycle (also cuts power on breaker locks). */
  relock(id: string): boolean {
    const lock = this.locks.get(id);
    if (!lock) return false;
    lock.locked = true;
    if (lock.kind === "power") lock.powered = false;
    return true;
  }

  serialize(): readonly { id: string; locked: boolean; powered?: boolean }[] {
    return Object.freeze([...this.locks.values()].map((l) => Object.freeze({
      id: l.id,
      locked: l.locked,
      powered: l.powered,
    })));
  }

  load(rows: readonly { id: string; locked: boolean; powered?: boolean }[] | undefined): void {
    if (!rows) return;
    for (const row of rows) {
      const lock = this.locks.get(row.id);
      if (!lock) continue;
      lock.locked = !!row.locked;
      if (row.powered !== undefined) lock.powered = row.powered;
    }
  }
}
