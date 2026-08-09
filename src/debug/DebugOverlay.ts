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
import type { EquipmentSystem } from "../equipment/EquipmentSystem";
import type { CraftingSystem } from "../crafting/CraftingSystem";
import type { CombatTargetSystem } from "../combat/CombatTargetSystem";
import type { MeleeCombatSystem } from "../combat/MeleeCombatSystem";
import { FISTS_COMBAT_PROFILE } from "../combat/combatConfig";
import type { EnemySystem } from "../enemies/EnemySystem";

export class DebugOverlay {
  private visible = false;
  private readonly element: HTMLElement;
  private readonly playerCollider: Mesh;
  private readonly forwardLine: LinesMesh;
  private readonly velocityLine: LinesMesh;
  private readonly axes: LinesMesh;
  private readonly interactionRange: Mesh;
  private readonly interactionTargetRadius: Mesh;
  private grid: WorldGrid;
  private obstacleMeshes: Mesh[] = [];
  private obstacleCount = -1;
  private readonly wireMaterial: StandardMaterial;

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
    private readonly crafting: CraftingSystem,
    private readonly combatTargets: CombatTargetSystem,
    private readonly combat: MeleeCombatSystem,
    private readonly enemies: EnemySystem,
    private readonly world: World,
    private readonly postProcessing: PostProcessing,
    private readonly config: CalibrationConfig,
  ) {
    this.element = document.createElement("pre");
    this.element.className = "debug-overlay";
    root.append(this.element);
    this.wireMaterial = new StandardMaterial("DebugCollisionMaterial", scene);
    this.wireMaterial.wireframe = true;
    this.wireMaterial.emissiveColor = new Color3(0.2, 1, 0.48);
    this.wireMaterial.disableLighting = true;
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
    this.interactionRange = MeshBuilder.CreateTorus("DebugInteractionRange", { diameter: 2, thickness: 0.025, tessellation: 48 }, scene);
    this.interactionRange.material = this.wireMaterial;
    this.interactionRange.isPickable = false;
    this.interactionTargetRadius = MeshBuilder.CreateTorus("DebugInteractionTargetRadius", { diameter: 2, thickness: 0.035, tessellation: 36 }, scene);
    this.interactionTargetRadius.material = this.wireMaterial;
    this.interactionTargetRadius.isPickable = false;
    this.grid = new WorldGrid(scene, GAME_CONFIG.worldSize, config.world.gridCellSize);
    this.refreshObstacles();
    this.applyVisibility();
  }

  toggle(): void { this.visible = !this.visible; this.applyVisibility(); }

  refreshObstacles(): void {
    this.obstacleCount = this.collision.obstacles.length;
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
      mesh.setEnabled(this.visible);
      return mesh;
    });
  }

  update(): void {
    if (!this.visible) return;
    if (this.obstacleCount !== this.collision.obstacles.length) this.refreshObstacles();
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
    const nearestEnemy = this.enemies.agents.reduce<(typeof this.enemies.agents)[number] | null>((nearest, enemy) => !nearest || enemy.playerDistance < nearest.playerDistance ? enemy : nearest, null);
    this.interactionRange.position.set(position.x, 0.09, position.z);
    this.interactionRange.scaling.set(this.config.interaction.range, 1, this.config.interaction.range);
    const interactionTarget = this.interaction.target;
    if (interactionTarget) {
      const targetPosition = interactionTarget.getInteractionPosition();
      const targetRadius = interactionTarget.getInteractionRadius();
      this.interactionTargetRadius.position.set(targetPosition.x, 0.1, targetPosition.z);
      this.interactionTargetRadius.scaling.set(targetRadius, 1, targetRadius);
      this.interactionTargetRadius.setEnabled(true);
    } else this.interactionTargetRadius.setEnabled(false);
    this.element.textContent = [
      `FPS  ${this.engine.getFps().toFixed(0)}`,
      `XYZ  ${position.x.toFixed(2)}  ${position.y.toFixed(2)}  ${position.z.toFixed(2)}`,
      `VEL  ${velocity.x.toFixed(2)}  ${velocity.z.toFixed(2)}`,
      `SPEED ${velocity.length().toFixed(2)} u/s`,
      `FACING ${(yaw * 180 / Math.PI).toFixed(1)}°`,
      `OBSTACLES ${this.collision.obstacles.length}`,
      "",
      "INTERACTION",
      `TARGET ${interactionState.targetId ?? "none"}`,
      `TYPE ${interactionState.targetType ?? "-"}`,
      `DIST ${Number.isFinite(interactionState.effectiveDistance) ? interactionState.effectiveDistance.toFixed(2) : "-"}`,
      `RANGE ${this.config.interaction.range.toFixed(2)}`,
      `CANDIDATES ${interactionState.candidateCount}`,
      `LAST ${interactionState.lastInteractionId ?? "none"}`,
      "",
      "HARVESTING",
      `TARGET ${harvestingState.targetId ?? "none"}`,
      `RESOURCE ${harvestingState.resourceKind ?? "-"}`,
      `TOOL ${harvestingState.requiredTool ?? "-"}`,
      `AVAILABLE ${harvestingState.requiredTool ? (harvestingState.toolAvailable ? "yes" : "no") : "-"}`,
      `HITS ${harvestingState.targetId ? `${harvestingState.remainingHits} / ${harvestingState.totalHits}` : "-"}`,
      `STATE ${this.harvesting.active ? "swinging" : "idle"}`,
      `PHASE ${harvestingState.phase}`,
      `HELD ${harvestingState.actionHeld ? "true" : "false"}`,
      `LOCKED ${harvestingState.targetLocked ? "true" : "false"}`,
      `DEPLETED ${harvestingState.lastResourceDepleted ?? "none"}`,
      "",
      "ITEM SYSTEM",
      `DEFINITIONS ${this.itemResults.definitionCount}`,
      `RESULTS ${this.itemResults.resultCount}`,
      `SOURCE ${lastItemResult?.sourceId ?? "none"}`,
      `ITEM ${lastItemResult?.itemId ?? "-"}`,
      `QUANTITY ${lastItemResult?.quantity ?? "-"}`,
      `STACKS ${lastItemResult ? `[${lastItemResult.stacks.map((stack) => stack.quantity).join(", ")}]` : "-"}`,
      "",
      "GROUND LOOT",
      `ACTIVE ${this.groundLoot.activeCount}`,
      `TARGET ${selectedGroundLoot?.interactionId ?? "none"}`,
      `ITEM ${selectedGroundLoot?.stack.itemId ?? "none"}`,
      `QUANTITY ${selectedGroundLoot?.stack.quantity ?? 0}`,
      `PICKUPS ${this.pickupResults.resultCount}`,
      `LAST PICKUP ${lastPickup ? `${lastPickup.stack.itemId} × ${lastPickup.stack.quantity}` : "none"}`,
      "",
      "INVENTORY",
      `SLOTS ${this.inventory.slotCount}`,
      `OCCUPIED ${this.inventory.occupiedSlotCount}`,
      `EMPTY ${this.inventory.emptySlotCount}`,
      `PINE LOG ${this.inventory.totalQuantity("pine-log")}`,
      `LIMESTONE ${this.inventory.totalQuantity("limestone")}`,
      `LAST INSERT ${this.inventory.lastInsertAccepted === null ? "none" : this.inventory.lastInsertAccepted ? "accepted" : "rejected"}`,
      "",
      "EQUIPMENT",
      ...this.equipment.getSlots().map((slot) => `${slot.id.toUpperCase()} ${slot.stack?.itemId ?? "empty"}`),
      `ARMOR ${this.equipment.totalArmor}`,
      `LAST ${this.equipmentSystem.lastResult ? `${this.equipmentSystem.lastResult.operation} ${this.equipmentSystem.lastResult.accepted ? "accepted" : this.equipmentSystem.lastResult.reason}` : "none"}`,
      "",
      "CRAFTING",
      ...this.crafting.recipeRegistry.getAll().map((recipe) => {
        const state = this.crafting.getRecipeState(recipe.id);
        return `${recipe.id.toUpperCase()} ${state?.craftable ? "READY" : state?.blockedBy === "inventory-full" ? "FULL" : "MISSING"}`;
      }),
      `LAST ${this.crafting.lastResult ? `${this.crafting.lastResult.recipeId} ${this.crafting.lastResult.status}` : "none"}`,
      "",
      "COMBAT",
      `TARGET ${this.combatTargets.state.targetId ?? "none"}`,
      `DIST ${Number.isFinite(this.combatTargets.state.distance) ? this.combatTargets.state.distance.toFixed(2) : "-"}`,
      `HP ${this.combatTargets.current ? `${this.combatTargets.current.health.currentHealth}/${this.combatTargets.current.health.maxHealth}` : "-"}`,
      `STATE ${this.combat.state.toUpperCase()}`,
      `LAST ATTACK ${this.combat.lastAttackStatus ?? "none"}`,
      `DAMAGE ${FISTS_COMBAT_PROFILE.damage}`,
      `RATE ${FISTS_COMBAT_PROFILE.attacksPerSecond.toFixed(1)}/s`,
      "",
      "PLAYER",
      `HP ${this.player.health.currentHealth} / ${this.player.health.maxHealth}`,
      `STATE ${this.player.health.alive ? "ALIVE" : "DEFEATED"}`,
      `LAST DAMAGE ${this.enemies.lastPlayerDamage || "none"}`,
      "",
      "ENEMIES",
      `LIVE ${this.enemies.liveCount}`,
      `TARGET ${nearestEnemy?.combatId ?? "none"}`,
      `STATE ${nearestEnemy?.state.toUpperCase() ?? "-"}`,
      `DIST ${nearestEnemy && Number.isFinite(nearestEnemy.playerDistance) ? nearestEnemy.playerDistance.toFixed(2) : "-"}`,
      `HP ${nearestEnemy ? `${nearestEnemy.health.currentHealth}/${nearestEnemy.health.maxHealth}` : "-"}`,
      `LAST ${nearestEnemy?.lastAttackResult ?? "none"}`,
      "",
      "VISUAL",
      `QUALITY ${this.config.visual.qualityPreset.toUpperCase()}`,
      `SHADOW PCF ${this.config.lighting.shadowSoftness.toFixed(0)}`,
      `CONTACT ${this.config.visual.contactShadowIntensity.toFixed(2)}`,
      `POST ${this.postProcessing.enabled ? "on" : "off"}`,
      `CLUTTER ${this.world.clutterCount}`,
    ].join("\n");
  }

  private applyVisibility(): void {
    this.element.classList.toggle("visible", this.visible);
    this.playerCollider.setEnabled(this.visible);
    this.forwardLine.setEnabled(this.visible);
    this.velocityLine.setEnabled(this.visible);
    this.axes.setEnabled(this.visible);
    this.interactionRange.setEnabled(this.visible);
    this.interactionTargetRadius.setEnabled(this.visible && this.interaction.hasTarget);
    this.grid.setVisible(this.visible);
    for (const mesh of this.obstacleMeshes) mesh.setEnabled(this.visible);
  }
}
