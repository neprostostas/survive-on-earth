import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { GameCamera } from "../camera/GameCamera";
import { CollisionWorld } from "../collision/CollisionWorld";
import { loadCalibration } from "../config/calibrationConfig";
import { GAME_CONFIG } from "../config/gameConfig";
import { CalibrationPanel } from "../debug/CalibrationPanel";
import { DebugOverlay } from "../debug/DebugOverlay";
import { InputController } from "../input/InputController";
import { isUiTextFocusTarget } from "../input/uiTextFocus";
import { Player } from "../player/Player";
import { SneakState } from "../player/SneakState";
import { Lighting } from "../rendering/Lighting";
import { HUD } from "../ui/HUD";
import { World } from "../world/World";
import { InteractionSystem } from "../interaction/InteractionSystem";
import { PostProcessing } from "../rendering/PostProcessing";
import { GameLoop } from "./GameLoop";
import { FidelityMode } from "../debug/FidelityMode";
import { HudLayoutEditor } from "../debug/HudLayoutEditor";
import { InventoryHarvestTools } from "../harvesting/InventoryHarvestTools";
import { HarvestingSystem } from "../harvesting/HarvestingSystem";
import { HarvestableResource } from "../harvesting/HarvestableResource";
import { ResourceResultFeedback } from "../ui/ResourceResultFeedback";
import { CompositeResourceResultSink } from "../items/CompositeResourceResultSink";
import { GroundLootSystem } from "../ground-loot/GroundLootSystem";
import { GroundLootVisuals } from "../ground-loot/GroundLootVisuals";
import { PickupSystem } from "../ground-loot/PickupSystem";
import { TemporaryPickupResultSink } from "../ground-loot/PickupResult";
import { GroundLoot } from "../ground-loot/GroundLoot";
import { ITEM_REGISTRY, createItemStack } from "../items/ItemSystem";
import { PlayerInventory } from "../inventory/PlayerInventory";
import { InventoryPanel } from "../ui/InventoryPanel";
import { PlayerEquipment } from "../equipment/PlayerEquipment";
import { EquipmentSystem } from "../equipment/EquipmentSystem";
import { EquipmentVisualController } from "../equipment/EquipmentVisualController";
import { spawnStarterGroundResources } from "../ground-loot/starterGroundResources";
import { CraftingSystem } from "../crafting/CraftingSystem";
import { CraftingPanel } from "../ui/CraftingPanel";
import { CombatTargetSystem } from "../combat/CombatTargetSystem";
import { MeleeCombatSystem } from "../combat/MeleeCombatSystem";
import { CombatDummy } from "../combat/CombatDummy";
import { CombatPresentation } from "../combat/CombatPresentation";
import { COMBAT_CONFIG } from "../combat/combatConfig";
import { EnemySystem } from "../enemies/EnemySystem";
import { RoamingZombie } from "../enemies/RoamingZombie";
import { EnemyPresentation } from "../enemies/EnemyPresentation";
import { PlayerDamageResolver } from "../combat/PlayerDamageResolver";
import { enemySpawnSpecsFor, spawnPositionsForLocation } from "../enemies/LocationEnemyPools";
import { PlayerWeaponSlot } from "../equipment/PlayerWeaponSlot";
import { WeaponEquipSystem } from "../equipment/WeaponEquipSystem";
import { PlayerBackpackSlot } from "../equipment/PlayerBackpackSlot";
import { BackpackEquipSystem } from "../equipment/BackpackEquipSystem";
import { backpackExtraSlots } from "../equipment/BackpackTypes";
import { PlayerQuickSlot } from "../equipment/PlayerQuickSlot";
import { QuickSlotSystem } from "../equipment/QuickSlotSystem";
import { PlayerUtilitySlot } from "../equipment/PlayerUtilitySlot";
import { UtilityEquipSystem } from "../equipment/UtilityEquipSystem";
import { resolvePlayerMeleeProfile } from "../combat/resolvePlayerMeleeProfile";
import { toHeldWeaponVisualId } from "../equipment/WeaponTypes";
import { HarvestRewardDelivery } from "../harvesting/HarvestRewardDelivery";
import { HungerPool, ThirstPool, EnergyPool } from "../survival/NeedPool";
import { SURVIVAL_CONFIG } from "../survival/survivalConfig";
import { ConsumableUseSystem } from "../consumables/ConsumableUseSystem";
import { DeathBagSystem } from "../death/DeathBagSystem";
import { LocationManager } from "../locations/LocationManager";
import type { LocationId } from "../locations/LocationRegistry";
import { getLocation, effectiveColdExposure } from "../locations/LocationRegistry";
import { ExperiencePool, SkillTree } from "../progression/ExperiencePool";
import { BuildingRegistry } from "../building/BuildingRegistry";
import { BuildingPresentation } from "../building/BuildingPresentation";
import { cursorGridFromPlayer } from "../building/buildConfig";
import { BuildModePanel } from "../ui/BuildModePanel";
import { GlobalMapPanel } from "../ui/GlobalMapPanel";
import { LocalMapPanel } from "../ui/LocalMapPanel";
import { MainMenu } from "../ui/MainMenu";
import { PauseMenu } from "../ui/PauseMenu";
import { DeathScreen } from "../ui/DeathScreen";
import { FullLoader } from "../ui/Loaders";
import { confirmDialog } from "../ui/ConfirmDialog";
import { NotificationService } from "../notify/NotificationService";
import { SAVE_SYSTEM, SAVE_VERSION, serializeStack, serializeInventorySlot, deserializeStack, type SaveBlob, type SerializedInventorySlot } from "../save/SaveSystem";
import { I18N } from "../i18n/I18n";
import { GAME_AUDIO } from "../audio/GameAudio";
import { LanguageSelectScreen } from "../ui/LanguageSelectScreen";
import { CHARACTER_PROFILE } from "../player/CharacterProfile";
import { rollNamedLoot } from "../loot/LootTable";
import { WorldContainerEntity } from "../containers/WorldContainer";
import { HOME_HOUSE_ORIGIN } from "../world/TestLocation";
import { StatusEffectSystem } from "../status/StatusEffectSystem";
import { QuestSystem } from "../quests/QuestSystem";
import { RangedCombatSystem } from "../combat/RangedCombat";
import { WorkstationQueue } from "../workstations/WorkstationQueue";
import { AchievementSystem } from "../progression/Achievements";
import { WorldClock } from "../world/WorldClock";
import { resolveCriticalHit } from "../combat/CriticalHit";
import { ColdPool } from "../survival/ColdPool";
import { FarmingSystem } from "../farming/FarmingSystem";
import { VehicleSystem } from "../vehicle/VehicleSystem";
import { MailboxSystem } from "../rewards/MailboxSystem";
import { ReputationSystem } from "../progression/ReputationSystem";
import { JournalSystem } from "../progression/JournalSystem";
import { NpcSystem, SURVIVOR_CAMP_NPCS } from "../npc/NpcSystem";
import { LockSystem } from "../world/LockSystem";
import { BossBrain, WARDEN_PROFILE } from "../combat/BossBrain";
import { HordeController } from "../combat/HordeController";
import { WorldEventDirector } from "../world/WorldEventDirector";
import { RaidSystem } from "../raids/RaidSystem";
import { PowerGrid } from "../base/PowerGrid";
import { WaterSystem } from "../base/WaterSystem";
import { validateContentRegistries } from "../debug/ContentValidator";
import { formatContentSummary, debugSpawnItem } from "../debug/ContentBrowser";
import { loreNotesForLocation } from "../content/LoreNotes";
import { tierForLevel } from "../progression/ProgressionTiers";
import { GameStatistics } from "../progression/GameStatistics";
import { DungeonResetSystem } from "../world/DungeonReset";
import { ContractSystem } from "../contracts/ContractSystem";
import { inferStoryAct, getStoryAct } from "../quests/StoryActs";

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
  private readonly weaponSlot = new PlayerWeaponSlot();
  private readonly weaponEquipSystem: WeaponEquipSystem;
  private readonly backpackSlot = new PlayerBackpackSlot();
  private readonly backpackEquipSystem: BackpackEquipSystem;
  private readonly quickSlot = new PlayerQuickSlot();
  private readonly quickSlotSystem: QuickSlotSystem;
  private readonly utilitySlot = new PlayerUtilitySlot();
  private readonly utilityEquipSystem: UtilityEquipSystem;
  private readonly hunger = new HungerPool(SURVIVAL_CONFIG.hunger.max, SURVIVAL_CONFIG.hunger.initial);
  private readonly thirst = new ThirstPool(SURVIVAL_CONFIG.thirst.max, SURVIVAL_CONFIG.thirst.initial);
  private readonly energy = new EnergyPool(SURVIVAL_CONFIG.energy.max, SURVIVAL_CONFIG.energy.initial);
  private readonly consumables: ConsumableUseSystem;
  private readonly deathBags = new DeathBagSystem();
  private readonly locations: LocationManager;
  private readonly experience = new ExperiencePool();
  private readonly skills = new SkillTree();
  private readonly building = new BuildingRegistry();
  private readonly buildingPresentation: BuildingPresentation;
  private readonly buildPanel: BuildModePanel;
  private readonly sneak = new SneakState();
  private readonly status = new StatusEffectSystem();
  private readonly quests = new QuestSystem();
  private readonly campfireQueue = new WorkstationQueue("campfire");
  private readonly achievements = new AchievementSystem();
  private readonly worldClock = new WorldClock(480);
  private readonly cold = new ColdPool(100);
  private readonly farming = new FarmingSystem();
  private readonly vehicle = new VehicleSystem();
  private readonly mailbox = new MailboxSystem();
  private readonly reputation = new ReputationSystem();
  private readonly journal = new JournalSystem();
  private readonly npcs = new NpcSystem();
  private readonly locks = new LockSystem();
  private readonly horde = new HordeController();
  private readonly warden = new BossBrain(WARDEN_PROFILE);
  private readonly worldEvents = new WorldEventDirector();
  private readonly raids = new RaidSystem();
  private readonly powerGrid = new PowerGrid();
  private readonly water = new WaterSystem();
  private readonly stats = new GameStatistics();
  private readonly dungeonResets = new DungeonResetSystem();
  private readonly contracts = new ContractSystem();
  private greyhavenVisits = 0;
  private worldDayAccum = 0;
  private nearFire = false;
  private ranged: RangedCombatSystem | null = null;
  private readonly craftingSystem = new CraftingSystem(this.inventory);
  private readonly combatTargets = new CombatTargetSystem();
  private readonly combatDummies: CombatDummy[] = [];
  private readonly equipmentVisual: EquipmentVisualController;
  private readonly combatPresentation: CombatPresentation;
  private readonly enemyPresentation: EnemyPresentation;
  private readonly playerDamage: PlayerDamageResolver;
  private readonly enemies: EnemySystem;
  private readonly combat: MeleeCombatSystem;
  private readonly inventoryPanel: InventoryPanel;
  private readonly craftingPanel: CraftingPanel;
  private readonly mapPanel: GlobalMapPanel;
  private readonly localMap: LocalMapPanel;
  private readonly mainMenu: MainMenu;
  private readonly pauseMenu: PauseMenu;
  private readonly deathScreen: DeathScreen;
  private readonly langSelect: LanguageSelectScreen;
  private readonly notify: NotificationService;
  private readonly fullLoader: FullLoader;
  private readonly pickupResults = new TemporaryPickupResultSink();
  private readonly pickup: PickupSystem;
  private readonly harvestRewardDelivery: HarvestRewardDelivery;
  private readonly harvestTools: InventoryHarvestTools;
  private readonly hud: HUD;
  private readonly input: InputController;
  private readonly calibration: CalibrationPanel;
  private readonly debug: DebugOverlay;
  private readonly fidelity: FidelityMode;
  private readonly hudLayoutEditor: HudLayoutEditor;
  private readonly loop: GameLoop;
  private readonly worldContainers: WorldContainerEntity[] = [];
  private gameStarted = false;
  private deathHandled = false;
  private autosaveTimer = 0;
  private sessionPlaytimeSec = 0;
  private totalPlaytimeSec = 0;
  private lastDeathCause = "Fatal injuries";

  constructor(canvas: HTMLCanvasElement, uiRoot: HTMLElement) {
    this.engine = new Engine(canvas, true, {
      preserveDrawingBuffer: false,
      stencil: true,
      adaptToDeviceRatio: true,
      powerPreference: "high-performance",
    });
    // Settings quality is source of truth for runtime rendering (calibration can override via F4).
    this.config.visual.qualityPreset = I18N.gameSettings.qualityPreset;
    this.applyRenderResolution();
    this.scene = new Scene(this.engine);
    this.camera = new GameCamera(this.scene, this.engine, this.config);
    this.lighting = new Lighting(this.scene, this.config);
    this.postProcessing = new PostProcessing(this.scene, this.config);
    this.world = new World(this.scene, this.collision, this.config);
    this.player = new Player(this.scene, this.collision, this.config);
    for (const mesh of this.player.visual.meshes) this.lighting.addCaster(mesh);
    this.equipmentVisual = new EquipmentVisualController(this.scene, this.player.visual, this.equipment, this.backpackSlot);
    for (const mesh of this.equipmentVisual.meshes) this.lighting.addCaster(mesh);
    this.hud = new HUD(uiRoot);
    this.hud.setPlayerName(CHARACTER_PROFILE.name);
    CHARACTER_PROFILE.onChange(() => {
      this.hud.setPlayerName(CHARACTER_PROFILE.name);
      this.player.applyCalibration();
    });
    this.notify = new NotificationService(uiRoot);
    this.fullLoader = new FullLoader(uiRoot);
    this.locations = new LocationManager(this.energy);
    this.consumables = new ConsumableUseSystem(this.inventory, this.player.health, this.hunger, this.thirst, this.quickSlot);
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.combatPresentation = new CombatPresentation(this.scene, this.engine, uiRoot);
    this.enemyPresentation = new EnemyPresentation(this.scene);
    this.playerDamage = new PlayerDamageResolver(this.player.health, this.equipment);
    this.spawnCombatDummies();
    this.enemies = new EnemySystem(
      this.combatTargets,
      {
        health: this.player.health,
        getPosition: () => this.player.position,
        applyIncomingDamage: (rawDamage) => this.playerDamage.applyRawDamage(rawDamage),
      },
      {
        move: (enemy, position, displacement) => {
          const label = this.enemyCollisionLabel(enemy);
          const radius = enemy.archetype.collisionRadius;
          const moved = this.collision.move(
            new Vector3(position.x, position.y, position.z),
            new Vector3(displacement.x, displacement.y, displacement.z),
            radius,
            label,
          );
          this.collision.updateCircle(label, moved.x, moved.z);
          return moved;
        },
        remove: (enemy) => { this.collision.remove(this.enemyCollisionLabel(enemy)); },
      },
      {
        onPlayerDamage: (_enemy, damage) => {
          this.combatPresentation.showDamage(this.player.position, damage.finalDamage, 1.9);
          this.pulseCameraShake(0.45);
          this.lastDeathCause = "Infected attack";
          if (damage.becameDefeated) this.enterPlayerDefeatedState();
        },
        onEnemyHit: (enemy) => { this.enemyPresentation.showHit(enemy); },
        onEnemyDeath: (enemy) => {
          this.enemyPresentation.beginDeath(enemy);
          this.onEnemyKilled(enemy);
        },
      },
    );
    this.respawnLocationEnemies("home");
    this.combat = new MeleeCombatSystem(
      this.combatTargets,
      this.player,
      () => {
        const base = resolvePlayerMeleeProfile(this.weaponSlot);
        const mul = this.skills.meleeDamageMultiplier() * this.sneak.attackMul;
        if (mul === 1) return base;
        return Object.freeze({ ...base, damage: Math.round(base.damage * mul) });
      },
      () => { this.harvesting.cancel(); this.player.stopMovement(); },
      ({ target, damage, profile }) => {
        if (profile.consumesDurability && profile.source !== "fists") {
          this.weaponSlot.tryConsumeDurability(profile.source as import("../items/ItemId").ItemId, 1);
          this.syncHeldWeaponVisual();
        }
        const crit = resolveCriticalHit(damage.requested);
        const finalReq = crit.isCrit ? crit.damage : damage.requested;
        this.combatPresentation.showImpact(target, finalReq);
        const hit = Object.freeze({ ...damage, requested: finalReq });
        if (this.enemies.handlePlayerCombatImpact(target, hit)) return;
        if (!hit.becameDead) return;
        this.combatTargets.unregister(target);
        this.collision.remove(`CombatTarget:${target.combatId}`);
        this.combatPresentation.beginDeath(target);
      },
    );
    this.weaponEquipSystem = new WeaponEquipSystem(this.inventory, this.weaponSlot, () => { this.combat.cancelAttack(); });
    this.backpackEquipSystem = new BackpackEquipSystem(this.inventory, this.backpackSlot);
    this.quickSlotSystem = new QuickSlotSystem(this.inventory, this.quickSlot);
    this.utilityEquipSystem = new UtilityEquipSystem(this.inventory, this.utilitySlot);
    this.inventoryPanel = new InventoryPanel(
      uiRoot,
      this.inventory,
      this.equipment,
      this.equipmentSystem,
      this.weaponSlot,
      this.weaponEquipSystem,
      this.backpackSlot,
      this.backpackEquipSystem,
      this.hud.inventoryToggle,
      (open) => { this.setInventoryOpen(open); },
    );
    this.inventoryPanel.setItemActionHandlers({
      use: (slot, stack) => {
        const result = this.consumables.useFromInventory(slot, stack);
        if (result.accepted) {
          this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
          this.syncHudNeeds();
        }
        return result.accepted;
      },
      quickAssign: (slot, stack) => this.quickSlotSystem.assignFromInventory(slot, stack).accepted,
        delete: (slot, stack) => {
          void (async () => {
            const ok = await confirmDialog(uiRoot, {
              title: "Delete item?",
              body: "This stack will be destroyed permanently.",
              confirmLabel: "Delete",
              cancelLabel: "Keep",
              danger: true,
            });
            if (!ok) return;
            this.inventory.tryDeleteStack(slot, stack);
          })();
          return false;
        },
    });
    this.ranged = new RangedCombatSystem(this.inventory, this.weaponSlot);
    this.weaponSlot.subscribe(() => { this.ranged?.onWeaponChanged(); this.syncHeldWeaponVisual(); });
    this.craftingPanel = new CraftingPanel(uiRoot, this.inventory, this.craftingSystem, this.hud.craftingToggle, (message) => {
      this.inventoryPanel.showStatus(message);
      // Only surface real problems as toasts (panel already confirms crafts).
      if (message.toLowerCase().includes("full") || message.toLowerCase().includes("need") || message.toLowerCase().includes("missing")) {
        this.notify.push(message, "warn");
      }
    }, (open) => { this.setCraftingOpen(open); }, (recipeId, outputItemId) => {
      this.onItemCrafted(recipeId, outputItemId);
    });
    this.buildingPresentation = new BuildingPresentation(this.scene, this.collision);
    this.buildPanel = new BuildModePanel(
      uiRoot,
      this.building,
      () => { this.tryBuildAction(); },
      () => { this.setBuildMode(false); },
      () => { this.refreshBuildGhost(); },
    );
    this.inventory.subscribe(() => {
      if (this.buildPanel.isOpen) this.buildPanel.refresh(this.inventory);
    });
    this.mapPanel = new GlobalMapPanel(uiRoot, this.locations, this.energy, (id) => this.enterLocationFromMap(id), (open, inTransit) => {
      // Overworld needs joystick/WASD — do not suppress input while map is open
      this.applyGameplayPanelState(this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen);
      if (open) {
        this.combat.cancelAttack();
        this.harvesting.cancel();
        this.player.stopMovement();
        this.setBuildMode(false);
      } else if (inTransit) {
        // should not happen often: if visibility closes while transit, stay safe
      }
      void inTransit;
    });
    this.localMap = new LocalMapPanel(uiRoot, (open) => {
      this.applyGameplayPanelState(
        open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.fidelity.isOpen || this.pauseMenu.isOpen,
      );
      if (open) {
        this.combat.cancelAttack();
        this.harvesting.cancel();
        this.player.stopMovement();
        this.localMap.setLocationTitle(getLocation(this.locations.currentId).title);
      }
    });
    this.deathScreen = new DeathScreen(uiRoot, () => this.respawnPlayer(), () => {
      this.persistSave(true);
      this.mainMenu.open();
      this.gameStarted = false;
      this.input.setSuppressed(true);
    });
    this.pauseMenu = new PauseMenu(
      uiRoot,
      () => ({
        level: this.experience.currentLevel,
        locationName: getLocation(this.locations.currentId).title,
        sessionPlaytimeSec: this.sessionPlaytimeSec,
      }),
      () => {
        this.applyGameplayPanelState(this.inventoryPanel.isOpen || this.craftingPanel.isOpen);
      },
      () => {
        this.persistSave(true);
        this.mainMenu.open();
        this.gameStarted = false;
        this.input.setSuppressed(true);
      },
      () => {
        this.inventoryPanel.toggle();
      },
    );
    this.mainMenu = new MainMenu(uiRoot, () => this.getMainMenuSummary(), (mode) => this.beginPlay(mode));
    this.langSelect = new LanguageSelectScreen(uiRoot, () => {
      this.mainMenu.open();
      this.mainMenu.refresh();
    });
    // Language pick must finish first — otherwise title buttons are under a blocking overlay
    if (this.langSelect.shouldShow) {
      this.mainMenu.close();
      this.langSelect.open();
    } else {
      this.mainMenu.open();
    }    this.resultFeedback = new ResourceResultFeedback(uiRoot, this.scene, this.engine);
    this.input = new InputController(this.hud.joystick, this.hud.primaryAction, this.hud.attackAction, GAME_CONFIG.joystickDeadZone);
    this.input.setSuppressed(true);
    this.interaction = new InteractionSystem(this.scene, this.world.interactables, this.config);
    this.groundLoot = new GroundLootSystem(this.world, new GroundLootVisuals(this.scene));
    // Starter resources only — gear/backpack are equipped on the survivor at New Game.
    spawnStarterGroundResources(this.groundLoot);
    this.spawnStarterMaterialsAndContainers();
    this.pickup = new PickupSystem(this.groundLoot, this.interaction, this.inventory, this.pickupResults, this.inventoryPanel);
    this.harvestRewardDelivery = new HarvestRewardDelivery(this.inventory);
    const resourceResults = new CompositeResourceResultSink([this.harvestRewardDelivery, this.resultFeedback]);
    this.harvestTools = new InventoryHarvestTools(this.inventory, this.weaponSlot);
    this.harvesting = new HarvestingSystem(this.config, this.harvestTools, this.player, this.interaction, resourceResults, (resource) => {
      this.world.removeResourceCollision(resource.resourceId);
      this.experience.addXp(3);
      this.stats.recordHarvest();
      if (this.achievements.tryUnlock("first-harvest")) this.notify.push("Achievement: First Harvest", "success");
      if (resource.resourceKind === "pine-tree") this.completeQuest("collect-pine-logs");
      if (resource.resourceKind === "limestone-rock") this.completeQuest("collect-limestone");
    });
    this.backpackSlot.subscribe((_prev, stack) => {
      if (stack) {
        this.completeQuest("equip-backpack");
        if (this.achievements.tryUnlock("backpacker")) this.notify.push("Achievement: Backpacker", "success");
      }
    });
    this.quickSlot.subscribe(() => { this.syncQuickHud(); });
    this.experience.subscribe((level) => {
      this.locations.unlockByLevel(level);
      this.syncHudNeeds();
      const tier = tierForLevel(level);
      if (level === tier.minLevel) this.notify.push(`Progression: ${tier.title}`, "info");
    });
    this.powerGrid.ensureHomeDefaults();
    this.raids.generate(1001, 2);
    this.raids.generate(1002, 3);
    this.raids.generate(1003, 4);
    this.stats.beginSession();
    validateContentRegistries((msg) => {
      if (import.meta.env.DEV) console.warn(msg);
    });
    this.mapPanel.setIntelProviders({
      events: () => this.worldEvents.events,
      raids: () => this.raids.list(),
      act: () => {
        const level = this.experience.currentLevel;
        const act = inferStoryAct(level, this.locations.serialize().visited);
        return getStoryAct(act);
      },
      power: () => ({ production: this.powerGrid.production, consumption: this.powerGrid.consumption, storage: this.powerGrid.storage }),
    });
    for (const npc of SURVIVOR_CAMP_NPCS) this.npcs.registerNpc(npc);
    this.npcs.registerDialogue(Object.freeze({
      id: "jon-hello",
      text: "Need fiber, a pack, and eyes on the highway? Work with us.",
      choices: Object.freeze([
        Object.freeze({ id: "accept", label: "I'll help.", next: "jon-accept", startQuest: "collect-pine-logs", grantReputation: 5 }),
        Object.freeze({ id: "leave", label: "Later.", end: true }),
      ]),
    }));
    this.npcs.registerDialogue(Object.freeze({
      id: "jon-accept",
      text: "Good. Return when you've stocked timber.",
      choices: Object.freeze([Object.freeze({ id: "ok", label: "Understood.", end: true })]),
    }));
    this.npcs.setOffers("trader-mira", Object.freeze([
      Object.freeze({
        id: "bandage-trade",
        costs: Object.freeze([{ itemId: "plant-fiber" as const, quantity: 6 }]),
        offer: createItemStack("bandage", 2),
      }),
      Object.freeze({
        id: "token-ammo",
        costs: Object.freeze([{ itemId: "scrap-metal" as const, quantity: 4 }]),
        offer: createItemStack("pistol-ammo", 6),
        currencyCost: 0,
      }),
    ]));
    this.locks.register({ id: "motel-room-7", kind: "key", requiredKey: "rusted-key", locked: true });
    this.locks.register({ id: "factory-warehouse", kind: "power", locked: true, powered: false });
    this.locks.register({ id: "bunker-armory", kind: "access-card", requiredKey: "security-badge", locked: true });
    this.farming.ensurePlot("home-plot-1");
    this.farming.ensurePlot("home-plot-2");
    this.syncHeldWeaponVisual();
    this.syncQuickHud();
    this.fidelity = new FidelityMode(uiRoot, () => { /* freeze read in loop */ });
    this.hudLayoutEditor = new HudLayoutEditor(uiRoot, this.hud.root, (open) => {
      this.applyGameplayPanelState(open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.fidelity.isOpen);
    });
    this.debug = new DebugOverlay(
      uiRoot,
      this.scene,
      this.engine,
      this.player,
      this.collision,
      this.interaction,
      this.harvesting,
      this.resultFeedback,
      this.groundLoot,
      this.pickupResults,
      this.inventory,
      this.equipment,
      this.equipmentSystem,
      this.weaponSlot,
      this.backpackSlot,
      this.craftingSystem,
      this.combatTargets,
      this.combat,
      this.enemies,
      this.playerDamage,
      this.fidelity,
      this.world,
      this.postProcessing,
      this.config,
      {
        input: this.input,
        isInventoryOpen: () => this.inventoryPanel.isOpen,
        isCraftingOpen: () => this.craftingPanel.isOpen,
        lastHarvestDelivery: () => this.harvestRewardDelivery.lastResult,
      },
    );
    this.calibration = new CalibrationPanel(uiRoot, this.config, () => { this.applyCalibration(); });
    this.bindHudControls();
    this.loop = new GameLoop(this.engine, (delta) => { this.update(delta); });
    window.addEventListener("resize", this.onResize);
    window.addEventListener("keydown", this.onFunctionKey);
    window.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden" && this.gameStarted) this.persistSave(false);
    });
    window.addEventListener("pagehide", () => {
      if (this.gameStarted) this.persistSave(false);
    });
    window.addEventListener("beforeunload", () => {
      if (this.gameStarted) this.persistSave(false);
    });
    GAME_AUDIO.setMasterVolume(I18N.gameSettings.masterVolume);
    I18N.onChange(() => { this.applyUserSettingsRuntime(); });
    this.applyUserSettingsRuntime();
  }

  async start(): Promise<void> {
    this.camera.update(0, this.player.position);
    await this.scene.whenReadyAsync();
    document.body.classList.add("game-ready");
    this.loop.start();
  }

  private beginPlay(mode: "new" | "continue"): void {
    try {
      if (mode === "continue") {
        const blob = SAVE_SYSTEM.load();
        if (blob) this.applySave(blob);
        else {
          this.resetSessionForNewGame();
          this.grantStarterInventory();
        }
      } else {
        this.resetSessionForNewGame();
        this.grantStarterInventory();
      }
      this.gameStarted = true;
      this.deathHandled = false;
      this.locations.unlockByLevel(this.experience.currentLevel);
      const theme = this.world.applyLocationVisual(this.locations.currentId);
      this.lighting.applyLocationTheme(theme);
      this.nearFire = this.locations.currentId === "home" || theme.showCampfire;
      this.respawnLocationEnemies(this.locations.currentId);
      this.mainMenu.close();
      this.pauseMenu.close();
      this.deathScreen.close();
      this.input.setSuppressed(false);
      this.applyGameplayPanelState(false);
      // Commit immediately so Continue always has bag/armor/resources after New Game or load.
      this.persistSave(false);
      this.autosaveTimer = 0;
      this.syncQuickHud();
      this.syncHudNeeds();
      this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
      this.mainMenu.refresh();
    } catch (error) {
      console.error("[beginPlay]", error);
      this.mainMenu.open();
      this.gameStarted = false;
      this.input.setSuppressed(true);
      this.notify.push("Failed to start game — see console", "error");
    }
  }

  /** Wipe session state so New Game isn't a soft continue on stale inventory/enemies. */
  private resetSessionForNewGame(): void {
    SAVE_SYSTEM.clear();
    this.clearInventoryCompletely();
    this.player.health.restoreFull();
    this.hunger.set(SURVIVAL_CONFIG.hunger.max);
    this.thirst.set(SURVIVAL_CONFIG.thirst.max);
    this.energy.set(SURVIVAL_CONFIG.energy.max);
    this.cold.set(0);
    this.player.visual.root.position.set(0, 0, 3);
    this.player.stopMovement();
    this.locations.forceSet("home");
    this.sessionPlaytimeSec = 0;
    this.totalPlaytimeSec = 0;
    this.greyhavenVisits = 0;
    this.deathHandled = false;
    this.sneak.setActive(false);
    this.hud.setSneakActive(false);
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.mapPanel.close();
    this.setBuildMode(false);
    this.camera.resetFraming();
    this.building.clear();
    this.buildingPresentation.sync(this.building);
  }

  private clearInventoryCompletely(): void {
    this.inventory.clearAllStorage();
    for (const slot of this.equipment.getSlots()) {
      if (slot.stack) this.equipment.unequipIfAccepted(slot.id, slot.stack, () => true);
    }
    const weapon = this.weaponSlot.current;
    if (weapon) this.weaponSlot.unequipIfAccepted(weapon, () => true);
    const pack = this.backpackSlot.current;
    if (pack) this.backpackSlot.unequipIfAccepted(pack, () => true);
    const quick = this.quickSlot.current;
    if (quick) this.quickSlot.clearIfAccepted(quick, () => true);
    const util = this.utilitySlot.current;
    if (util) this.utilitySlot.unequipIfAccepted(util, () => true);
    this.syncHeldWeaponVisual();
  }

  private getMainMenuSummary() {
    const blob = SAVE_SYSTEM.load();
    if (!blob) return { hasSave: false as const };
    const loc = getLocation(blob.locationId);
    return {
      hasSave: true as const,
      level: blob.xp?.level ?? 1,
      locationId: blob.locationId,
      locationName: loc.title,
      playtimeSec: blob.playtimeSec ?? 0,
      lastPlayedAt: blob.savedAt,
    };
  }

  private bindHudControls(): void {
    this.hud.quickSlotButton.addEventListener("click", () => { this.useQuickSlot(); });
    this.hud.sneakButton.addEventListener("click", () => { this.toggleSneak(); });
    this.hud.mapButton.addEventListener("click", () => {
      if (!this.gameStarted || this.player.health.dead) return;
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.localMap.close();
      this.mapPanel.toggle();
    });
    this.hud.onMinimapClick(() => {
      if (!this.gameStarted || this.player.health.dead) return;
      if (this.mapPanel.isOpen) this.mapPanel.close();
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.localMap.setLocationTitle(getLocation(this.locations.currentId).title);
      this.localMap.toggleFrom(this.hud.minimapElement);
    });
    this.hud.buildButton.addEventListener("click", () => { this.toggleBuild(); });
    const settingsBtn = this.hud.root.querySelector<HTMLButtonElement>(".settings-shell");
    if (settingsBtn) {
      settingsBtn.disabled = false;
      settingsBtn.setAttribute("aria-label", "Pause menu");
      settingsBtn.addEventListener("click", () => {
        if (!this.gameStarted || this.player.health.dead) return;
        this.pauseMenu.toggle();
      });
    }
  }

  private update(delta: number): void {
    if (!this.gameStarted || this.mainMenu.isOpen || this.pauseMenu.isOpen || this.langSelect.isOpen) {
      this.scene.render();
      return;
    }
    const frameDelta = this.fidelity.motionFrozen ? 0 : delta;
    if (frameDelta > 0 && this.player.health.alive) {
      this.sessionPlaytimeSec += frameDelta;
      this.totalPlaytimeSec += frameDelta;
    }
    this.worldClock.tick(frameDelta);
    this.worldDayAccum += frameDelta / 480;
    this.worldEvents.tick(this.worldDayAccum);
    this.contracts.tick(this.worldDayAccum);
    const survivedDay = Math.floor(this.worldDayAccum);
    if (survivedDay >= 1 && this.achievements.tryUnlock("survive-day-1")) this.notify.push("Achievement: First Dawn", "success");
    if (survivedDay >= 10 && this.achievements.tryUnlock("survive-day-10")) this.notify.push("Achievement: Ten Days Out", "success");
    if (survivedDay >= 50 && this.achievements.tryUnlock("survive-day-50")) this.notify.push("Achievement: Hardened Settler", "success");
    const resets = this.dungeonResets.tick(this.worldDayAccum);
    if (resets.length > 0) {
      this.notify.push(`Dungeon reset: ${resets.join(", ")}`, "info");
    }
    this.powerGrid.tick(frameDelta, this.worldClock.sunIntensity());
    this.water.tick(frameDelta, this.powerGrid.net >= 0 || this.powerGrid.storage > 1);
    if (frameDelta > 0 && this.player.health.alive) this.stats.tickPlaytime(frameDelta);
    this.quickSlot.tick(frameDelta);
    this.tickSurvival(frameDelta);
    this.autosaveTimer += frameDelta;
    if (this.autosaveTimer >= 45) {
      this.autosaveTimer = 0;
      this.persistSave(false);
    }

    const movement = this.input.getMovement();
    if (this.mapPanel.isOpen) {
      this.mapPanel.tick(frameDelta, movement);
      this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
      this.syncHudNeeds();
      this.scene.render();
      return;
    }
    const sprinting = this.input.isSprintHeld && !this.sneak.isSneaking;
    const speedMul = this.sneak.moveMul * (sprinting ? 2 : 1);
    const action = this.input.consumePrimaryActionState();
    const attackPressed = this.input.consumeAttackPressed();
    const attackHeld = this.input.isAttackHeld;
    this.combatTargets.update(this.player.position);

    const buildMode = this.building.isBuildMode;
    if (buildMode) {
      this.refreshBuildGhost();
      if (!this.fidelity.motionFrozen && this.player.health.alive) {
        this.player.update(delta, movement, this.camera.screenRight, this.camera.screenUp, this.sneak.isSneaking, speedMul);
        if (action.pressedThisFrame) this.tryBuildAction();
      }
      this.world.update(frameDelta);
      this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
      this.syncHudNeeds();
      this.camera.update(frameDelta, this.player.position);
      this.debug.update();
      this.scene.render();
      return;
    }

    if (!this.fidelity.motionFrozen && this.player.health.alive && (attackPressed || attackHeld)) {
      this.combat.requestAttack();
    }
    if (!this.fidelity.motionFrozen && this.player.health.alive) {
      if (this.combat.movementCommitted || this.harvesting.active) {
        movement.setAll(0);
        this.player.stopMovement();
      }
      this.player.update(delta, movement, this.camera.screenRight, this.camera.screenUp, this.sneak.isSneaking, speedMul);
      this.combat.update(delta);
      if ((attackPressed || attackHeld) && this.combat.state === "ready") this.combat.requestAttack();
      this.tryLeaveLocationByEdge();
    }
    this.combatTargets.update(this.player.position);
    this.enemies.update(frameDelta, {
      sneaking: this.sneak.isSneaking,
      sprinting,
    });
    this.combatTargets.update(this.player.position);
    this.world.update(frameDelta);
    this.interaction.update(frameDelta, this.player.position, this.player.facingYaw);
    if (!this.fidelity.motionFrozen && this.player.health.alive && this.combat.state === "ready") {
      const harvestingConsumed = this.harvesting.update(delta, action, movement, this.player.position);
      if (!harvestingConsumed) {
        // Hold E / Space — vacuum all ground loot in range while walking.
        if (action.isHeld || action.pressedThisFrame) {
          const playerPoint = {
            x: this.player.position.x,
            y: this.player.position.y,
            z: this.player.position.z,
          };
          const vacuum = this.pickup.tryVacuumInRange(playerPoint, this.config.interaction.range);
          if (vacuum.inventoryFull && action.pressedThisFrame) {
            this.notify.push("Inventory full", "warn");
          }
        }
        // Containers / other one-shot interacts still need a discrete press (not hold spam).
        if (action.pressedThisFrame) {
          const selected = this.interaction.target;
          if (selected instanceof GroundLoot) {
            // Already handled by vacuum this frame if in range.
          } else {
            const interactionAccepted = this.interaction.tryInteract(this.player.position, (targetPosition) => {
              this.player.requestFacing(targetPosition);
            });
            if (interactionAccepted && selected instanceof WorldContainerEntity) {
              this.lootContainerPrompt(selected);
            }
          }
        }
      }
    }
    const combatTarget = this.combatTargets.current;
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.syncHudNeeds();
    this.hud.setAttackState(
      this.player.health.alive && combatTarget !== null,
      this.player.health.alive && this.combatTargets.state.distance <= resolvePlayerMeleeProfile(this.weaponSlot).hitRange,
      this.combat.state !== "ready",
    );
    this.hud.setAttackWeapon(this.weaponSlot.current?.itemId ?? null);
    this.hud.setSneakActive(this.sneak.isSneaking);
    const minimapFrame = Object.freeze({
      playerX: this.player.position.x,
      playerZ: this.player.position.z,
      facingYaw: this.player.facingYaw,
      cameraYawRad: this.config.camera.yawDeg * Math.PI / 180,
      worldHalfExtent: GAME_CONFIG.worldSize / 2,
      markers: Object.freeze([
        ...this.world.collectMinimapMarkers(),
        ...this.combatDummies.filter((dummy) => dummy.isCombatAlive() && this.locations.currentId === "home").map((dummy) => {
          const p = dummy.getCombatPosition();
          return Object.freeze({ kind: "dummy" as const, x: p.x, z: p.z });
        }),
        ...this.enemies.agents.map((enemy) => {
          const p = enemy.getCombatPosition();
          return Object.freeze({ kind: "enemy" as const, x: p.x, z: p.z, yaw: enemy.facingYaw });
        }),
      ]),
    });
    this.hud.updateMinimap(minimapFrame);
    this.localMap.update(minimapFrame);
    const target = this.interaction.target;
    if (!this.player.health.alive) this.hud.setPrimaryActionContext("none");
    else if (target instanceof HarvestableResource) {
      this.hud.setPrimaryActionContext(target.requiredTool, this.harvestTools.hasTool(target.requiredTool), this.harvesting.state.unavailableFeedback);
    } else if (target instanceof GroundLoot) {
      this.hud.setGroundLootActionContext(ITEM_REGISTRY.get(target.stack.itemId), target.stack.quantity);
    } else if (target instanceof WorldContainerEntity) {
      this.hud.setPrimaryActionContext("generic");
    } else this.hud.setPrimaryActionContext(target ? "generic" : "none");
    this.camera.update(frameDelta, this.player.position);
    this.groundLoot.update(frameDelta);
    this.resultFeedback.update(frameDelta);
    this.combatPresentation.update(frameDelta, combatTarget);
    this.enemyPresentation.update(frameDelta, this.enemies.agents);
    if (this.inventoryPanel.isOpen) {
      this.inventoryPanel.updateLiveFrame({
        currentHealth: this.player.health.currentHealth,
        maxHealth: this.player.health.maxHealth,
        moveSpeed: this.config.player.movementSpeed
          * this.skills.moveSpeedMultiplier()
          * this.sneak.moveMul
          * (this.input.isSprintHeld && !this.sneak.isSneaking ? 2 : 1),
        motionFrozen: this.fidelity.motionFrozen,
      });
    }
    this.debug.update();
    this.scene.render();
  }

  private tickSurvival(frameDelta: number): void {
    if (frameDelta <= 0 || !this.player.health.alive) return;
    this.hunger.tickDrain(SURVIVAL_CONFIG.hunger.drainPerSecond, frameDelta);
    this.thirst.tickDrain(SURVIVAL_CONFIG.thirst.drainPerSecond, frameDelta);
    this.energy.tickRegen(SURVIVAL_CONFIG.energy.regenPerSecond * this.skills.energyRegenMultiplier(), frameDelta);
    this.ranged?.tick(frameDelta);
    this.campfireQueue.setFrozen(this.fidelity.motionFrozen);
    this.campfireQueue.tick(frameDelta);
    this.worldClock.setFrozen(this.fidelity.motionFrozen);
    this.worldClock.tick(frameDelta);
    this.farming.tick(frameDelta);
    this.horde.tick(frameDelta);
    let warmth = 0;
    for (const slot of this.equipment.getSlots()) {
      const stack = slot.stack;
      if (!stack) continue;
      warmth += ITEM_REGISTRY.get(stack.itemId).equipment?.warmth ?? 0;
    }
    const coldDamage = this.cold.tick(
      effectiveColdExposure(this.locations.currentId),
      Math.min(1, warmth),
      this.nearFire,
      frameDelta,
    );
    if (coldDamage > 0) {
      this.player.health.applyDamage(coldDamage);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
    const statusTick = this.status.tick(frameDelta);
    if (statusTick.healthDelta > 0) this.player.health.heal(statusTick.healthDelta);
    else if (statusTick.healthDelta < 0) {
      this.player.health.applyDamage(-statusTick.healthDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
    if (this.hunger.isEmpty) {
      this.player.health.applyDamage(SURVIVAL_CONFIG.hunger.starvationDamagePerSecond * frameDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
    if (this.thirst.isEmpty) {
      this.player.health.applyDamage(SURVIVAL_CONFIG.thirst.dehydrationDamagePerSecond * frameDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
  }

  private syncHudNeeds(): void {
    this.hud.setNeeds(this.hunger.ratio, this.thirst.ratio, this.energy.ratio);
    const xpRatio = this.experience.currentXp / Math.max(1, this.experience.xpToNextLevel);
    this.hud.setLevel(this.experience.currentLevel, xpRatio);
  }

  private syncQuickHud(): void {
    const stack = this.quickSlot.current;
    this.hud.setQuickSlot(stack?.itemId ?? null, stack?.quantity ?? 0);
  }

  private useQuickSlot(): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    if (!this.quickSlotSystem.canUse() && this.quickSlot.current === null) {
      // Auto-assign first matching consumable from inventory base pockets.
      for (let i = 0; i < this.inventory.slotCount; i += 1) {
        const stack = this.inventory.getSlot(i).stack;
        if (!stack || !PlayerQuickSlot.isCompatible(stack.itemId)) continue;
        const assigned = this.quickSlotSystem.assignFromInventory(i, stack);
        if (assigned.accepted) {
          this.syncQuickHud();
          break;
        }
      }
      if (this.quickSlot.current === null) {
        this.notify.push("No consumable for quick slot", "warn");
        return;
      }
    }
    const result = this.consumables.useFromQuickSlot();
    if (!result.accepted) {
      if (result.reason === "full-health") this.notify.push("Health full", "info");
      else if (result.reason === "empty") this.notify.push("Quick slot empty", "warn");
      else if (result.reason === "cooldown") this.notify.push("Cooldown", "info");
      else this.notify.push("Can't use", "warn");
      return;
    }
    this.syncQuickHud();
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.syncHudNeeds();
  }

  /** Equip first torch from pockets into utility slot (or unequip when KeyU). */
  private toggleUtilityTorch(): void {
    if (!this.gameStarted) return;
    if (this.utilitySlot.current) {
      const ok = this.utilityEquipSystem.unequipToInventory(this.utilitySlot.current);
      if (!ok) this.notify.push("Inventory full", "warn");
      return;
    }
    for (let i = 0; i < this.inventory.slotCount; i += 1) {
      const stack = this.inventory.getSlot(i).stack;
      if (!stack || !PlayerUtilitySlot.isCompatible(stack.itemId)) continue;
      if (this.utilityEquipSystem.equipFromInventory(i, stack)) {
        return;
      }
    }
    this.notify.push("No utility item", "warn");
  }

  private toggleSneak(): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    this.sneak.toggle();
    this.hud.setSneakActive(this.sneak.isSneaking);
  }

  private toggleBuild(): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    if (this.locations.currentId !== "home") {
      this.notify.push("Build only at Home", "warn");
      return;
    }
    this.setBuildMode(!this.building.isBuildMode);
  }

  /** LDOE Base Builder: open/close mode chrome — does not place on enter. */
  private setBuildMode(open: boolean): void {
    if (open === this.building.isBuildMode) {
      if (!open) return;
    }
    if (open) {
      if (this.locations.currentId !== "home") {
        this.notify.push("Build only at Home", "warn");
        return;
      }
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.localMap.close();
      this.combat.cancelAttack();
      this.harvesting.cancel();
      this.building.open();
      this.buildPanel.open(this.inventory);
      this.hud.setBuildActive(true);
      this.camera.setBuildModeBoost(true);
      this.camera.applyProjection();
      this.buildingPresentation.sync(this.building);
      this.refreshBuildGhost();
    } else {
      this.building.close();
      this.buildPanel.close();
      this.hud.setBuildActive(false);
      this.camera.setBuildModeBoost(false);
      this.camera.applyProjection();
      this.buildingPresentation.setGhost(false, 0, 0, 0, false, null);
    }
  }

  private refreshBuildGhost(): void {
    if (!this.building.isBuildMode) {
      this.buildingPresentation.setGhost(false, 0, 0, 0, false, null);
      return;
    }
    const cursor = cursorGridFromPlayer(
      this.player.position.x,
      this.player.position.z,
      this.player.facingYaw,
    );
    if (this.building.isDemolishMode) {
      const hasAny = ["furniture", "structure", "floor"].some((layer) =>
        this.building.pieceAt(cursor.gx, cursor.gz, layer as "furniture" | "structure" | "floor"),
      );
      this.buildingPresentation.setGhost(true, cursor.gx, cursor.gz, this.building.currentRotation, hasAny, this.building.selected);
      return;
    }
    const valid = this.building.canPlace(cursor.gx, cursor.gz) && this.building.canAfford(this.inventory);
    this.buildingPresentation.setGhost(
      true,
      cursor.gx,
      cursor.gz,
      this.building.currentRotation,
      valid,
      this.building.selected,
    );
  }

  private tryBuildAction(): void {
    if (!this.building.isBuildMode || !this.gameStarted || !this.player.health.alive) return;
    const cursor = cursorGridFromPlayer(
      this.player.position.x,
      this.player.position.z,
      this.player.facingYaw,
    );
    if (this.building.isDemolishMode) {
      const removed = this.building.demolishAt(cursor.gx, cursor.gz);
      if (!removed) {
        this.notify.push("Nothing to remove", "warn");
        return;
      }
      this.buildingPresentation.sync(this.building);
      this.buildPanel.refresh(this.inventory);
      this.refreshBuildGhost();
      return;
    }
    const result = this.building.placeWithCost(this.inventory, cursor.gx, cursor.gz);
    if (!result.piece) {
      const msg = {
        "not-enough-resources": "Not enough resources",
        "needs-floor": "Need a floor under that",
        "not-adjacent": "Floors must connect",
        "slot-occupied": "Cell occupied",
        "out-of-bounds": "Outside home lot",
        "not-selected": "Select a piece",
        "unknown-piece": "Unknown piece",
        "invalid-cell": "Can't place here",
      }[result.reason ?? "invalid-cell"] ?? "Can't place here";
      this.notify.push(msg, "warn");
      return;
    }
    this.buildingPresentation.sync(this.building);
    this.buildPanel.refresh(this.inventory);
    this.refreshBuildGhost();
    if (this.achievements.tryUnlock("builder")) this.notify.push("Achievement: Builder", "success");
    if (result.piece.pieceId === "floor-l1" || result.piece.layer === "floor") this.completeQuest("build-floor");
    if (result.piece.pieceId === "chest-small" || result.piece.pieceId.includes("chest")) this.completeQuest("build-chest");
    if (result.piece.layer === "structure") this.completeQuest("build-wall");
  }

  private onItemCrafted(recipeId: string, outputItemId: string): void {
    this.stats.recordCraft();
    this.journal.discoverItem(outputItemId as import("../items/ItemId").ItemId);
    if (this.achievements.tryUnlock("first-craft")) this.notify.push("Achievement: First Craft", "success");
    const crafted = this.stats.snapshot().itemsCrafted;
    if (crafted >= 25 && this.achievements.tryUnlock("master-crafter")) this.notify.push("Achievement: Master Crafter", "success");
    if (crafted >= 100 && this.achievements.tryUnlock("craft-100")) this.notify.push("Achievement: Assembly Line", "success");

    const hatchets = new Set(["hatchet", "stone-hatchet", "reinforced-hatchet", "advanced-hatchet", "steel-hatchet"]);
    const spears = new Set(["spear", "improved-spear", "long-spear", "tactical-spear"]);
    if (hatchets.has(outputItemId) || recipeId.includes("hatchet")) this.completeQuest("craft-hatchet");
    if (spears.has(outputItemId) || recipeId.includes("spear")) this.completeQuest("craft-spear");
    if (outputItemId === "bandage" || recipeId.includes("bandage")) this.completeQuest("craft-bandage");
    if (
      outputItemId === "vegetable-soup" || outputItemId === "meat-stew" || outputItemId === "mushroom-soup"
      || outputItemId === "roasted-meat" || outputItemId === "survival-meal" || outputItemId === "warming-meal"
      || outputItemId === "high-energy-meal"
    ) {
      this.completeQuest("cook-meal");
      if (this.achievements.tryUnlock("first-cook")) this.notify.push("Achievement: Campfire Cook", "success");
    }
    if (outputItemId === "iron-bar") this.completeQuest("smelt-iron");
    if (outputItemId === "crowbar" || outputItemId === "machete" || outputItemId === "cleaver" || outputItemId === "pipe-club") {
      this.completeQuest("craft-iron-weapon");
    }
    if (outputItemId.startsWith("leather-")) this.completeQuest("craft-leather-armor");
    if (outputItemId === "first-aid-kit") this.completeQuest("craft-first-aid");
    if (outputItemId === "steel-hatchet" || outputItemId === "steel-pickaxe") {
      this.completeQuest("craft-steel-tool");
      if (this.achievements.tryUnlock("steel-worker")) this.notify.push("Achievement: Steel Worker", "success");
    }
    if (outputItemId === "clean-water" || outputItemId === "purified-water") {
      this.completeQuest("purify-water");
      if (this.achievements.tryUnlock("first-purify")) this.notify.push("Achievement: Clear Draught", "success");
    }
    if (outputItemId === "reinforced-backpack") this.completeQuest("craft-backpack-reinforced");
    if (outputItemId === "advanced-medical-kit") this.completeQuest("craft-advanced-med");
    if (outputItemId.includes("composite") || outputItemId === "composite-axe" || outputItemId === "composite-fiber") {
      if (this.achievements.tryUnlock("composite-crafter")) this.notify.push("Achievement: Composite Hand", "success");
    }
    void recipeId;
  }

  private completeQuest(id: Parameters<QuestSystem["advance"]>[0]): void {
    const result = this.quests.advance(id);
    if (result.completedNow) {
      this.experience.addXp(result.rewardXp);
      this.notify.push(`Quest complete (+${result.rewardXp} XP)`, "success");
      this.syncHudNeeds();
    }
  }

  private tryLeaveLocationByEdge(): void {
    if (this.mapPanel.isOpen || this.player.health.dead) return;
    const half = GAME_CONFIG.worldSize / 2 - 0.85;
    const x = this.player.position.x;
    const z = this.player.position.z;
    let edge: "n" | "s" | "e" | "w" | null = null;
    if (z >= half) edge = "n";
    else if (z <= -half) edge = "s";
    else if (x >= half) edge = "e";
    else if (x <= -half) edge = "w";
    if (!edge) return;
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.player.stopMovement();
    // Pull slightly inward so re-enter after cancel does not instantly re-exit
    const pull = GAME_CONFIG.worldSize / 2 - 2.5;
    if (edge === "n") this.player.visual.root.position.z = pull;
    if (edge === "s") this.player.visual.root.position.z = -pull;
    if (edge === "e") this.player.visual.root.position.x = pull;
    if (edge === "w") this.player.visual.root.position.x = -pull;
    this.mapPanel.openFromEdge(this.locations.currentId, edge);
  }

  private enterLocationFromMap(id: LocationId): void {
    if (this.locations.mode === "vehicle") {
      if (!this.vehicle.hasAnyVehicle) {
        this.notify.push("No vehicle assembled", "warn");
        return;
      }
      if (!this.vehicle.tryTravelConsume(1)) {
        this.notify.push("Not enough fuel", "warn");
        return;
      }
      this.locations.unlockVehicle();
    }
    const result = this.locations.enterFromMap(id);
    if (!result.accepted) {
      this.notify.push(result.reason ?? "Can't enter", "warn");
      return;
    }
    this.afterTravelArrive(id);
  }

  private afterTravelArrive(id: LocationId): void {
    void this.fullLoader.run(`Arriving: ${getLocation(id).title}`, () => {
      this.finishTravelArrive(id);
    }, 380);
  }

  private finishTravelArrive(id: LocationId): void {
    this.mapPanel.close();
    this.setBuildMode(false);
    this.player.visual.root.position.set(0, 0, 3);
    this.player.stopMovement();
    // Swap biomes / props / ground / lighting for this destination
    const theme = this.world.applyLocationVisual(id);
    this.lighting.applyLocationTheme(theme);
    this.nearFire = id === "home" || theme.showCampfire;
    this.journal.discoverLocation(id);
    this.stats.recordTravel(1);
    this.stats.recordLocationDiscovered();
    for (const note of loreNotesForLocation(id)) {
      if (!this.journal.hasNote(note.id)) {
        this.journal.addNote(note.id, `${note.title}: ${note.text}`);
        this.notify.push(`Journal: ${note.title}`, "info");
      }
    }
    this.experience.addXp(5);
    if (id === "pine-woods") this.completeQuest("visit-pine-woods");
    if (id === "rocky-outcrop" || id === "limestone-ridge") this.completeQuest("visit-rocky-hills");
    if (id === "swamp-hollow") this.completeQuest("visit-swamp-edge");
    if (id.startsWith("greyhaven") || id.startsWith("metro")) this.completeQuest("visit-greyhaven");
    if (id === "abandoned-hospital" || id === "greyhaven-hospital-district") this.completeQuest("visit-hospital");
    if (id === "ironbound-prison") this.completeQuest("visit-prison");
    if (id.startsWith("metro") || id === "city-sewers") this.completeQuest("visit-metro");
    if (id === "bunker-echo" || id.startsWith("bunker-echo")) this.completeQuest("reach-bunker-echo");
    if (id !== "home" && this.achievements.tryUnlock("explorer")) this.notify.push("Achievement: Explorer", "success");
    if (id === "old-highway" && this.achievements.tryUnlock("road-explorer")) this.notify.push("Achievement: Road Explorer", "success");
    if (id === "survivor-camp") {
      this.npcs.beginDialogue("quest-jon", "jon-hello");
      this.reputation.add("frontier-survivors", 2);
    }
    if (id === "ironbound-fort") this.reputation.add("ironbound-collective", 3);
    if (id === "wayfarer-post") this.reputation.add("wayfarer-network", 3);
    if (id.startsWith("greyhaven") || id.startsWith("metro") || id === "city-sewers") {
      this.greyhavenVisits += 1;
      if (this.achievements.tryUnlock("city-walker")) this.notify.push("Achievement: City Walker", "success");
      if (this.greyhavenVisits >= 3 && this.achievements.tryUnlock("greyhaven-scout")) {
        this.notify.push("Achievement: Greyhaven Scout", "success");
      }
    }
    if (id === "metro-central" && this.achievements.tryUnlock("metro-linked")) this.notify.push("Achievement: Metro Linked", "success");
    if (id === "exclusion-wastes" || id === "exclusion-safehouse") {
      if (this.achievements.tryUnlock("exclusion-walker")) this.notify.push("Achievement: Ash Walker", "success");
    }
    if (id === "helix-core" && this.achievements.tryUnlock("helix-ascendant")) this.notify.push("Achievement: Helix Ascendant", "success");
    if (id === "bunker-echo" && this.achievements.tryUnlock("bunker-survivor")) {
      this.notify.push("Achievement: Bunker Survivor", "success");
    }
    if ((id === "bunker-echo-f3" || id === "bunker-echo-f4" || id === "bunker-echo-f5")
      && this.achievements.tryUnlock("bunker-raider")) {
      this.notify.push("Achievement: Bunker Raider", "success");
    }
    if (id === "bunker-echo-f3") {
      this.warden.reset();
      this.warden.acquire();
      this.notify.push(`${this.warden.profile.displayName} stirs…`, "warn");
    }
    if (id === "ash-jackal-outpost") {
      const raid = this.raids.list()[0];
      if (raid && !raid.cleared) this.notify.push(`Raid site nearby: ${raid.title}`, "warn");
    }
    const evt = this.worldEvents.events[0];
    if (evt && !evt.claimed) this.notify.push(`World event: ${evt.title}`, "info");
    // Auto-resolve low-danger event when traveling into resource zones during active events.
    if (evt && !evt.claimed && evt.danger <= 2 && id !== "home") {
      const claim = this.worldEvents.claim(evt.id);
      if (claim.accepted) {
        const reward = rollNamedLoot(claim.lootProfile, claim.seed * 9973);
        for (const stack of reward) {
          if (!this.inventory.tryInsert(stack).accepted) this.mailbox.deliver(stack, this.inventory);
        }
        this.completeQuest("claim-world-event");
        if (this.achievements.tryUnlock("world-event-hunter")) this.notify.push("Achievement: Signal Chaser", "success");
        this.notify.push(`Claimed event: ${evt.title}`, "success");
      }
    }
    this.persistSave(false);
    this.respawnLocationEnemies(id);
    this.syncHudNeeds();
  }

  private lootContainerPrompt(container: WorldContainerEntity): void {
    let moved = 0;
    for (let i = 0; i < container.inventory.slotCount; i += 1) {
      const stack = container.inventory.take(i);
      if (!stack) continue;
      if (this.inventory.tryInsert(stack).accepted) moved += 1;
      else {
        container.inventory.place(i, stack);
        break;
      }
    }
    if (moved <= 0) this.notify.push("Cannot loot", "warn");
  }

  private onEnemyKilled(enemy: RoamingZombie): void {
    const archetype = enemy.archetype;
    this.experience.addXp(archetype.xpReward);
    this.stats.recordEnemyKill(enemy.role === "boss");
    this.completeQuest("kill-zombie");
    this.completeQuest("kill-infected-10");
    if (this.achievements.tryUnlock("first-kill")) this.notify.push("Achievement: First Kill", "success");
    const kills = this.stats.snapshot().enemiesKilled;
    if (kills >= 50 && this.achievements.tryUnlock("kills-50")) this.notify.push("Achievement: Fifty Fallen", "success");
    if (kills >= 200 && this.achievements.tryUnlock("kills-200")) this.notify.push("Achievement: War of Attrition", "success");
    const locId = this.locations.currentId;
    const cityLike = locId.startsWith("greyhaven") || locId.startsWith("metro") || locId.includes("hospital") || locId.includes("prison");
    const swampLike = locId.includes("swamp");
    const industrialLike = locId.includes("industrial") || locId.includes("factory") || locId.includes("power");
    const hard = this.locations.currentDefinition.difficulty >= 4;
    const profile = enemy.role === "boss"
      ? "raid-mid"
      : cityLike
        ? "city-infected"
        : swampLike
          ? "swamp-loot"
          : industrialLike
            ? "industrial-loot"
            : hard
              ? "raid-mid"
              : "zombie-basic";
    const loot = rollNamedLoot(profile, Date.now() + enemy.combatId.length * 17);
    for (const stack of loot) {
      if (stack.itemId === "map-fragment") {
        this.completeQuest("recover-map-fragment");
        if (this.achievements.tryUnlock("map-fragment-finder")) this.notify.push("Achievement: Paper Trail", "success");
      }
      this.groundLoot.placeAuthoredStack(
        stack,
        Object.freeze({ x: enemy.getCombatPosition().x, y: 0, z: enemy.getCombatPosition().z }),
        `zombie-loot:${enemy.combatId}:${stack.itemId}`,
      );
    }
    // Densify mid/high kill salvage occasionally.
    if (Math.random() < 0.12) {
      const salvage = rollNamedLoot("junk-salvage", Date.now() + kills * 31);
      for (const stack of salvage) {
        this.groundLoot.placeAuthoredStack(
          stack,
          Object.freeze({ x: enemy.getCombatPosition().x + 0.35, y: 0, z: enemy.getCombatPosition().z }),
          `zombie-junk:${enemy.combatId}:${stack.itemId}`,
        );
      }
    }
    const raidDone = this.contracts.completeByKind("eliminate");
    if (raidDone) {
      this.experience.addXp(raidDone.rewardXp);
      this.reputation.add(raidDone.factionId, raidDone.rewardReputation);
      this.notify.push(`Contract ready: ${raidDone.title}`, "success");
      this.completeQuest("frontier-favor");
    }
    this.syncHudNeeds();
  }

  private spawnStarterMaterialsAndContainers(): void {
    const mats: Array<{ id: string; item: Parameters<typeof createItemStack>[0]; x: number; z: number }> = [
      { id: "starter-fiber-01", item: "plant-fiber", x: -2.2, z: 6.4 },
      { id: "starter-fiber-02", item: "plant-fiber", x: -2.8, z: 6.9 },
      { id: "starter-stone-01", item: "stone", x: 2.4, z: 6.2 },
      { id: "starter-berries-01", item: "berries", x: -1.1, z: 7.2 },
      { id: "starter-cloth-01", item: "cloth", x: 0.8, z: 6.8 },
    ];
    for (const m of mats) {
      this.groundLoot.placeAuthoredStack(
        createItemStack(m.item, m.item === "berries" ? 3 : m.item === "plant-fiber" ? 5 : 2),
        Object.freeze({ x: m.x, y: 0, z: m.z }),
        m.id,
      );
    }
    // Supply loot matches the physical crate mesh at center of the house floor.
    const crate = new WorldContainerEntity(
      "home-supply-crate",
      "Supply Crate",
      Object.freeze({ x: HOME_HOUSE_ORIGIN.x, y: 0, z: HOME_HOUSE_ORIGIN.z }),
      8,
      [createItemStack("bandage", 2), createItemStack("water-bottle", 1), createItemStack("nails", 6)],
    );
    this.worldContainers.push(crate);
    this.world.addInteractable(crate);
  }

  private applyCalibration(): void {
    this.applyRenderResolution();
    this.player.applyCalibration();
    this.world.applyCalibration();
    this.restoreDynamicCombatCollisions();
    this.lighting.applyCalibration();
    this.postProcessing.applyCalibration();
    this.camera.applyProjection();
    this.debug.refreshObstacles();
  }

  /** Apply user Settings (I18N) to live systems — quality, audio, a11y side effects. */
  private applyUserSettingsRuntime(): void {
    const s = I18N.gameSettings;
    GAME_AUDIO.setMasterVolume(s.masterVolume);
    this.config.visual.qualityPreset = s.qualityPreset;
    this.applyRenderResolution();
    this.lighting.applyCalibration();
    this.postProcessing.applyCalibration();
    this.world.applyCalibration();
    this.camera.applyProjection();
  }

  private pulseCameraShake(magnitude: number): void {
    if (!I18N.gameSettings.screenShake || I18N.gameSettings.reducedMotion) return;
    this.camera.pulseShake(magnitude);
  }

  private applyRenderResolution(): void {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const preset = this.config.visual.qualityPreset;
    const maxDeviceRatio = ({ low: 1, medium: 1.5, high: 2.5, ultra: Number.POSITIVE_INFINITY } as const)[preset];
    const targetRatio = Math.min(dpr, maxDeviceRatio);
    const superSample = preset === "ultra" ? 0.85 : 1;
    this.engine.setHardwareScalingLevel((dpr / Math.max(targetRatio, 0.01)) * superSample);
    this.engine.resize();
  }

  private readonly onResize = (): void => {
    this.applyRenderResolution();
    this.camera.applyProjection();
  };

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
      this.combatPresentation.spawnDummy(dummy);
    });
  }

  private clearLocationEnemies(): void {
    this.enemies.clearAll();
    this.enemyPresentation.disposeAll();
  }

  private respawnLocationEnemies(locationId: LocationId): void {
    this.clearLocationEnemies();
    this.setHomeOnlyDummies(locationId === "home");
    const specs = enemySpawnSpecsFor(locationId);
    const total = specs.reduce((n, s) => n + s.count, 0);
    if (total === 0) return;
    const positions = spawnPositionsForLocation(total, locationId);
    let index = 0;
    for (const spec of specs) {
      for (let i = 0; i < spec.count; i += 1) {
        const position = positions[index] ?? { x: 8, y: 0, z: 8 };
        const id = `${spec.archetypeId}-${locationId}-${String(index + 1).padStart(2, "0")}`;
        const enemy = new RoamingZombie(id, position, spec.archetypeId);
        this.enemies.register(enemy);
        this.collision.addCircle(position.x, position.z, enemy.archetype.collisionRadius, this.enemyCollisionLabel(enemy));
        for (const mesh of this.enemyPresentation.spawn(enemy)) this.lighting.addCaster(mesh);
        index += 1;
      }
    }
  }

  /** Combat dummies / training screens live only at home — never on other maps. */
  private setHomeOnlyDummies(atHome: boolean): void {
    for (const dummy of this.combatDummies) {
      const id = `CombatTarget:${dummy.combatId}`;
      if (atHome) {
        // spawnCombatDummies already registers once; re-entry must be idempotent.
        if (!this.combatTargets.isRegistered(dummy)) this.combatTargets.register(dummy);
        this.collision.remove(id);
        if (dummy.isCombatAlive()) {
          const p = dummy.getCombatPosition();
          this.collision.addCircle(p.x, p.z, COMBAT_CONFIG.dummyCollisionRadius, id);
        }
      } else {
        this.combatTargets.unregister(dummy);
        this.collision.remove(id);
      }
    }
    this.combatPresentation.setDummiesVisible(atHome);
  }

  private restoreDynamicCombatCollisions(): void {
    if (this.locations.currentId === "home") {
      for (const dummy of this.combatDummies) {
        if (dummy.isCombatAlive()) {
          this.collision.addCircle(dummy.getCombatPosition().x, dummy.getCombatPosition().z, COMBAT_CONFIG.dummyCollisionRadius, `CombatTarget:${dummy.combatId}`);
        }
      }
    }
    for (const enemy of this.enemies.agents) {
      const position = enemy.getCombatPosition();
      this.collision.addCircle(position.x, position.z, enemy.archetype.collisionRadius, this.enemyCollisionLabel(enemy));
    }
  }

  private enemyCollisionLabel(enemy: RoamingZombie): string { return `Enemy:${enemy.combatId}`; }

  private enterPlayerDefeatedState(): void {
    if (this.deathHandled) return;
    this.deathHandled = true;
    this.stats.recordDeath();
    this.combat.cancelAttack();
    this.harvesting.cancel();
    this.player.stopMovement();
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.mapPanel.close();
    this.deathBags.captureAndStrip({
      x: this.player.position.x,
      z: this.player.position.z,
      inventory: this.inventory,
      equipment: this.equipment,
      weapon: this.weaponSlot,
      backpack: this.backpackSlot,
      quick: this.quickSlot,
      utility: this.utilitySlot,
    });
    // Drop bag as ground loot for first stack + leave rest lootable via deathBags.lootInto when interacting near bag marker
    const bag = this.deathBags.all[this.deathBags.all.length - 1];
    if (bag) {
      for (const stack of bag.stacks.slice(0, 3)) {
        this.groundLoot.placeAuthoredStack(
          createItemStack(stack.itemId, stack.quantity, stack.currentDurability !== undefined ? { currentDurability: stack.currentDurability } : undefined),
          Object.freeze({ x: bag.x + (Math.random() - 0.5) * 0.6, y: 0, z: bag.z + (Math.random() - 0.5) * 0.6 }),
          `${bag.id}:${stack.itemId}:${stack.quantity}`,
        );
      }
    }
    this.syncHeldWeaponVisual();
    this.syncQuickHud();
    this.applyGameplayPanelState(true);
    this.deathScreen.open({
      locationName: getLocation(this.locations.currentId).title,
      cause: this.lastDeathCause,
    });
    this.notify.push(I18N.t("notify.died"), "error");
  }

  private respawnPlayer(): void {
    this.player.health.restoreFull();
    this.hunger.set(SURVIVAL_CONFIG.hunger.initial * 0.6);
    this.thirst.set(SURVIVAL_CONFIG.thirst.initial * 0.6);
    this.player.visual.root.position.set(0, 0, 5);
    this.player.stopMovement();
    this.locations.forceSet("home");
    const theme = this.world.applyLocationVisual("home");
    this.lighting.applyLocationTheme(theme);
    this.nearFire = true;
    this.respawnLocationEnemies("home");
    this.deathHandled = false;
    this.sneak.setActive(false);
    this.hud.setSneakActive(false);
    this.applyGameplayPanelState(false);
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.syncHudNeeds();
    this.notify.push(I18N.t("notify.respawned"), "success");
  }

  private setInventoryOpen(open: boolean): void {
    if (open) {
      this.craftingPanel.close();
      this.mapPanel.close();
      this.localMap.close();
    }
    this.applyGameplayPanelState(
      open || this.craftingPanel.isOpen || this.fidelity.isOpen || this.hudLayoutEditor.isOpen || this.localMap.isOpen,
    );
  }

  private setCraftingOpen(open: boolean): void {
    if (open) {
      this.inventoryPanel.close();
      this.mapPanel.close();
      this.localMap.close();
    }
    this.applyGameplayPanelState(
      open || this.inventoryPanel.isOpen || this.fidelity.isOpen || this.hudLayoutEditor.isOpen || this.localMap.isOpen,
    );
  }

  private applyGameplayPanelState(open: boolean): void {
    // Map is playable — never count as "panel suppress" alone
    // Local location map freezes input while open
    const suppressed = open || this.player.health.dead || !this.gameStarted || this.pauseMenu.isOpen || this.mainMenu.isOpen;
    this.input.setSuppressed(suppressed);
    if (!suppressed) return;
    this.combat.cancelAttack();
    this.harvesting.cancel();
    this.player.stopMovement();
  }

  private syncHeldWeaponVisual(): void {
    const stack = this.weaponSlot.current;
    this.player.setHeldWeapon(stack ? toHeldWeaponVisualId(stack.itemId) : null);
  }

  private grantStarterInventory(): void {
    // 3-tier line ends at Expedition (+15). Field Carrier is an optional epic step beyond.
    const pack = createItemStack("expedition-backpack", 1);
    this.backpackSlot.equipIfAccepted(pack, () => true);
    this.inventory.setExtraSlotCount(backpackExtraSlots("expedition-backpack"));

    this.equipment.equipIfAccepted("head", createItemStack("composite-helmet", 1), () => true);
    this.equipment.equipIfAccepted("torso", createItemStack("composite-chest", 1), () => true);
    this.equipment.equipIfAccepted("legs", createItemStack("composite-legs", 1), () => true);
    this.equipment.equipIfAccepted("feet", createItemStack("composite-boots", 1), () => true);

    this.weaponSlot.equipIfAccepted(createItemStack("spear", 1), () => true);
    this.syncHeldWeaponVisual();

    const packs = [
      createItemStack("limestone", 20),
      createItemStack("pine-log", 20),
      createItemStack("hatchet", 1),
      createItemStack("pickaxe", 1),
      createItemStack("plant-fiber", 10),
      createItemStack("berries", 5),
      createItemStack("bandage", 2),
      createItemStack("scrap-metal", 4),
      createItemStack("nails", 8),
      createItemStack("stone", 6),
      createItemStack("water-bottle", 1),
      createItemStack("berry-seeds", 3),
      createItemStack("root-seeds", 2),
      createItemStack("trade-token", 5),
    ] as const;
    for (const stack of packs) {
      const result = this.inventory.tryInsert(stack);
      if (!result.accepted) this.mailbox.deliver(stack, this.inventory);
    }
    this.farming.ensurePlot("home-plot-1");
  }

  private buildSaveBlob(): SaveBlob {
    const equipment: SaveBlob["equipment"] = {};
    for (const slot of this.equipment.getSlots()) {
      equipment[slot.id] = slot.stack ? serializeStack(slot.stack) : null;
    }
    const inventory = this.inventory.getSlots()
      .filter((s) => s.stack)
      .map((s) => serializeInventorySlot(s.index, s.stack!));
    const pos = this.player.position;
    return Object.freeze({
      version: SAVE_VERSION,
      savedAt: Date.now(),
      locationId: this.locations.currentId,
      health: this.player.health.currentHealth,
      hunger: this.hunger.value,
      thirst: this.thirst.value,
      energy: this.energy.value,
      cold: this.cold.serialize(),
      xp: this.experience.snapshot(),
      skills: this.skills.serialize(),
      inventory: Object.freeze(inventory),
      inventoryExtraSlots: this.inventory.extraSlots,
      equipment: Object.freeze(equipment),
      weapon: this.weaponSlot.current ? serializeStack(this.weaponSlot.current) : null,
      backpack: this.backpackSlot.current ? serializeStack(this.backpackSlot.current) : null,
      quick: this.quickSlot.current ? serializeStack(this.quickSlot.current) : null,
      utility: this.utilitySlot.current ? serializeStack(this.utilitySlot.current) : null,
      bunkerAccess: this.locations.hasBunkerAccess,
      unlockedLocations: this.locations.unlockedIds,
      playtimeSec: Math.floor(this.totalPlaytimeSec),
      position: Object.freeze({ x: pos.x, y: pos.y, z: pos.z }),
      facingYaw: this.player.facingYaw,
      locations: this.locations.serialize(),
      quests: this.quests.serialize(),
      achievements: this.achievements.serialize(),
      farming: this.farming.serialize(),
      building: this.building.serialize(),
      power: this.powerGrid.serialize(),
      water: this.water.serialize(),
      mailbox: this.mailbox.serialize() as SaveBlob["mailbox"],
      worldClock: this.worldClock.serialize(),
      worldDayAccum: this.worldDayAccum,
      stats: this.stats.serialize(),
      journal: this.journal.serialize(),
      reputation: this.reputation.serialize(),
      npcs: this.npcs.serialize(),
      raids: this.raids.serialize(),
      contracts: this.contracts.serialize(),
    });
  }

  private applySave(blob: SaveBlob): void {
    this.clearInventoryCompletely();

    let extra = Math.max(0, Math.floor(blob.inventoryExtraSlots ?? 0));
    if (blob.backpack) {
      const pack = deserializeStack(blob.backpack);
      if (pack) {
        this.backpackSlot.equipIfAccepted(pack, () => true);
        extra = Math.max(extra, backpackExtraSlots(pack.itemId));
      }
    }
    this.inventory.setExtraSlotCount(extra);

    const indexed: { index: number; stack: NonNullable<ReturnType<typeof deserializeStack>> }[] = [];
    const ordered: NonNullable<ReturnType<typeof deserializeStack>>[] = [];
    for (const entry of blob.inventory ?? []) {
      const stack = deserializeStack(entry);
      if (!stack) continue;
      if ("index" in entry && typeof (entry as SerializedInventorySlot).index === "number") {
        indexed.push({ index: (entry as SerializedInventorySlot).index, stack });
      } else {
        ordered.push(stack);
      }
    }
    if (indexed.length > 0) {
      this.inventory.restoreSlots(indexed, extra);
    }
    for (const stack of ordered) {
      if (!this.inventory.tryInsert(stack).accepted) this.mailbox.deliver(stack, this.inventory);
    }

    if (blob.equipment) {
      for (const id of Object.keys(blob.equipment) as Array<keyof typeof blob.equipment>) {
        const data = blob.equipment[id];
        if (!data) continue;
        const stack = deserializeStack(data);
        if (stack) this.equipment.equipIfAccepted(id as "head" | "torso" | "legs" | "feet", stack, () => true);
      }
    }
    if (blob.weapon) {
      const stack = deserializeStack(blob.weapon);
      if (stack) this.weaponSlot.equipIfAccepted(stack, () => true);
    }
    if (blob.quick) {
      const stack = deserializeStack(blob.quick);
      if (stack) this.quickSlot.assignIfAccepted(stack, () => true);
    }
    if (blob.utility) {
      const stack = deserializeStack(blob.utility);
      if (stack) this.utilitySlot.equipIfAccepted(stack, () => true);
    }
    this.syncHeldWeaponVisual();

    this.player.health.setCurrent(blob.health);
    this.hunger.set(blob.hunger);
    this.thirst.set(blob.thirst);
    this.energy.set(blob.energy);
    if (typeof blob.cold === "number") this.cold.set(blob.cold);
    this.experience.load(blob.xp);
    this.skills.load(blob.skills ?? {});

    if (blob.locations) this.locations.load(blob.locations as Partial<ReturnType<LocationManager["serialize"]>>);
    this.locations.forceSet(blob.locationId);
    if (blob.bunkerAccess) this.locations.grantBunkerAccess();
    for (const id of blob.unlockedLocations ?? []) this.locations.unlock(id);

    if (blob.position) {
      this.player.visual.root.position.set(blob.position.x, blob.position.y, blob.position.z);
    }
    if (typeof blob.facingYaw === "number" && Number.isFinite(blob.facingYaw)) {
      this.player.visual.root.rotation.y = blob.facingYaw;
    }

    if (blob.quests) this.quests.load(blob.quests as { tracked?: string; progress?: Record<string, number>; completed?: string[] });
    if (blob.achievements) this.achievements.load(blob.achievements);
    if (blob.farming) this.farming.load(blob.farming as Parameters<FarmingSystem["load"]>[0]);
    if (blob.building) {
      this.building.load(blob.building as Parameters<BuildingRegistry["load"]>[0]);
      this.buildingPresentation.sync(this.building);
    }
    if (blob.power) this.powerGrid.load(blob.power as { storage?: number; devices?: import("../base/PowerGrid").PowerDevice[] });
    if (blob.water) this.water.load(blob.water as { dirty?: number; clean?: number; pump?: boolean; purifier?: boolean });
    if (blob.mailbox) this.mailbox.load(blob.mailbox);
    if (typeof blob.worldClock === "number") this.worldClock.load(blob.worldClock);
    if (typeof blob.worldDayAccum === "number") this.worldDayAccum = blob.worldDayAccum;
    if (blob.stats) this.stats.load(blob.stats);
    if (blob.journal) this.journal.load(blob.journal);
    if (blob.reputation) this.reputation.load(blob.reputation);
    if (blob.npcs) this.npcs.load(blob.npcs);
    if (blob.raids) this.raids.load(blob.raids as Parameters<RaidSystem["load"]>[0]);
    if (blob.contracts) this.contracts.load(blob.contracts as { active?: import("../contracts/ContractSystem").ContractDef[]; nextId?: number; lastRefreshDay?: number });

    const theme = this.world.applyLocationVisual(blob.locationId);
    this.lighting.applyLocationTheme(theme);
    this.nearFire = blob.locationId === "home" || theme.showCampfire;
    this.totalPlaytimeSec = blob.playtimeSec ?? 0;
    this.sessionPlaytimeSec = 0;
  }

  /**
   * Write current session to localStorage.
   * Periodic autosave no longer depends on a re-checked timer (previous bug skipped every tick).
   */
  private persistSave(notifyUser: boolean): void {
    if (!this.gameStarted) return;
    const ok = SAVE_SYSTEM.save(this.buildSaveBlob());
    if (notifyUser) this.notify.push(ok ? "Game saved" : "Save failed", ok ? "success" : "error");
  }

  private readonly onFunctionKey = (event: KeyboardEvent): void => {
    if (!this.gameStarted && event.code !== "F1" && event.code !== "F2") return;
    if (this.mainMenu.isOpen) return;
    // Don't steal letters/digits while typing in blueprint search / any text field.
    // Escape still handled below so panels can close (search clears its own Esc first via stopPropagation).
    if (isUiTextFocusTarget(event.target) && event.code !== "Escape") return;

    if (event.code === "Escape" && !event.repeat) {
      event.preventDefault();
      if (this.deathScreen.isOpen) return;
      if (this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.mapPanel.isOpen) {
        this.inventoryPanel.close();
        this.craftingPanel.close();
        this.mapPanel.close();
        return;
      }
      this.pauseMenu.toggle();
      this.applyGameplayPanelState(this.pauseMenu.isOpen);
      return;
    }

    if (event.metaKey || event.ctrlKey || event.altKey) return;

    if (this.player.health.dead && (event.code === "KeyI" || event.code === "KeyB" || event.code === "KeyM")) {
      event.preventDefault();
      return;
    }
    if (event.code === "KeyI" && !event.repeat) { event.preventDefault(); this.inventoryPanel.toggle(); return; }
    if (event.code === "KeyB" && !event.repeat) { event.preventDefault(); this.craftingPanel.toggle(); return; }
    if (event.code === "KeyM" && !event.repeat) {
      event.preventDefault();
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.toggle();
      return;
    }
    if (event.code === "KeyC" && !event.repeat) { event.preventDefault(); this.toggleSneak(); return; }
    if (event.code === "KeyG" && !event.repeat) { event.preventDefault(); this.toggleBuild(); return; }
    if (event.code === "KeyR" && !event.repeat && this.building.isBuildMode) {
      event.preventDefault();
      this.building.rotate();
      this.refreshBuildGhost();
      this.buildPanel.refresh(this.inventory);
      return;
    }
    if (event.code === "Escape" && this.building.isBuildMode) {
      event.preventDefault();
      this.setBuildMode(false);
      return;
    }
    if (event.code === "KeyT" && !event.repeat) {
      event.preventDefault();
      const reload = this.ranged?.tryReload();
      if (reload && !reload.accepted && reload.reason === "no-ammo") this.notify.push("No ammo", "warn");
      return;
    }
    if (event.code === "KeyK" && !event.repeat) {
      event.preventDefault();
      // Spend skill point into Vitality if available (production skill spend path).
      if (this.skills.tryPurchase("max-hp", this.experience)) {
        this.notify.push("Skill: Vitality +1", "success");
      } else this.notify.push("No skill points", "warn");
      return;
    }
    if (event.code === "Digit1" && !event.repeat) { event.preventDefault(); this.useQuickSlot(); return; }
    if (event.code === "KeyU" && !event.repeat) { event.preventDefault(); this.toggleUtilityTorch(); return; }
    if (event.code === "KeyK" && !event.repeat && event.shiftKey) {
      // debug grant bandage
      event.preventDefault();
      this.inventory.tryInsert(createItemStack("bandage", 1));
      this.notify.push("DEBUG +bandage", "info");
      return;
    }
    if (event.code === "F1") { event.preventDefault(); this.calibration.toggle(); }
    if (event.code === "F2") { event.preventDefault(); this.debug.toggle(); }
    if (event.code === "F3") {
      event.preventDefault();
      this.fidelity.toggle();
      this.applyGameplayPanelState(this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.fidelity.isOpen || this.hudLayoutEditor.isOpen);
    }
    if (event.code === "F4") {
      event.preventDefault();
      this.hudLayoutEditor.toggle();
    }
    if (event.code === "F5" && !event.repeat) {
      event.preventDefault();
      this.persistSave(true);
    }
    if (event.code === "F9" && !event.repeat && import.meta.env.DEV) {
      event.preventDefault();
      this.notify.push(formatContentSummary(), "info");
      if (debugSpawnItem(this.inventory, "bandage", 3)) this.notify.push("Dev: +3 bandage", "success");
    }
  };
}
