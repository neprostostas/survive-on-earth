import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { GameCamera } from "../camera/GameCamera";
import { CollisionWorld } from "../collision/CollisionWorld";
import { loadCalibration } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import { CalibrationPanel } from "../debug/CalibrationPanel";
import { DebugOverlay } from "../debug/DebugOverlay";
import { InputController } from "../input/InputController";
import { Player } from "../player/Player";
import { Lighting } from "../rendering/Lighting";
import { HUD } from "../ui/HUD";
import { World } from "../world/World";
import { InteractionSystem } from "../interaction/InteractionSystem";
import { PostProcessing } from "../rendering/PostProcessing";
import { GameLoop } from "./GameLoop";
import { FidelityMode } from "../debug/FidelityMode";
import { PrototypeToolLoadout } from "../harvesting/PrototypeToolLoadout";
import { HarvestingSystem } from "../harvesting/HarvestingSystem";
import { HarvestableResource } from "../harvesting/HarvestableResource";
import { ResourceResultFeedback } from "../ui/ResourceResultFeedback";
import { CompositeResourceResultSink } from "../items/CompositeResourceResultSink";
import { GroundLootSystem } from "../ground-loot/GroundLootSystem";
import { GroundLootVisuals } from "../ground-loot/GroundLootVisuals";
import { PickupSystem } from "../ground-loot/PickupSystem";
import { TemporaryPickupResultSink } from "../ground-loot/PickupResult";
import { GroundLoot } from "../ground-loot/GroundLoot";
import { ITEM_REGISTRY } from "../items/ItemSystem";
import { PlayerInventory } from "../inventory/PlayerInventory";
import { InventoryPanel } from "../ui/InventoryPanel";
import { PlayerEquipment } from "../equipment/PlayerEquipment";
import { EquipmentSystem } from "../equipment/EquipmentSystem";
import { EquipmentVisualController } from "../equipment/EquipmentVisualController";
import { spawnEquipmentCalibrationLoot } from "../equipment/equipmentCalibration";
import { CraftingSystem } from "../crafting/CraftingSystem";
import { CraftingPanel } from "../ui/CraftingPanel";
import { CombatTargetSystem } from "../combat/CombatTargetSystem";
import { MeleeCombatSystem } from "../combat/MeleeCombatSystem";
import { CombatDummy } from "../combat/CombatDummy";
import { CombatPresentation } from "../combat/CombatPresentation";
import { COMBAT_CONFIG } from "../combat/combatConfig";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { EnemySystem } from "../enemies/EnemySystem";
import { RoamingZombie } from "../enemies/RoamingZombie";
import { EnemyPresentation } from "../enemies/EnemyPresentation";
import { ROAMING_ZOMBIE_PROFILE } from "../enemies/enemyConfig";

export class Game {
  private readonly engine: Engine;
  private readonly scene: Scene;
  private readonly config = loadCalibration(localStorage);
  private readonly camera: GameCamera;
  private readonly collision = new CollisionWorld();
  private readonly lighting: Lighting;
  private readonly postProcessing: PostProcessing;
  private readonly world: World;
  private readonly player: Player;
  private readonly interaction: InteractionSystem;
  private readonly harvesting: HarvestingSystem;
  private readonly resultFeedback: ResourceResultFeedback;
  private readonly groundLoot: GroundLootSystem;
  private readonly inventory = new PlayerInventory();
  private readonly equipment = new PlayerEquipment();
  private readonly equipmentSystem = new EquipmentSystem(this.inventory, this.equipment);
  private readonly craftingSystem = new CraftingSystem(this.inventory);
  private readonly combatTargets = new CombatTargetSystem();
  private readonly combatDummies: CombatDummy[] = [];
  private readonly equipmentVisual: EquipmentVisualController;
  private readonly combatPresentation: CombatPresentation;
  private readonly enemyPresentation: EnemyPresentation;
  private readonly enemies: EnemySystem;
  private readonly combat: MeleeCombatSystem;
  private readonly inventoryPanel: InventoryPanel;
  private readonly craftingPanel: CraftingPanel;
  private readonly pickupResults = new TemporaryPickupResultSink();
  private readonly pickup: PickupSystem;
  private readonly prototypeTools = new PrototypeToolLoadout();
  private readonly hud: HUD;
  private readonly input: InputController;
  private readonly calibration: CalibrationPanel;
  private readonly debug: DebugOverlay;
  private readonly fidelity: FidelityMode;
  private readonly loop: GameLoop;

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.engine = new Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: false });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.75);
    this.engine.setHardwareScalingLevel((window.devicePixelRatio || 1) / pixelRatio);
    this.scene = new Scene(this.engine);
    this.camera = new GameCamera(this.scene, this.engine, this.config);
    this.lighting = new Lighting(this.scene, this.config);
    this.postProcessing = new PostProcessing(this.scene, this.config);
    this.world = new World(this.scene, this.collision, this.lighting, this.config);
    this.player = new Player(this.scene, this.collision, this.config);
    for (const mesh of this.player.visual.meshes) this.lighting.addCaster(mesh);
    this.equipmentVisual = new EquipmentVisualController(this.scene, this.player.visual, this.equipment);
    for (const mesh of this.equipmentVisual.meshes) this.lighting.addCaster(mesh);
    this.hud = new HUD(uiRoot);
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.combatPresentation = new CombatPresentation(this.scene, this.engine, uiRoot);
    this.enemyPresentation = new EnemyPresentation(this.scene);
    this.spawnCombatDummies();
    this.enemies = new EnemySystem(
      this.combatTargets,
      { health: this.player.health, getPosition: () => this.player.position },
      {
        move: (enemy, position, displacement) => {
          const label = this.enemyCollisionLabel(enemy);
          const moved = this.collision.move(
            new Vector3(position.x, position.y, position.z),
            new Vector3(displacement.x, displacement.y, displacement.z),
            ROAMING_ZOMBIE_PROFILE.collisionRadius,
            label,
          );
          this.collision.updateCircle(label, moved.x, moved.z);
          return moved;
        },
        remove: (enemy) => { this.collision.remove(this.enemyCollisionLabel(enemy)); },
      },
      {
        onPlayerDamage: (_enemy, damage) => {
          this.combatPresentation.showDamage(this.player.position, damage.requested, 1.9);
          if (damage.becameDead) this.enterPlayerDefeatedState();
        },
        onEnemyHit: (enemy) => { this.enemyPresentation.showHit(enemy); },
        onEnemyDeath: (enemy) => { this.enemyPresentation.beginDeath(enemy); },
      },
    );
    this.spawnRoamingZombies();
    this.combat = new MeleeCombatSystem(
      this.combatTargets,
      this.player,
      () => { this.harvesting.cancel(); this.player.stopMovement(); },
      ({ target, damage }) => {
        this.combatPresentation.showImpact(target, damage.requested);
        if (this.enemies.handlePlayerCombatImpact(target, damage)) return;
        if (!damage.becameDead) return;
        this.combatTargets.unregister(target);
        this.collision.remove(`CombatTarget:${target.combatId}`);
        this.combatPresentation.beginDeath(target);
      },
    );
    this.inventoryPanel = new InventoryPanel(uiRoot, this.inventory, this.equipment, this.equipmentSystem, this.hud.inventoryToggle, (open) => { this.setInventoryOpen(open); });
    this.craftingPanel = new CraftingPanel(uiRoot, this.inventory, this.craftingSystem, this.hud.craftingToggle, (message) => { this.inventoryPanel.showStatus(message); }, (open) => { this.setCraftingOpen(open); });
    this.resultFeedback = new ResourceResultFeedback(uiRoot, this.scene, this.engine);
    this.input = new InputController(this.hud.joystick, this.hud.primaryAction, this.hud.attackAction, GAME_CONFIG.joystickDeadZone);
    this.interaction = new InteractionSystem(this.scene, this.world.interactables, this.config);
    this.groundLoot = new GroundLootSystem(this.world, new GroundLootVisuals(this.scene));
    spawnEquipmentCalibrationLoot(this.groundLoot);
    this.pickup = new PickupSystem(this.groundLoot, this.interaction, this.inventory, this.pickupResults, this.inventoryPanel);
    const resourceResults = new CompositeResourceResultSink([this.groundLoot, this.resultFeedback]);
    this.harvesting = new HarvestingSystem(this.config, this.prototypeTools, this.player, this.interaction, resourceResults, (resource) => {
      this.world.removeResourceCollision(resource.resourceId);
    });
    this.debug = new DebugOverlay(uiRoot, this.scene, this.engine, this.player, this.collision, this.interaction, this.harvesting, this.resultFeedback, this.groundLoot, this.pickupResults, this.inventory, this.equipment, this.equipmentSystem, this.craftingSystem, this.combatTargets, this.combat, this.enemies, this.world, this.postProcessing, this.config);
    this.calibration = new CalibrationPanel(uiRoot, this.config, this.prototypeTools, () => { this.applyCalibration(); });
    this.fidelity = new FidelityMode(uiRoot, () => { /* Freeze state is read in the frame loop. */ });
    this.loop = new GameLoop(this.engine, (delta) => { this.update(delta); });
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onFunctionKey);
  }

  async start(): Promise<void> {
    this.camera.update(0, this.player.position);
    await this.scene.whenReadyAsync();
    document.body.classList.add("game-ready");
    this.loop.start();
  }

  private update(delta: number): void {
    const frameDelta = this.fidelity.motionFrozen ? 0 : delta;
    const movement = this.input.getMovement();
    const action = this.input.consumePrimaryActionState();
    const attackPressed = this.input.consumeAttackPressed();
    this.combatTargets.update(this.player.position);
    if (!this.fidelity.motionFrozen && this.player.health.alive && attackPressed) this.combat.requestAttack();
    if (!this.fidelity.motionFrozen && this.player.health.alive) {
      if (this.combat.movementCommitted) { movement.setAll(0); this.player.stopMovement(); }
      this.player.update(delta, movement, this.camera.screenRight, this.camera.screenUp);
      this.combat.update(delta);
    }
    this.combatTargets.update(this.player.position);
    this.enemies.update(frameDelta);
    this.combatTargets.update(this.player.position);
    this.world.update(frameDelta);
    this.interaction.update(frameDelta, this.player.position, this.player.facingYaw);
    if (!this.fidelity.motionFrozen && this.player.health.alive && this.combat.state === "ready") {
      const harvestingConsumed = this.harvesting.update(delta, action, movement, this.player.position);
      if (action.pressedThisFrame && !harvestingConsumed) {
        const selected = this.interaction.target;
        const interactionAccepted = this.interaction.tryInteract(this.player.position, (targetPosition) => { this.player.requestFacing(targetPosition); });
        if (interactionAccepted && selected instanceof GroundLoot) this.pickup.tryPickup(selected, this.player.position);
      }
    }
    const combatTarget = this.combatTargets.current;
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.hud.setAttackState(this.player.health.alive && combatTarget !== null, this.player.health.alive && this.combatTargets.state.distance <= COMBAT_CONFIG.meleeHitRange, this.combat.state !== "ready");
    this.hud.updateMinimap(this.player.position, this.player.facingYaw, this.world.interactables);
    const target = this.interaction.target;
    if (!this.player.health.alive) this.hud.setPrimaryActionContext("none");
    else if (target instanceof HarvestableResource) {
      this.hud.setPrimaryActionContext(target.requiredTool, this.prototypeTools.hasTool(target.requiredTool), this.harvesting.state.unavailableFeedback);
    } else if (target instanceof GroundLoot) {
      this.hud.setGroundLootActionContext(ITEM_REGISTRY.get(target.stack.itemId), target.stack.quantity);
    } else this.hud.setPrimaryActionContext(target ? "generic" : "none");
    this.camera.update(frameDelta, this.player.position);
    this.groundLoot.update(frameDelta);
    this.resultFeedback.update(frameDelta);
    this.combatPresentation.update(frameDelta, combatTarget);
    this.enemyPresentation.update(frameDelta, this.enemies.agents);
    this.debug.update();
    this.scene.render();
  }

  private applyCalibration(): void {
    this.player.applyCalibration();
    this.world.applyCalibration();
    this.restoreDynamicCombatCollisions();
    this.lighting.applyCalibration();
    this.postProcessing.applyCalibration();
    this.camera.applyProjection();
    this.debug.refreshObstacles();
  }

  private readonly onResize = (): void => { this.engine.resize(); this.camera.applyProjection(); };
  private spawnCombatDummies(): void {
    const positions = Object.freeze([
      Object.freeze({ x: 1.25, y: 0, z: 3.55 }),
      Object.freeze({ x: 2.3, y: 0, z: 4.55 }),
      Object.freeze({ x: 1.75, y: 0, z: 5.85 }),
    ]);
    positions.forEach((position, index) => {
      const dummy = new CombatDummy(`combat-dummy-${String(index + 1).padStart(2, "0")}`, position);
      this.combatDummies.push(dummy);
      this.combatTargets.register(dummy);
      this.collision.addCircle(position.x, position.z, COMBAT_CONFIG.dummyCollisionRadius, `CombatTarget:${dummy.combatId}`);
      for (const mesh of this.combatPresentation.spawnDummy(dummy)) this.lighting.addCaster(mesh);
    });
  }
  private spawnRoamingZombies(): void {
    const positions = Object.freeze([
      Object.freeze({ x: -1.5, y: 0, z: 10 }),
      Object.freeze({ x: 4.6, y: 0, z: 8.5 }),
      Object.freeze({ x: -5.5, y: 0, z: 6.5 }),
    ]);
    positions.forEach((position, index) => {
      const enemy = new RoamingZombie(`roaming-zombie-${String(index + 1).padStart(2, "0")}`, position);
      this.enemies.register(enemy);
      this.collision.addCircle(position.x, position.z, ROAMING_ZOMBIE_PROFILE.collisionRadius, this.enemyCollisionLabel(enemy));
      for (const mesh of this.enemyPresentation.spawn(enemy)) this.lighting.addCaster(mesh);
    });
  }
  private restoreDynamicCombatCollisions(): void {
    for (const dummy of this.combatDummies) {
      if (dummy.isCombatAlive()) this.collision.addCircle(dummy.getCombatPosition().x, dummy.getCombatPosition().z, COMBAT_CONFIG.dummyCollisionRadius, `CombatTarget:${dummy.combatId}`);
    }
    for (const enemy of this.enemies.agents) {
      const position = enemy.getCombatPosition();
      this.collision.addCircle(position.x, position.z, ROAMING_ZOMBIE_PROFILE.collisionRadius, this.enemyCollisionLabel(enemy));
    }
  }
  private enemyCollisionLabel(enemy: RoamingZombie): string { return `Enemy:${enemy.combatId}`; }
  private enterPlayerDefeatedState(): void {
    this.combat.cancelAttack();
    this.harvesting.cancel();
    this.player.stopMovement();
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.applyGameplayPanelState(true);
  }
  private setInventoryOpen(open: boolean): void {
    if (open) this.craftingPanel.close();
    this.applyGameplayPanelState(open || this.craftingPanel.isOpen || this.fidelity.isOpen);
  }
  private setCraftingOpen(open: boolean): void {
    if (open) this.inventoryPanel.close();
    this.applyGameplayPanelState(open || this.inventoryPanel.isOpen || this.fidelity.isOpen);
  }
  private applyGameplayPanelState(open: boolean): void {
    const suppressed = open || this.player.health.dead;
    this.input.setSuppressed(suppressed);
    if (!suppressed) return;
    this.harvesting.cancel();
    this.player.stopMovement();
  }
  private readonly onFunctionKey = (event: KeyboardEvent): void => {
    if (this.player.health.dead && (event.code === "KeyI" || event.code === "KeyB")) { event.preventDefault(); return; }
    if (event.code === "KeyI" && !event.repeat) { event.preventDefault(); this.inventoryPanel.toggle(); return; }
    if (event.code === "KeyB" && !event.repeat) { event.preventDefault(); this.craftingPanel.toggle(); return; }
    if (event.code === "Escape" && (this.inventoryPanel.isOpen || this.craftingPanel.isOpen)) {
      event.preventDefault();
      this.inventoryPanel.close();
      this.craftingPanel.close();
      return;
    }
    if (event.code === "F1") { event.preventDefault(); this.calibration.toggle(); }
    if (event.code === "F2") { event.preventDefault(); this.debug.toggle(); }
    if (event.code === "F3") {
      event.preventDefault();
      this.fidelity.toggle();
      this.applyGameplayPanelState(this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.fidelity.isOpen);
    }
  };
}
