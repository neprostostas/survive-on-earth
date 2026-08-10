import { Color3 } from "@babylonjs/core/Maths/math.color";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { Mesh } from "@babylonjs/core/Meshes/mesh";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { LinesMesh } from "@babylonjs/core/Meshes/linesMesh";
import type { Scene } from "@babylonjs/core/scene";
import type { Engine } from "@babylonjs/core/Engines/engine";
import type { CalibrationConfig } from "../config/calibrationConfig";
import type { CollisionWorld } from "../collision/CollisionWorld";
import type { Player } from "../player/Player";
import { WorldGrid } from "../world/WorldGrid";
import { GAME_CONFIG } from "../config/gameConfig";
import type { InteractionSystem } from "../interaction/InteractionSystem";
import type { World } from "../world/World";
import type { PostProcessing } from "../rendering/PostProcessing";
import type { HarvestingSystem } from "../harvesting/HarvestingSystem";
import type { ResourceResultFeedback } from "../ui/ResourceResultFeedback";
import type { GroundLootSystem } from "../ground-loot/GroundLootSystem";
import type { TemporaryPickupResultSink } from "../ground-loot/PickupResult";
import { GroundLoot } from "../ground-loot/GroundLoot";
import type { PlayerInventory } from "../inventory/PlayerInventory";
import type { PlayerEquipment } from "../equipment/PlayerEquipment";
import type { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot";
import type { PlayerBackpackSlot } from "../equipment/PlayerBackpackSlot";
import type { EquipmentSystem } from "../equipment/EquipmentSystem";
import type { CraftingSystem } from "../crafting/CraftingSystem";
import type { CombatTargetSystem } from "../combat/CombatTargetSystem";
import type { MeleeCombatSystem } from "../combat/MeleeCombatSystem";
import { COMBAT_CONFIG } from "../combat/combatConfig";
import { describeWeaponStack } from "../combat/resolvePlayerMeleeProfile";
import type { EnemySystem } from "../enemies/EnemySystem";
import type { PlayerDamageResolver } from "../combat/PlayerDamageResolver";
import { ROAMING_ZOMBIE_PROFILE } from "../enemies/enemyConfig";
import type { FidelityMode } from "./FidelityMode";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { calculateArmorMitigatedDamage } from "../combat/ArmorMitigation";
import type { InputController } from "../input/InputController";
import { bindDraggableCollapsiblePanel } from "./panelChrome";
import { HarvestToolResolver } from "../harvesting/HarvestToolResolver";
import type { HarvestDeliveryResult } from "../harvesting/HarvestRewardDelivery";
import { countStarterFixtures } from "../ground-loot/starterGroundResources";

export interface DebugPanelSources {
  readonly input: InputController;
  readonly isInventoryOpen: () => boolean;
  readonly isCraftingOpen: () => boolean;
  readonly lastHarvestDelivery?: () => HarvestDeliveryResult | null;
}

export class DebugOverlay {
  private visible = false;
  private showRanges = false;
  private readonly root: HTMLElement;
  private readonly body: HTMLElement;
  private readonly rangesToggle: HTMLInputElement;
  private readonly playerCollider: Mesh;
  private readonly forwardLine: LinesMesh;
  private readonly velocityLine: LinesMesh;
  private readonly axes: LinesMesh;
  private readonly interactionRange: Mesh;
  private readonly interactionTargetRadius: Mesh;
  private readonly combatAcquireRing: Mesh;
  private readonly combatHitRing: Mesh;
  private readonly enemyAcquireRing: Mesh;
  private readonly enemyLoseRing: Mesh;
  private grid: WorldGrid;
  private obstacleMeshes: Mesh[] = [];
  private obstacleSignature = "";
  private readonly wireMaterial: StandardMaterial;
  private readonly combatWireMaterial: StandardMaterial;
  private readonly enemyWireMaterial: StandardMaterial;

  constructor(
    root: HTMLElement,
    private readonly scene: Scene,
    private readonly engine: Engine,
    private readonly player: Player,
    private readonly collision: CollisionWorld,
    private readonly interaction: InteractionSystem,
    private readonly harvesting: HarvestingSystem,
    private readonly itemResults: ResourceResultFeedback,
    private readonly groundLoot: GroundLootSystem,
    private readonly pickupResults: TemporaryPickupResultSink,
    private readonly inventory: PlayerInventory,
    private readonly equipment: PlayerEquipment,
    private readonly equipmentSystem: EquipmentSystem,
    private readonly weaponSlot: PlayerWeaponSlot,
    private readonly backpackSlot: PlayerBackpackSlot,
    private readonly crafting: CraftingSystem,
    private readonly combatTargets: CombatTargetSystem,
    private readonly combat: MeleeCombatSystem,
    private readonly enemies: EnemySystem,
    private readonly playerDamage: PlayerDamageResolver,
    private readonly fidelity: FidelityMode,
    private readonly world: World,
    private readonly postProcessing: PostProcessing,
    private readonly config: CalibrationConfig,
    private readonly sources: DebugPanelSources,
  ) {
    this.root = document.createElement("div");
    this.root.className = "debug-overlay";
    this.root.innerHTML = [
      `<header class="debug-overlay-header">`,
      `<div><small>PRODUCTION DEBUG · M01–M15</small><h2>F2 Debug</h2></div>`,
      `<div class="panel-header-actions">`,
      `<label class="panel-toggle-label" title="Toggle combat/enemy range rings"><input type="checkbox" data-role="ranges" /> ranges</label>`,
      `<button type="button" data-role="collapse" aria-label="Collapse">−</button>`,
      `<span class="panel-key">F2</span>`,
      `</div></header>`,
      `<pre class="debug-overlay-body"></pre>`,
    ].join("");
    root.append(this.root);
    this.body = this.root.querySelector(".debug-overlay-body") as HTMLElement;
    this.rangesToggle = this.root.querySelector('input[data-role="ranges"]') as HTMLInputElement;
    const collapseBtn = this.root.querySelector('button[data-role="collapse"]') as HTMLButtonElement;
    const header = this.root.querySelector(".debug-overlay-header") as HTMLElement;
    bindDraggableCollapsiblePanel(this.root, header, this.body, collapseBtn);
    this.rangesToggle.addEventListener("change", () => {
      this.showRanges = this.rangesToggle.checked;
      this.applyRangeVisibility();
    });

    this.wireMaterial = this.makeWireMaterial("DebugCollisionMaterial", new Color3(0.2, 1, 0.48));
    this.combatWireMaterial = this.makeWireMaterial("DebugCombatRangeMaterial", new Color3(1, 0.55, 0.2));
    this.enemyWireMaterial = this.makeWireMaterial("DebugEnemyRangeMaterial", new Color3(1, 0.28, 0.32));

    this.playerCollider = MeshBuilder.CreateCylinder("DebugPlayerCollider", { height: 1.5, diameter: 1, tessellation: 20 }, scene);
    this.playerCollider.material = this.wireMaterial;
    this.forwardLine = MeshBuilder.CreateLines("DebugForward", { points: [Vector3.Zero(), Vector3.Forward()], updatable: true }, scene);
    this.forwardLine.color = new Color3(1, 0.75, 0.12);
    this.velocityLine = MeshBuilder.CreateLines("DebugVelocity", { points: [Vector3.Zero(), Vector3.Right()], updatable: true }, scene);
    this.velocityLine.color = new Color3(0.1, 0.8, 1);
    this.axes = MeshBuilder.CreateLineSystem("WorldAxes", { lines: [
      [Vector3.Zero(), new Vector3(4, 0.04, 0)],
      [Vector3.Zero(), new Vector3(0, 0.04, 4)],
      [Vector3.Zero(), new Vector3(0, 4, 0)],
    ] }, scene);
    this.axes.color = new Color3(1, 0.25, 0.2);
    this.axes.isPickable = false;
    this.axes.setEnabled(false);
    this.interactionRange = this.makeRing("DebugInteractionRange", 0.025, this.wireMaterial);
    this.interactionTargetRadius = this.makeRing("DebugInteractionTargetRadius", 0.035, this.wireMaterial);
    this.combatAcquireRing = this.makeRing("DebugCombatAcquire", 0.03, this.combatWireMaterial);
    this.combatHitRing = this.makeRing("DebugCombatHit", 0.04, this.combatWireMaterial);
    this.enemyAcquireRing = this.makeRing("DebugEnemyAcquire", 0.03, this.enemyWireMaterial);
    this.enemyLoseRing = this.makeRing("DebugEnemyLose", 0.028, this.enemyWireMaterial);
    this.grid = new WorldGrid(scene, GAME_CONFIG.worldSize, config.world.gridCellSize);
    this.refreshObstacles();
    this.applyVisibility();
  }

  toggle(): void { this.visible = !this.visible; this.applyVisibility(); }

  refreshObstacles(): void {
    if (Math.abs(this.grid.cellSize - this.config.world.gridCellSize) > 0.0001) {
      this.grid.dispose();
      this.grid = new WorldGrid(this.scene, GAME_CONFIG.worldSize, this.config.world.gridCellSize);
      this.grid.setVisible(this.visible);
    }
    for (const mesh of this.obstacleMeshes) mesh.dispose();
    this.obstacleMeshes = this.collision.obstacles.map((obstacle) => {
      const mesh = obstacle.kind === "circle"
        ? MeshBuilder.CreateCylinder("DebugCircleObstacle", { height: 1.1, diameter: obstacle.radius * 2, tessellation: 16 }, this.scene)
        : MeshBuilder.CreateBox("DebugBoxObstacle", { width: obstacle.halfX * 2, height: 1.1, depth: obstacle.halfZ * 2 }, this.scene);
      mesh.position.set(obstacle.x, 0.55, obstacle.z);
      mesh.material = this.wireMaterial;
      mesh.isPickable = false;
      mesh.setEnabled(this.visible);
      return mesh;
    });
    this.obstacleSignature = this.buildObstacleSignature();
  }

  private syncObstacleMeshes(): void {
    const signature = this.buildObstacleSignature();
    if (signature !== this.obstacleSignature || this.obstacleMeshes.length !== this.collision.obstacles.length) {
      this.refreshObstacles();
      return;
    }
    for (let index = 0; index < this.collision.obstacles.length; index += 1) {
      const obstacle = this.collision.obstacles[index];
      this.obstacleMeshes[index].position.set(obstacle.x, 0.55, obstacle.z);
    }
  }

  private buildObstacleSignature(): string {
    return this.collision.obstacles.map((obstacle) => {
      if (obstacle.kind === "circle") return `c:${obstacle.label}:${obstacle.radius.toFixed(3)}`;
      return `b:${obstacle.label}:${obstacle.halfX.toFixed(3)}:${obstacle.halfZ.toFixed(3)}`;
    }).join("|");
  }

  update(): void {
    if (!this.visible) return;
    this.syncObstacleMeshes();
    const position = this.player.position;
    const yaw = this.player.visual.root.rotation.y;
    const forward = new Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    this.playerCollider.position.set(position.x, 0.75, position.z);
    this.playerCollider.scaling.set(this.config.player.collisionRadius * 2, 1, this.config.player.collisionRadius * 2);
    MeshBuilder.CreateLines("DebugForward", { points: [position.add(new Vector3(0, 0.12, 0)), position.add(forward.scale(1.8)).add(new Vector3(0, 0.12, 0))], instance: this.forwardLine });
    MeshBuilder.CreateLines("DebugVelocity", { points: [position.add(new Vector3(0, 0.18, 0)), position.add(this.player.movement.velocity.scale(0.45)).add(new Vector3(0, 0.18, 0))], instance: this.velocityLine });
    const velocity = this.player.movement.velocity;
    const interactionState = this.interaction.state;
    const harvestingState = this.harvesting.state;
    const lastItemResult = this.itemResults.lastResult;
    const selectedGroundLoot = this.interaction.target instanceof GroundLoot ? this.interaction.target : null;
    const lastPickup = this.pickupResults.lastResult;
    const agents = this.enemies.agents;
    const nearestEnemy = agents.reduce<(typeof agents)[number] | null>((nearest, enemy) => !nearest || enemy.playerDistance < nearest.playerDistance ? enemy : nearest, null);
    const harvestTools = new HarvestToolResolver(this.inventory, this.weaponSlot);
    const hatchetResolved = harvestTools.resolve("hatchet");
    const pickaxeResolved = harvestTools.resolve("pickaxe");
    const weaponDesc = describeWeaponStack(this.weaponSlot.current);
    const activeProfile = this.combat.activeProfile;
    const lastDamage = this.playerDamage.lastResult;
    const combatTarget = this.combatTargets.current;
    const armor = this.equipment.totalArmor;
    const nextHit = calculateArmorMitigatedDamage(ROAMING_ZOMBIE_PROFILE.damage, armor);
    const movement = this.sources.input.getMovement();
    const attackProgress = this.combat.attackProgress;
    const enemyProgress = nearestEnemy?.attackProgress ?? 0;

    this.interactionRange.position.set(position.x, 0.09, position.z);
    this.interactionRange.scaling.set(this.config.interaction.range, 1, this.config.interaction.range);
    this.combatAcquireRing.position.set(position.x, 0.07, position.z);
    this.combatAcquireRing.scaling.set(COMBAT_CONFIG.targetAcquisitionRange, 1, COMBAT_CONFIG.targetAcquisitionRange);
    this.combatHitRing.position.set(position.x, 0.075, position.z);
    this.combatHitRing.scaling.set(activeProfile.hitRange, 1, activeProfile.hitRange);
    if (nearestEnemy) {
      const ep = nearestEnemy.getCombatPosition();
      this.enemyAcquireRing.position.set(ep.x, 0.08, ep.z);
      this.enemyAcquireRing.scaling.set(ROAMING_ZOMBIE_PROFILE.acquireRange, 1, ROAMING_ZOMBIE_PROFILE.acquireRange);
      this.enemyLoseRing.position.set(ep.x, 0.085, ep.z);
      this.enemyLoseRing.scaling.set(ROAMING_ZOMBIE_PROFILE.loseRange, 1, ROAMING_ZOMBIE_PROFILE.loseRange);
    }
    this.applyRangeVisibility(nearestEnemy !== null);

    const interactionTarget = this.interaction.target;
    if (interactionTarget) {
      const targetPosition = interactionTarget.getInteractionPosition();
      const targetRadius = interactionTarget.getInteractionRadius();
      this.interactionTargetRadius.position.set(targetPosition.x, 0.1, targetPosition.z);
      this.interactionTargetRadius.scaling.set(targetRadius, 1, targetRadius);
      this.interactionTargetRadius.setEnabled(true);
    } else this.interactionTargetRadius.setEnabled(false);

    const invMap = this.inventory.getSlots().map((slot) => {
      if (!slot.stack) return `${slot.index}:-`;
      const short = slot.stack.itemId.replace("cargo-pants", "pants").replace("limestone", "lime").replace("pine-log", "log").replace("dad-hat", "hat").replace("sneakers", "shoes");
      return `${slot.index}:${short}${slot.stack.quantity > 1 ? `×${slot.stack.quantity}` : ""}`;
    }).join(" ");

    this.body.textContent = [
      `FPS ${this.engine.getFps().toFixed(0)}  ·  F3 ${this.fidelity.isOpen ? "OPEN" : "closed"}${this.fidelity.motionFrozen ? "  FREEZE" : ""}`,
      `XYZ ${position.x.toFixed(2)}  ${position.y.toFixed(2)}  ${position.z.toFixed(2)}`,
      `VEL ${velocity.x.toFixed(2)}  ${velocity.z.toFixed(2)}  ·  ${velocity.length().toFixed(2)} u/s`,
      `FACING ${(yaw * 180 / Math.PI).toFixed(1)}°  ·  OBS ${this.collision.obstacles.length}`,
      `CAM yaw ${this.config.camera.yawDeg}  pitch ${this.config.camera.pitchDeg}  ortho ${this.config.camera.orthoHeight}`,
      "",
      "INPUT",
      `SUPPRESSED ${this.sources.input.isSuppressed ? "yes" : "no"}  ·  INV ${this.sources.isInventoryOpen() ? "open" : "closed"}  ·  CRAFT ${this.sources.isCraftingOpen() ? "open" : "closed"}`,
      `MOVE ${movement.length().toFixed(2)}  ·  READY ATTACK ${this.player.health.alive && !this.sources.input.isSuppressed && this.combat.state === "ready" ? "yes" : "no"}`,
      `FREEZE ${this.fidelity.motionFrozen ? "yes" : "no"}  ·  RINGS ${this.showRanges ? "on" : "off"}`,
      "",
      "PLAYER",
      `HP ${this.player.health.currentHealth} / ${this.player.health.maxHealth}  ·  ${this.player.health.alive ? "ALIVE" : "DEFEATED"}`,
      `ARMOR ${armor}  (equipped metadata)`,
      `SPEED CAP ${this.config.player.movementSpeed.toFixed(1)}  ·  R ${this.config.player.collisionRadius.toFixed(2)}  ·  H ${this.config.player.visualHeight.toFixed(2)}`,
      lastDamage
        ? `LAST HIT raw ${lastDamage.rawDamage} → final ${lastDamage.finalDamage}  ·  red ${(lastDamage.damageReduction * 100).toFixed(1)}%  ·  arm ${lastDamage.armor}`
        : "LAST HIT none",
      "",
      "NEXT HIT PREVIEW  (live armor, no apply)",
      `RAW ${ROAMING_ZOMBIE_PROFILE.damage}  ·  ARMOR ${nextHit.armorPoints}  ·  RED ${(nextHit.damageReduction * 100).toFixed(1)}%  ·  FINAL ${nextHit.finalDamage}`,
      `HP IF HIT ${Math.max(0, this.player.health.currentHealth - nextHit.finalDamage)} / ${this.player.health.maxHealth}`,
      "",
      "INTERACTION  (contextual)",
      `TARGET ${interactionState.targetId ?? "none"}  ·  TYPE ${interactionState.targetType ?? "-"}`,
      `DIST ${Number.isFinite(interactionState.effectiveDistance) ? interactionState.effectiveDistance.toFixed(2) : "-"}  /  ${this.config.interaction.range.toFixed(2)}`,
      `CAND ${interactionState.candidateCount}  ·  LAST ${interactionState.lastInteractionId ?? "none"}`,
      "",
      "HARVESTING",
      `TARGET ${harvestingState.targetId ?? "none"}  ·  ${harvestingState.resourceKind ?? "-"}`,
      `NEED ${harvestingState.requiredTool ?? "-"}  ·  AVAIL ${harvestingState.requiredTool ? (harvestingState.toolAvailable ? "yes" : "no") : "-"}`,
      `HITS ${harvestingState.targetId ? `${harvestingState.remainingHits}/${harvestingState.totalHits}` : "-"}  ·  ${this.harvesting.active ? harvestingState.phase : "idle"}`,
      `HELD ${harvestingState.actionHeld ? "yes" : "no"}  ·  LOCK ${harvestingState.targetLocked ? "yes" : "no"}  ·  DONE ${harvestingState.lastResourceDepleted ?? "none"}`,
      "",
      "RESOURCE ACQUISITION",
      (() => {
        const pineActive = this.groundLoot.active.filter((e) => e.stack.itemId === "pine-log").length;
        const limeActive = this.groundLoot.active.filter((e) => e.stack.itemId === "limestone").length;
        const pineTotal = countStarterFixtures("pine-log");
        const limeTotal = countStarterFixtures("limestone");
        return `Loose Ground: Pine Log ${pineActive} · Limestone ${limeActive} (starter ${pineTotal}+${limeTotal})`;
      })(),
      (() => {
        const last = this.sources.lastHarvestDelivery?.() ?? null;
        if (!last) return "LAST HARVEST REWARD none";
        return `LAST HARVEST ${last.itemId} req ${last.requestedQuantity} ins ${last.insertedQuantity} ovf ${last.overflowQuantity}`;
      })(),
      "harvest → Inventory direct · ground → PickupSystem only",
      "",
      "HARVEST TOOLS  (weapon-slot preferred · inventory fallback)",
      `HATCHET ${hatchetResolved ? `YES  src ${hatchetResolved.source}` : "NO"}  ·  inv qty ${this.inventory.totalQuantity("hatchet")}`,
      `  durability: ${hatchetResolved ? `${hatchetResolved.current} / ${hatchetResolved.max}` : "none"}`,
      `PICKAXE ${pickaxeResolved ? `YES  src ${pickaxeResolved.source}` : "NO"}  ·  inv qty ${this.inventory.totalQuantity("pickaxe")}`,
      `  durability: ${pickaxeResolved ? `${pickaxeResolved.current} / ${pickaxeResolved.max}` : "none"}`,
      "matching equipped first · else lowest inventory slot · impact cost 1",
      "",
      "WEAPON",
      this.weaponSlot.isEmpty ? "slot: empty" : `slot: ${weaponDesc.name}`,
      this.weaponSlot.isEmpty ? "attack source: Fists" : `durability: ${weaponDesc.durability}`,
      `damage: ${activeProfile.damage}`,
      `attack speed: ${activeProfile.attacksPerSecond}/sec`,
      `hit range: ${activeProfile.hitRange.toFixed(2)}`,
      `active profile: ${activeProfile.source}`,
      "",
      "BACKPACK",
      `equipped: ${this.backpackSlot.isEmpty ? "none" : ITEM_REGISTRY.get(this.backpackSlot.current!.itemId).displayName}`,
      `bonus slots: ${this.backpackSlot.extraSlots}`,
      `active inventory capacity: ${this.inventory.slotCount}`,
      `backpack occupied: ${this.backpackOccupiedCount()} / ${this.backpackSlot.extraSlots}`,
      "",
      "INVENTORY",
      `SCREEN ${this.sources.isInventoryOpen() ? "open" : "closed"}`,
      `SLOTS ${this.inventory.occupiedSlotCount}/${this.inventory.slotCount}  empty ${this.inventory.emptySlotCount}  ·  base pockets ${this.inventory.baseSlotCount}`,
      `PINE LOG ${this.inventory.totalQuantity("pine-log")}  ·  LIMESTONE ${this.inventory.totalQuantity("limestone")}`,
      `LAST INSERT ${this.inventory.lastInsertAccepted === null ? "none" : this.inventory.lastInsertAccepted ? "accepted" : "rejected"}`,
      `MAP ${invMap}`,
      "",
      "EQUIPMENT",
      "(armor only · no armor durability)",
      ...this.equipment.getSlots().map((slot) => {
        const pieceArmor = slot.stack ? ITEM_REGISTRY.get(slot.stack.itemId).equipment?.armor : undefined;
        return `${slot.id.toUpperCase()} ${slot.stack?.itemId ?? "empty"}${pieceArmor !== undefined ? `  +${pieceArmor}` : ""}`;
      }),
      `TOTAL ARMOR ${armor}`,
      `LAST ${this.equipmentSystem.lastResult ? `${this.equipmentSystem.lastResult.operation} ${this.equipmentSystem.lastResult.accepted ? "ok" : this.equipmentSystem.lastResult.reason}` : "none"}`,
      `WEAPON ${this.weaponSlot.isEmpty ? "empty" : weaponDesc.name}`,
      "",
      "CRAFTING",
      ...this.crafting.recipeRegistry.getAll().map((recipe) => {
        const state = this.crafting.getRecipeState(recipe.id);
        return `${recipe.id.toUpperCase()} ${state?.craftable ? "READY" : state?.blockedBy === "inventory-full" ? "FULL" : "MISSING"}`;
      }),
      `LAST ${this.crafting.lastResult ? `${this.crafting.lastResult.recipeId} ${this.crafting.lastResult.status}` : "none"}`,
      "",
      "COMBAT",
      "(melee · separate from interaction)",
      `TARGET ${this.combatTargets.state.targetId ?? "none"}`,
      `DIST ${Number.isFinite(this.combatTargets.state.distance) ? this.combatTargets.state.distance.toFixed(2) : "-"}  ·  hit ${activeProfile.hitRange.toFixed(2)}  ·  acq ${COMBAT_CONFIG.targetAcquisitionRange}`,
      `HP ${combatTarget ? `${combatTarget.health.currentHealth}/${combatTarget.health.maxHealth}` : "-"}  ·  ${combatTarget?.displayName ?? "-"}`,
      `STATE ${this.combat.state.toUpperCase()}  ·  LAST ${this.combat.lastAttackStatus ?? "none"}`,
      `SOURCE ${activeProfile.source}  ·  ${activeProfile.damage} dmg  ·  ${activeProfile.attacksPerSecond.toFixed(1)}/s`,
      `PROGRESS ${(attackProgress * 100).toFixed(0)}%  ·  IMPACT ${this.combat.impactReached ? "done" : `at ${(activeProfile.impactNormalizedTime * 100).toFixed(0)}%`}  ·  LOCK ${this.combat.lockedTarget?.combatId ?? "none"}`,
      "",
      "ENEMIES",
      `LIVE ${this.enemies.liveCount}  ·  raw dmg ${ROAMING_ZOMBIE_PROFILE.damage}  ·  ${ROAMING_ZOMBIE_PROFILE.moveSpeed} u/s  ·  ${ROAMING_ZOMBIE_PROFILE.attacksPerSecond}/s`,
      `NEAR ${nearestEnemy?.combatId ?? "none"}  ·  ${nearestEnemy?.state.toUpperCase() ?? "-"}`,
      `DIST ${nearestEnemy && Number.isFinite(nearestEnemy.playerDistance) ? nearestEnemy.playerDistance.toFixed(2) : "-"}  ·  HP ${nearestEnemy ? `${nearestEnemy.health.currentHealth}/${nearestEnemy.health.maxHealth}` : "-"}`,
      `ATK PROGRESS ${(enemyProgress * 100).toFixed(0)}%  ·  IMPACT at ${(ROAMING_ZOMBIE_PROFILE.impactNormalizedTime * 100).toFixed(0)}%  ·  LAST ${nearestEnemy?.lastAttackResult ?? "none"}`,
      `LAST PLAYER DMG ${this.enemies.lastPlayerFinalDamage || "none"} (final)  ·  AGGRO acq ${ROAMING_ZOMBIE_PROFILE.acquireRange} / lose ${ROAMING_ZOMBIE_PROFILE.loseRange}`,
      ...agents.slice(0, 4).map((enemy) => `  ${enemy.combatId} ${enemy.state} d${Number.isFinite(enemy.playerDistance) ? enemy.playerDistance.toFixed(1) : "?"} hp${enemy.health.currentHealth} p${(enemy.attackProgress * 100).toFixed(0)}%`),
      "",
      "ITEMS / LOOT",
      `DEFS ${ITEM_REGISTRY.getAll().length}  ·  RESULTS ${this.itemResults.resultCount}  ·  LAST ${lastItemResult ? `${lastItemResult.itemId}×${lastItemResult.quantity}` : "none"}`,
      `GROUND ${this.groundLoot.activeCount}  ·  TGT ${selectedGroundLoot?.interactionId ?? "none"} ${selectedGroundLoot ? `${selectedGroundLoot.stack.itemId}×${selectedGroundLoot.stack.quantity}` : ""}`,
      `PICKUPS ${this.pickupResults.resultCount}  ·  LAST ${lastPickup ? `${lastPickup.stack.itemId}×${lastPickup.stack.quantity}` : "none"}`,
      "",
      "VISUAL",
      `QUALITY ${this.config.visual.qualityPreset.toUpperCase()}  ·  POST ${this.postProcessing.enabled ? "on" : "off"}`,
      `SHADOW PCF ${this.config.lighting.shadowSoftness.toFixed(0)}  ·  CONTACT ${this.config.visual.contactShadowIntensity.toFixed(2)}  ·  CLUTTER ${this.world.clutterCount}`,
    ].join("\n");
  }

  private backpackOccupiedCount(): number {
    let count = 0;
    for (let i = this.inventory.baseSlotCount; i < this.inventory.slotCount; i += 1) {
      if (this.inventory.getSlot(i).stack) count += 1;
    }
    return count;
  }

  private makeWireMaterial(name: string, color: Color3): StandardMaterial {
    const material = new StandardMaterial(name, this.scene);
    material.wireframe = true;
    material.emissiveColor = color;
    material.disableLighting = true;
    return material;
  }

  private makeRing(name: string, thickness: number, material: StandardMaterial): Mesh {
    const mesh = MeshBuilder.CreateTorus(name, { diameter: 2, thickness, tessellation: 48 }, this.scene);
    mesh.material = material;
    mesh.isPickable = false;
    mesh.setEnabled(false);
    return mesh;
  }

  private applyRangeVisibility(hasNearestEnemy = false): void {
    const on = this.visible && this.showRanges;
    this.combatAcquireRing.setEnabled(on);
    this.combatHitRing.setEnabled(on);
    this.enemyAcquireRing.setEnabled(on && hasNearestEnemy);
    this.enemyLoseRing.setEnabled(on && hasNearestEnemy);
  }

  private applyVisibility(): void {
    this.root.classList.toggle("visible", this.visible);
    this.playerCollider.setEnabled(this.visible);
    this.forwardLine.setEnabled(this.visible);
    this.velocityLine.setEnabled(this.visible);
    this.axes.setEnabled(this.visible);
    this.interactionRange.setEnabled(this.visible);
    this.interactionTargetRadius.setEnabled(this.visible && this.interaction.hasTarget);
    this.grid.setVisible(this.visible);
    for (const mesh of this.obstacleMeshes) mesh.setEnabled(this.visible);
    this.applyRangeVisibility(this.enemies.agents.length > 0);
  }
}
