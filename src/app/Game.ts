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
import { PlayerNoiseSystem } from "../player/PlayerNoiseSystem";
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
import { BlueprintUnlockSystem, isBlueprintItemId } from "../crafting/BlueprintUnlocks";
import { CraftingPanel } from "../ui/CraftingPanel";
import { CombatTargetSystem } from "../combat/CombatTargetSystem";
import { MeleeCombatSystem } from "../combat/MeleeCombatSystem";
import { CombatDummy } from "../combat/CombatDummy";
import { CombatPresentation } from "../combat/CombatPresentation";
import { COMBAT_CONFIG } from "../combat/combatConfig";
import { EnemySystem } from "../enemies/EnemySystem";
import { RoamingZombie, combatRoleFor } from "../enemies/RoamingZombie";
import { EnemyPresentation } from "../enemies/EnemyPresentation";
import { PlayerDamageResolver } from "../combat/PlayerDamageResolver";
import { enemySpawnSpecsFor, spawnPositionsForLocation } from "../enemies/LocationEnemyPools";
import {
  nightAcquireMul,
  nightHearMul,
  withNightSpawnPressure,
} from "../enemies/NightGameplay";
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
import { DeathBagEntity } from "../death/DeathBagEntity";
import { LocationManager } from "../locations/LocationManager";
import type { LocationId } from "../locations/LocationRegistry";
import { effectiveColdExposure } from "../locations/LocationRegistry";
import { ZoneSessionTimer } from "../locations/ZoneSessionTimer";
import { ExperiencePool, SkillTree, type SkillId } from "../progression/ExperiencePool";
import { playerMaxHealthFromSkills, tryBuySkill } from "../progression/SkillRules";
import { SkillsPanel } from "../ui/SkillsPanel";
import { JournalPanel } from "../ui/JournalPanel";
import { AchievementsPanel } from "../ui/AchievementsPanel";
import { QuestsPanel } from "../ui/QuestsPanel";
import { journalCounts } from "../progression/JournalView";
import { nextActiveQuestId, trackedQuestRow } from "../quests/QuestView";
import { BuildingRegistry, BUILD_PIECES, type PlacedBuildPiece } from "../building/BuildingRegistry";
import { BuildingPresentation } from "../building/BuildingPresentation";
import { cursorGridFromPlayer, gridToWorld } from "../building/buildConfig";
import {
  builtChestContainerId,
  builtCraftInteractableId,
  builtDoorInteractableId,
  builtPowerInteractableId,
  builtStationInteractableId,
  CHEST_PIECE_CAPACITY,
  FARM_BASE_IRRIGATION,
  formatBaseUtilityHud,
  isBuiltDoorInteractionId,
  isBuiltPowerInteractionId,
  isChestPiece,
  isColdStoragePiece,
  isCraftBenchPiece,
  isDoorPiece,
  isStandalonePowerPiece,
  isStationPiece,
  isWaterInfrastructurePiece,
  pieceIdFromBuiltChestContainer,
  pieceInstanceFromBuiltDoor,
  pieceInstanceFromBuiltPower,
  POWER_PIECE_SPECS,
  powerDeviceIdForPiece,
  STATION_PIECE_TO_KIND,
} from "../building/BuiltPieceWiring";
import {
  SPOIL_RATE_CHEST,
  SPOIL_RATE_FRIDGE_OFF,
  SPOIL_RATE_FRIDGE_ON,
  SPOIL_RATE_PLAYER,
} from "../items/FoodSpoilage";
import { SpoilageSystem } from "../inventory/SpoilageSystem";
import {
  CRAFT_BENCH_RANGE,
  isCraftBenchInteractionId,
  maxCraftBenchTierNear,
} from "../crafting/CraftAccess";
import { craftTierFromInteractionId } from "../crafting/CraftBenchTiers";
import { BuildModePanel } from "../ui/BuildModePanel";
import { GlobalMapPanel } from "../ui/GlobalMapPanel";
import { LocalMapPanel } from "../ui/LocalMapPanel";
import { MainMenu } from "../ui/MainMenu";
import { PauseMenu } from "../ui/PauseMenu";
import { DeathScreen } from "../ui/DeathScreen";
import { FullLoader } from "../ui/Loaders";
import { confirmDialog } from "../ui/ConfirmDialog";
import { NotificationService } from "../notify/NotificationService";
import { SAVE_SYSTEM, SAVE_VERSION, serializeStack, serializeInventorySlot, deserializeStack, deserializeStacks, type SaveBlob, type SerializedInventorySlot, type SerializedContainer } from "../save/SaveSystem";
import { I18N } from "../i18n/I18n";
import { achievementTitle, locationTitle, itemName, questTitle } from "../i18n/contentApi";
import { GAME_AUDIO } from "../audio/GameAudio";
import { LanguageSelectScreen } from "../ui/LanguageSelectScreen";
import { CHARACTER_PROFILE } from "../player/CharacterProfile";
import { rollNamedLoot } from "../loot/LootTable";
import { createInteractable, type Interactable } from "../interaction/Interactable";
import { ContainerPanel } from "../ui/ContainerPanel";
import { WorldContainerEntity } from "../containers/WorldContainer";
import { HOME_HOUSE_ORIGIN } from "../world/TestLocation";
import { StatusEffectSystem } from "../status/StatusEffectSystem";
import { canInfectFromArchetype, infectionChanceFromHit } from "../status/InfectionRules";
import { QuestSystem, QUEST_DEFS } from "../quests/QuestSystem";
import { RangedCombatSystem } from "../combat/RangedCombat";
import { StationSystem } from "../workstations/StationSystem";
import { StationPanel } from "../workstations/StationPanel";
import type { WorkstationKind } from "../workstations/WorkstationQueue";
import { AchievementSystem, ACHIEVEMENT_DEFS, type AchievementId } from "../progression/Achievements";
import { WorldClock } from "../world/WorldClock";
import { resolveCriticalHit } from "../combat/CriticalHit";
import { ColdPool } from "../survival/ColdPool";
import { FarmingSystem } from "../farming/FarmingSystem";
import {
  decideFarmInteract,
  isFarmPlotInteractionId,
  plotIdFromInteractable,
} from "../farming/FarmAccess";
import { VehicleSystem } from "../vehicle/VehicleSystem";
import { VehiclePanel } from "../ui/VehiclePanel";
import { MailboxSystem } from "../rewards/MailboxSystem";
import { ContractPanel } from "../ui/ContractPanel";
import { firstExploreMatch, lootProfileForContract } from "../contracts/ContractRules";
import { ReputationSystem } from "../progression/ReputationSystem";
import { JournalSystem } from "../progression/JournalSystem";
import { NpcSystem, SURVIVOR_CAMP_NPCS } from "../npc/NpcSystem";
import {
  defaultDialogueNode,
  npcCampOffset,
  npcIdFromInteractable,
  npcInteractableId,
  npcsAtLocation,
} from "../npc/NpcHub";
import {
  COURIER_PACKAGE_ID,
  tryDeliverCourierPackage,
  tryGrantCourierPackage,
} from "../npc/CourierRun";
import {
  CARAVAN_DIALOGUE_ID,
  caravanDisplayName,
  caravanOffersFor,
  eventTraderNpcId,
  isBarterEventKind,
} from "../npc/EventCaravan";
import { NpcPanel } from "../ui/NpcPanel";
import { LockSystem } from "../world/LockSystem";
import {
  LOCKED_SITES,
  isLockSupportId,
  lockIdFromContainerId,
  lockSupportSite,
} from "../world/LockedSites";
import { BossBrain, WARDEN_PROFILE } from "../combat/BossBrain";
import { HordeController } from "../combat/HordeController";
import {
  HOME_GATE_DEFENSE,
  homeDefenseSpawnPoint,
  isHomeDefenseContractHint,
} from "../combat/HomeDefense";
import { WorldEventDirector, type WorldEventKind } from "../world/WorldEventDirector";
import { RaidSystem } from "../raids/RaidSystem";
import {
  raidAnchorLocation,
  raidReinforcementCount,
  unclearedRaidAt,
} from "../raids/RaidAnchors";
import { eventAnchorLocation, unclaimedEventAt } from "../world/EventAnchors";
import { PowerGrid } from "../base/PowerGrid";
import { WaterSystem } from "../base/WaterSystem";
import { composeRadioBriefing } from "../base/RadioIntel";
import { validateContentRegistries } from "../debug/ContentValidator";
import { formatContentSummary, debugSpawnItem } from "../debug/ContentBrowser";
import { loreNotesForLocation } from "../content/LoreNotes";
import { tierForLevel } from "../progression/ProgressionTiers";
import { GameStatistics } from "../progression/GameStatistics";
import { DungeonResetSystem, type DungeonId } from "../world/DungeonReset";
import {
  dungeonForLocation,
  formatDungeonResetNames,
  locksForDungeon,
  playerInsideResetDungeon,
} from "../world/DungeonAnchors";
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
  private readonly quickSlots = Object.freeze([new PlayerQuickSlot(), new PlayerQuickSlot()]) as readonly [PlayerQuickSlot, PlayerQuickSlot];
  private readonly quickSlotSystems: readonly [QuickSlotSystem, QuickSlotSystem];
  private readonly utilitySlot = new PlayerUtilitySlot();
  private readonly utilityEquipSystem: UtilityEquipSystem;
  private readonly hunger = new HungerPool(SURVIVAL_CONFIG.hunger.max, SURVIVAL_CONFIG.hunger.initial);
  private readonly thirst = new ThirstPool(SURVIVAL_CONFIG.thirst.max, SURVIVAL_CONFIG.thirst.initial);
  private readonly energy = new EnergyPool(SURVIVAL_CONFIG.energy.max, SURVIVAL_CONFIG.energy.initial);
  private readonly consumables: ConsumableUseSystem;
  private readonly deathBags = new DeathBagSystem();
  private readonly deathBagEntities: DeathBagEntity[] = [];
  private readonly zoneTimer = new ZoneSessionTimer();
  private zoneForceExitLatched = false;
  private readonly locations: LocationManager;
  private readonly experience = new ExperiencePool();
  private readonly skills = new SkillTree();
  private readonly building = new BuildingRegistry();
  private readonly buildingPresentation: BuildingPresentation;
  private readonly buildPanel: BuildModePanel;
  private readonly sneak = new SneakState();
  private readonly status = new StatusEffectSystem();
  private readonly quests = new QuestSystem();
  private readonly stations = new StationSystem();
  private readonly stationPanel: StationPanel;
  private readonly vehiclePanel: VehiclePanel;
  private readonly contractPanel: ContractPanel;
  private readonly npcPanel: NpcPanel;
  private readonly skillsPanel: SkillsPanel;
  private readonly journalPanel: JournalPanel;
  private readonly achievementsPanel: AchievementsPanel;
  private readonly questsPanel: QuestsPanel;
  private readonly containerPanel: ContainerPanel;
  private homeBoardInteractable: Interactable | null = null;
  private homeMailboxMounted = false;
  private readonly campNpcInteractables = new Map<string, Interactable>();
  private readonly eventTraderInteractables = new Map<string, Interactable>();
  private readonly eventCaravanNpcIds = new Set<string>();
  private readonly lockSupportInteractables = new Map<string, Interactable>();
  private readonly builtStationInteractables = new Map<string, Interactable>();
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
  private defenseSpawnSerial = 0;
  private homeDefenseRunning = false;
  private readonly warden = new BossBrain(WARDEN_PROFILE);
  private readonly worldEvents = new WorldEventDirector();
  private readonly raids = new RaidSystem();
  /** Active map-raid compound for the current location (null = normal pool). */
  private activeRaidSiteId: string | null = null;
  private readonly powerGrid = new PowerGrid();
  private readonly water = new WaterSystem();
  private readonly spoilage = new SpoilageSystem();
  private readonly stats = new GameStatistics();
  private spoilageNotifyCooldown = 0;
  private readonly dungeonResets = new DungeonResetSystem();
  private readonly contracts = new ContractSystem();
  private greyhavenVisits = 0;
  private worldDayAccum = 0;
  private nearFire = false;
  private ranged: RangedCombatSystem | null = null;
  private readonly blueprints = new BlueprintUnlockSystem();
  private readonly craftingSystem = new CraftingSystem(this.inventory, undefined, this.blueprints);
  private readonly combatTargets = new CombatTargetSystem();
  private readonly combatDummies: CombatDummy[] = [];
  private readonly equipmentVisual: EquipmentVisualController;
  private readonly combatPresentation: CombatPresentation;
  private readonly enemyPresentation: EnemyPresentation;
  private readonly playerDamage: PlayerDamageResolver;
  private readonly enemies: EnemySystem;
  private readonly playerNoise = new PlayerNoiseSystem();
  private lastMeleeImpactCount = 0;
  private wasThreatened = false;
  private wasNight = false;
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
  /** Blocks persist while inventory is wiped/restored so an empty mid-load snapshot cannot clobber a good save. */
  private saveHydrating = false;
  /** Last applied harvest snapshot — re-applied after each location visual so trees stay cut. */
  private loadedHarvestResources: readonly import("../harvesting/HarvestableResource").SerializedHarvestResource[] | null = null;
  private autosaveTimer = 0;
  private deferredSaveTimer = 0;
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
    this.consumables = new ConsumableUseSystem(
      this.inventory,
      this.player.health,
      this.hunger,
      this.thirst,
      this.quickSlots,
      this.status,
      this.cold,
    );
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
        onPlayerDamage: (enemy, damage) => {
          this.combatPresentation.showDamage(this.player.position, damage.finalDamage, 1.9);
          this.pulseCameraShake(0.45);
          GAME_AUDIO.playPlayerHit();
          this.lastDeathCause = "Infected attack";
          if (!damage.becameDefeated) this.applyCombatWound(damage.finalDamage, enemy.archetypeId);
          // Bashing near base walls also cracks them (home fort loop).
          if (this.locations.currentId === "home" && damage.finalDamage > 0) {
            const pos = enemy.getCombatPosition();
            this.damageNearbyStructure(pos.x, pos.z, Math.max(6, Math.round(damage.finalDamage * 1.4)));
          }
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
        this.combatPresentation.showImpact(target, finalReq, crit.isCrit);
        if (crit.isCrit) {
          this.stats.recordCriticalHit();
          GAME_AUDIO.playCrit();
          this.pulseCameraShake(0.22);
          if (this.stats.criticalHitCount >= 25) this.notifyAchievement("critical-master");
        }
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
    this.quickSlotSystems = Object.freeze([
      new QuickSlotSystem(this.inventory, this.quickSlots[0]),
      new QuickSlotSystem(this.inventory, this.quickSlots[1]),
    ]) as readonly [QuickSlotSystem, QuickSlotSystem];
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
      this.quickSlots,
      this.quickSlotSystems,
      this.hud.inventoryToggle,
      (open) => { this.setInventoryOpen(open); },
    );
    this.inventoryPanel.setItemActionHandlers({
      use: (slot, stack) => {
        if (isBlueprintItemId(stack.itemId)) {
          return this.tryLearnBlueprint(slot, stack);
        }
        const result = this.consumables.useFromInventory(slot, stack);
        if (result.accepted) {
          this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
          this.syncHudNeeds();
          this.feedbackConsumable(result);
        }
        return result.accepted;
      },
      quickAssign: (slot, stack) => {
        const empty = this.quickSlots.findIndex((q) => q.isEmpty);
        const index = (empty >= 0 ? empty : 0) as 0 | 1;
        return this.quickSlotSystems[index].assignFromInventory(slot, stack).accepted;
      },
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
    // weaponSlot subscribe registered below with autosave hook
    this.craftingPanel = new CraftingPanel(uiRoot, this.inventory, this.craftingSystem, this.hud.craftingToggle, (message) => {
      this.inventoryPanel.showStatus(message);
      // Only surface real problems as toasts (panel already confirms crafts).
      if (message.toLowerCase().includes("full") || message.toLowerCase().includes("need") || message.toLowerCase().includes("missing") || message.toLowerCase().includes("workbench") || message.toLowerCase().includes("верстак")) {
        this.notify.push(message, "warn");
      }
    }, (open) => { this.setCraftingOpen(open); }, (recipeId, outputItemId) => {
      this.onItemCrafted(recipeId, outputItemId);
    }, () => this.isNearCraftBench());
    this.stationPanel = new StationPanel(
      uiRoot,
      this.stations,
      (processId, station) => {
        const result = this.stations.tryStart(processId, station, this.inventory);
        if (result.accepted) {
          this.notify.push(I18N.t("notify.stationStarted"), "info");
          this.queueAutosaveSoon();
          this.stationPanel.refresh();
        }
        return { accepted: result.accepted, reason: result.reason };
      },
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.vehiclePanel.isOpen || this.contractPanel?.isOpen || this.npcPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.vehiclePanel = new VehiclePanel(
      uiRoot,
      this.vehicle,
      () => {
        this.onVehicleAssemblyChanged();
        this.queueAutosaveSoon();
        this.vehiclePanel.refresh();
      },
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen
            || this.contractPanel.isOpen || this.npcPanel?.isOpen,
        );
      },
    );
    this.containerPanel = new ContainerPanel(uiRoot, {
      onChanged: () => {
        this.containerPanel.refresh();
        this.queueAutosaveSoon();
      },
      onVisibility: (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.stationPanel.isOpen
            || this.vehiclePanel.isOpen || this.contractPanel.isOpen || this.npcPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    });
    this.contractPanel = new ContractPanel(
      uiRoot,
      this.contracts,
      (id) => {
        if (!this.contracts.accept(id)) return;
        this.notify.push(I18N.t("notify.contractAccepted"), "success");
        this.contractPanel.refresh();
        this.maybeStartHomeDefense();
        this.queueAutosaveSoon();
      },
      (id) => {
        this.claimContractReward(id);
      },
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.npcPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.npcPanel = new NpcPanel(
      uiRoot,
      this.npcs,
      (choiceId) => this.handleNpcChoice(choiceId),
      (offerId) => this.handleNpcTrade(offerId),
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.contractPanel.isOpen
            || this.skillsPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.skillsPanel = new SkillsPanel(
      uiRoot,
      this.skills,
      this.experience,
      (id) => this.purchaseSkill(id),
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.contractPanel.isOpen
            || this.npcPanel.isOpen || this.journalPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.journalPanel = new JournalPanel(
      uiRoot,
      this.journal,
      this.reputation,
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.contractPanel.isOpen
            || this.npcPanel.isOpen || this.skillsPanel.isOpen || this.achievementsPanel?.isOpen
            || this.questsPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.achievementsPanel = new AchievementsPanel(
      uiRoot,
      this.achievements,
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.contractPanel.isOpen
            || this.npcPanel.isOpen || this.skillsPanel.isOpen || this.journalPanel.isOpen
            || this.questsPanel?.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.questsPanel = new QuestsPanel(
      uiRoot,
      this.quests,
      () => this.syncQuestHud(),
      (open) => {
        this.applyGameplayPanelState(
          open || this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.containerPanel.isOpen
            || this.stationPanel.isOpen || this.vehiclePanel.isOpen || this.contractPanel.isOpen
            || this.npcPanel.isOpen || this.skillsPanel.isOpen || this.journalPanel.isOpen
            || this.achievementsPanel.isOpen
            || this.fidelity.isOpen || this.pauseMenu.isOpen || this.localMap.isOpen,
        );
      },
    );
    this.quests.subscribe(() => {
      this.syncQuestHud();
      if (this.questsPanel.isOpen) this.questsPanel.refresh();
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
      if (this.gameStarted) this.queueAutosaveSoon();
    });
    this.equipment.subscribe(() => { if (this.gameStarted) this.queueAutosaveSoon(); });
    this.backpackSlot.subscribe(() => { if (this.gameStarted) this.queueAutosaveSoon(); });
    this.weaponSlot.subscribe(() => {
      this.ranged?.onWeaponChanged();
      this.syncHeldWeaponVisual();
      if (this.gameStarted) this.queueAutosaveSoon();
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
        this.localMap.setLocationTitle(locationTitle(this.locations.currentId));
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
        locationName: locationTitle(this.locations.currentId),
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
    // Starter world loot — cleared/reseeded on New Game; replaced from save on Continue.
    this.seedWorldLootDefaults();
    this.pickup = new PickupSystem(this.groundLoot, this.interaction, this.inventory, this.pickupResults, this.inventoryPanel);
    this.harvestRewardDelivery = new HarvestRewardDelivery(this.inventory);
    const resourceResults = new CompositeResourceResultSink([this.harvestRewardDelivery, this.resultFeedback]);
    this.harvestTools = new InventoryHarvestTools(this.inventory, this.weaponSlot);
    this.harvesting = new HarvestingSystem(this.config, this.harvestTools, this.player, this.interaction, resourceResults, (resource) => {
      this.world.removeResourceCollision(resource.resourceId);
      this.loadedHarvestResources = this.world.serializeHarvestState();
      this.experience.addXp(3);
      this.stats.recordHarvest();
      this.notifyAchievement("first-harvest");
      if (resource.resourceKind === "pine-tree") this.completeQuest("collect-pine-logs");
      if (resource.resourceKind === "limestone-rock") this.completeQuest("collect-limestone");
      this.queueAutosaveSoon();
    }, () => {
      this.playerNoise.emitBurst("harvest");
    });
    this.backpackSlot.subscribe((_prev, stack) => {
      if (stack) {
        this.completeQuest("equip-backpack");
        this.notifyAchievement("backpacker");
      }
    });
    this.quickSlots[0].subscribe(() => { this.syncQuickHud(); });
    this.quickSlots[1].subscribe(() => { this.syncQuickHud(); });
    this.experience.subscribe((level) => {
      this.locations.unlockByLevel(level);
      this.syncHudNeeds();
      const tier = tierForLevel(level);
      if (level === tier.minLevel) this.notify.push(I18N.t("notify.progression", { title: tier.title }), "info");
    });
    this.powerGrid.ensureHomeDefaults();
    this.raids.generate(1001, 2);
    this.raids.generate(1002, 3);
    this.raids.generate(1003, 4);
    this.syncRaidLocationUnlocks();
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
        Object.freeze({
          id: "courier",
          label: "Courier run.",
          next: "jon-courier",
          startQuest: "deliver-package",
          grantItem: "quest-package" as const,
          grantReputation: 2,
        }),
        Object.freeze({ id: "leave", label: "Later.", end: true }),
      ]),
    }));
    this.npcs.registerDialogue(Object.freeze({
      id: "jon-accept",
      text: "Good. Return when you've stocked timber.",
      choices: Object.freeze([Object.freeze({ id: "ok", label: "Understood.", end: true })]),
    }));
    this.npcs.registerDialogue(Object.freeze({
      id: "jon-courier",
      text: "Sealed package for Mira. Don't open it — just hand it over.",
      choices: Object.freeze([Object.freeze({ id: "ok", label: "On it.", end: true })]),
    }));
    this.npcs.registerDialogue(Object.freeze({
      id: "mira-hello",
      text: "Trading today. Fiber for bandages, scrap for rounds.",
      choices: Object.freeze([
        Object.freeze({ id: "browse", label: "Show wares.", end: true }),
        Object.freeze({ id: "leave", label: "Later.", end: true }),
      ]),
    }));
    this.npcs.registerDialogue(Object.freeze({
      id: "mira-courier",
      text: "That sealed package — for me?",
      choices: Object.freeze([
        Object.freeze({
          id: "deliver",
          label: "Deliver it.",
          end: true,
          consumeItem: "quest-package" as const,
          completeQuest: "deliver-package",
          grantReputation: 8,
          grantTokens: 2,
        }),
        Object.freeze({ id: "browse", label: "Show wares first.", end: true }),
        Object.freeze({ id: "leave", label: "Not yet.", end: true }),
      ]),
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
    this.npcs.registerDialogue(Object.freeze({
      id: CARAVAN_DIALOGUE_ID,
      text: "Caravan's packing up soon. Browse while stock lasts.",
      choices: Object.freeze([
        Object.freeze({ id: "browse", label: "Show wares.", end: true }),
        Object.freeze({ id: "leave", label: "Maybe later.", end: true }),
      ]),
    }));
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
    I18N.onChange(() => {
      this.applyUserSettingsRuntime();
      // Keep the game save blob synced with UI scale / quality / volume prefs.
      this.queueAutosaveSoon();
    });
    CHARACTER_PROFILE.onChange(() => {
      this.queueAutosaveSoon();
    });
    this.applyUserSettingsRuntime();
  }

  async start(): Promise<void> {
    this.camera.update(0, this.player.position);
    await this.scene.whenReadyAsync();
    document.body.classList.add("game-ready");
    this.loop.start();
  }

  private beginPlay(mode: "new" | "continue"): void {
    this.saveHydrating = true;
    try {
      if (mode === "continue") {
        const blob = SAVE_SYSTEM.load();
        if (blob) this.applySave(blob);
        else {
          this.resetSessionForNewGame();
          this.grantStarterInventory();
          this.beginZoneVisitForCurrentLocation();
        }
      } else {
        this.resetSessionForNewGame();
        this.grantStarterInventory();
        this.beginZoneVisitForCurrentLocation();
      }
      this.gameStarted = true;
      // Dead save: keep death screen — do not re-strip (would wipe a restored loadout / already-empty corpse).
      if (this.player.health.dead) {
        this.deathHandled = true;
      } else {
        this.deathHandled = false;
      }
      this.locations.unlockByLevel(this.experience.currentLevel);
      // Visual/theme already applied inside applySave; re-apply so New Game and Continue agree.
      const theme = this.world.applyLocationVisual(this.locations.currentId);
      this.lighting.applyLocationTheme(theme);
      this.nearFire = this.locations.currentId === "home" || theme.showCampfire;
      // Layout re-enables meshes — re-apply harvest so cut trees stay cut.
      this.world.restoreHarvestState(this.loadedHarvestResources);
      this.respawnLocationEnemies(this.locations.currentId);
      this.camera.clearShake();
      this.camera.snapTo(this.player.position);
      this.equipmentVisual.resync();
      this.syncHeldWeaponVisual();
      this.mainMenu.close();
      this.pauseMenu.close();
      if (this.player.health.dead) {
        this.deathScreen.open({
          locationName: locationTitle(this.locations.currentId),
          cause: this.lastDeathCause,
        });
        this.applyGameplayPanelState(true);
      } else {
        this.deathScreen.close();
        this.input.setSuppressed(false);
        this.applyGameplayPanelState(false);
      }
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.localMap.close();
      // Commit immediately so Continue always has bag/armor/resources after New Game or load.
      this.deferredSaveTimer = 0;
      this.saveHydrating = false;
      this.persistSave(false);
      this.autosaveTimer = 0;
      this.syncQuickHud();
      this.syncHudNeeds();
      this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
      this.hud.setStatusEffects(this.status.ids());
      this.mainMenu.refresh();
      this.syncDeathBagWorldPresence();
      this.hud.setZoneTimer(this.zoneTimer.remaining);
    } catch (error) {
      console.error("[beginPlay]", error);
      this.saveHydrating = false;
      this.mainMenu.open();
      this.gameStarted = false;
      this.input.setSuppressed(true);
      this.notify.push(I18N.t("notify.startFailed"), "error");
    } finally {
      this.saveHydrating = false;
    }
  }

  /** Wipe session state so New Game isn't a soft continue on stale inventory/enemies. */
  private resetSessionForNewGame(): void {
    SAVE_SYSTEM.clear();
    this.clearInventoryCompletely();
    this.loadedHarvestResources = null;
    this.world.resetHarvestState();
    this.player.health.restoreFull();
    this.hunger.set(SURVIVAL_CONFIG.hunger.max);
    this.thirst.set(SURVIVAL_CONFIG.thirst.max);
    this.energy.set(SURVIVAL_CONFIG.energy.max);
    this.cold.set(0);
    this.player.visual.root.position.set(0, 0, 3);
    this.player.visual.root.rotation.y = 0;
    this.player.stopMovement();
    this.experience.load({ level: 1, xp: 0, skillPoints: 0 });
    this.skills.load({});
    this.syncSkillEffects();
    this.quests.load({});
    this.achievements.load([]);
    this.blueprints.load([]);
    this.syncQuestHud();
    this.farming.load([]);
    this.mailbox.load([]);
    this.reputation.load({});
    this.journal.load({});
    this.stats.load({
      playtimeSec: 0,
      deaths: 0,
      enemiesKilled: 0,
      bossesKilled: 0,
      resourcesHarvested: 0,
      itemsCrafted: 0,
      distanceTraveled: 0,
      locationsDiscovered: 0,
      raidsCleared: 0,
    });
    this.npcs.load({ tokens: 0 });
    this.raids.load([]);
    this.activeRaidSiteId = null;
    this.raids.generate(1001, 2);
    this.raids.generate(1002, 3);
    this.raids.generate(1003, 4);
    this.syncRaidLocationUnlocks();
    this.contracts.load(undefined);
    this.powerGrid.resetToDefaults();
    this.water.load(undefined);
    this.spoilage.clear();
    this.vehicle.load(undefined);
    this.dungeonResets.load(undefined);
    this.worldEvents.load([]);
    for (const id of [...this.eventCaravanNpcIds]) this.despawnEventCaravan(id);
    this.deathBags.clear();
    this.status.clear();
    this.stations.clear();
    this.stationPanel.close();
    this.vehiclePanel.close();
    this.contractPanel.close();
    this.npcPanel.close();
    this.skillsPanel.close();
    this.journalPanel.close();
    this.achievementsPanel.close();
    this.questsPanel.close();
    this.locks.load([
      { id: "motel-room-7", locked: true },
      { id: "factory-warehouse", locked: true, powered: false },
      { id: "bunker-armory", locked: true },
    ]);
    this.locations.load({
      current: "home",
      unlocked: [],
      discovered: [],
      visited: [],
      completed: [],
      bunkerAccess: false,
      security: 0,
      floors: ["bunker-echo"],
      vehicle: false,
      mode: "walk",
    });
    this.locations.forceSet("home");
    this.worldClock.load(0.32);
    this.wasNight = this.worldClock.isNight;
    this.sessionPlaytimeSec = 0;
    this.totalPlaytimeSec = 0;
    this.worldDayAccum = 0;
    this.greyhavenVisits = 0;
    this.deathHandled = false;
    this.sneak.setActive(false);
    this.hud.setSneakActive(false);
    this.zoneTimer.clear();
    this.hud.setZoneTimer(null);
    this.zoneForceExitLatched = false;
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.mapPanel.close();
    this.setBuildMode(false);
    this.camera.resetFraming();
    this.building.clear();
    this.buildingPresentation.sync(this.building);
    this.syncBaseUtilities();
    this.clearWorldLootAndContainers();
    this.seedWorldLootDefaults();
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
    const q0 = this.quickSlots[0].current;
    if (q0) this.quickSlots[0].clearIfAccepted(q0, () => true);
    const q1 = this.quickSlots[1].current;
    if (q1) this.quickSlots[1].clearIfAccepted(q1, () => true);
    const util = this.utilitySlot.current;
    if (util) this.utilitySlot.unequipIfAccepted(util, () => true);
    this.syncHeldWeaponVisual();
  }

  private getMainMenuSummary() {
    const blob = SAVE_SYSTEM.load();
    if (!blob) return { hasSave: false as const };
    return {
      hasSave: true as const,
      level: blob.xp?.level ?? 1,
      locationId: blob.locationId,
      locationName: locationTitle(blob.locationId),
      playtimeSec: blob.playtimeSec ?? 0,
      lastPlayedAt: blob.savedAt,
    };
  }

  private bindHudControls(): void {
    this.hud.quickSlotButton.addEventListener("click", () => { this.useQuickSlot(0); });
    this.hud.quickSlot2Button.addEventListener("click", () => { this.useQuickSlot(1); });
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
      this.localMap.setLocationTitle(locationTitle(this.locations.currentId));
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
    this.hud.setWorldClock(this.worldClock.hourLabel, this.worldClock.isNight);
    if (this.worldClock.isNight && !this.wasNight && this.player.health.alive) {
      this.notify.push(I18N.t("notify.nightfall"), "warn");
    }
    this.wasNight = this.worldClock.isNight;
    this.worldEvents.tick(this.worldDayAccum);
    this.syncEventCaravans();
    this.contracts.tick(this.worldDayAccum);
    const survivedDay = Math.floor(this.worldDayAccum);
    if (survivedDay >= 1) this.notifyAchievement("survive-day-1");
    if (survivedDay >= 10) this.notifyAchievement("survive-day-10");
    if (survivedDay >= 50) this.notifyAchievement("survive-day-50");
    const resets = this.dungeonResets.tick(this.worldDayAccum);
    if (resets.length > 0) {
      this.applyDungeonResets(resets);
    }
    this.powerGrid.tick(frameDelta, this.worldClock.sunIntensity());
    this.water.tick(frameDelta, this.powerGrid.net >= 0 || this.powerGrid.storage > 1);
    this.lighting.applyDayNight(this.worldClock.sunIntensity());
    this.syncLanternPresentation();
    this.syncBaseUtilityHud();
    if (frameDelta > 0 && this.player.health.alive) this.stats.tickPlaytime(frameDelta);
    this.quickSlots[0].tick(frameDelta);
    this.quickSlots[1].tick(frameDelta);
    this.tickSurvival(frameDelta);
    this.tickZoneVisit(frameDelta);
    this.autosaveTimer += frameDelta;
    if (this.deferredSaveTimer > 0) {
      this.deferredSaveTimer -= frameDelta;
      if (this.deferredSaveTimer <= 0) {
        this.deferredSaveTimer = 0;
        this.persistSave(false);
      }
    }
    if (this.autosaveTimer >= 12) {
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
    const speedMul = this.sneak.moveMul * (sprinting ? 2 : 1) * this.status.moveSpeedMultiplier();
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
      if (this.combat.impactCount > this.lastMeleeImpactCount) {
        this.lastMeleeImpactCount = this.combat.impactCount;
        this.playerNoise.emitBurst("melee");
      }
      if ((attackPressed || attackHeld) && this.combat.state === "ready") this.combat.requestAttack();
      this.tryLeaveLocationByEdge();
    }
    const locomoting = movement.length() > 0.08 && this.player.health.alive
      && !this.combat.movementCommitted && !this.harvesting.active;
    this.playerNoise.setLocomotion({
      moving: locomoting,
      sneaking: this.sneak.isSneaking,
      sprinting,
    });
    this.playerNoise.tick(frameDelta);
    this.combatTargets.update(this.player.position);
    this.enemies.update(frameDelta, {
      sneaking: this.sneak.isSneaking,
      sprinting,
      noiseRadius: this.playerNoise.hearRadius,
      noiseLevel: this.playerNoise.level,
      acquireRangeMul: nightAcquireMul(this.worldClock.isNight),
      hearRangeMul: nightHearMul(this.worldClock.isNight),
    });
    const threat = this.enemies.peakThreatLevel();
    const aggro = this.enemies.aggressiveCount();
    this.hud.setThreatLevel(threat, aggro);
    if (aggro > 0 && this.player.health.alive && !this.wasThreatened) {
      this.notify.push(I18N.t("notify.threatDetected"), "warn");
    }
    this.wasThreatened = aggro > 0;
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
            this.notify.push(I18N.t("notify.inventoryFull"), "warn");
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
              if (!this.tryAccessLockedContainer(selected)) {
                // Locked and missing key/power — stay closed.
              } else if (selected.accessMode === "storage") {
                this.inventoryPanel.close();
                this.craftingPanel.close();
                this.stationPanel.close();
                this.vehiclePanel.close();
                this.contractPanel.close();
                this.npcPanel.close();
                this.containerPanel.open(selected, this.inventory);
              } else {
                this.lootContainerPrompt(selected);
              }
            } else if (interactionAccepted && selected instanceof DeathBagEntity) {
              this.lootDeathBag(selected.bagId);
            } else if (interactionAccepted && selected?.interactionType === "station") {
              this.openStationForInteractable(selected.interactionId);
            } else if (interactionAccepted && selected?.interactionType === "npc") {
              this.openNpcForInteractable(selected.interactionId);
            } else if (interactionAccepted && selected?.interactionType === "door") {
              this.interactBuiltDoor(selected.interactionId);
            } else if (interactionAccepted && selected?.interactionType === "farm-plot") {
              this.interactFarmPlot(selected.interactionId);
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
        ...this.deathBags.bagsAt(this.locations.currentId).map((bag) => (
          Object.freeze({ kind: "death-bag" as const, x: bag.x, z: bag.z })
        )),
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
    } else if (target instanceof DeathBagEntity) {
      this.hud.setPrimaryActionContext("generic");
    } else if (target?.interactionType === "station") {
      if (isBuiltPowerInteractionId(target.interactionId)) {
        this.updatePowerHudContext(target.interactionId);
      } else {
        this.hud.setPrimaryActionContext("generic");
      }
    } else if (target?.interactionType === "npc") {
      this.hud.setPrimaryActionContext("generic");
    } else if (target?.interactionType === "door") {
      this.updateDoorHudContext(target.interactionId);
    } else if (target?.interactionType === "farm-plot") {
      this.updateFarmHudContext(target.interactionId);
    } else this.hud.setPrimaryActionContext(target ? "generic" : "none");
    this.camera.update(frameDelta, this.player.position);
    this.groundLoot.update(frameDelta);
    this.resultFeedback.update(frameDelta);
    this.combatPresentation.update(frameDelta, combatTarget);
    this.enemyPresentation.update(frameDelta, this.enemies.agents);
    if (this.stationPanel.isOpen) this.stationPanel.tick();
    if (this.inventoryPanel.isOpen) {
      this.inventoryPanel.updateLiveFrame({
        currentHealth: this.player.health.currentHealth,
        maxHealth: this.player.health.maxHealth,
        moveSpeed: this.config.player.movementSpeed
          * this.skills.moveSpeedMultiplier()
          * this.sneak.moveMul
          * this.status.moveSpeedMultiplier()
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
    this.stations.setFrozen(this.fidelity.motionFrozen);
    const stationDone = this.stations.tick(frameDelta);
    for (const done of stationDone) {
      this.deliverStationOutput(done.stack, done.processId);
    }
    this.worldClock.setFrozen(this.fidelity.motionFrozen);
    this.worldClock.tick(frameDelta);
    this.farming.tick(frameDelta);
    this.world.syncFarmBeds(this.farming.all);
    this.tickFoodSpoilage(frameDelta);
    this.tickHomeDefense(frameDelta);
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
    this.hud.setColdExposure(this.cold.ratio);
    const statusTick = this.status.tick(frameDelta);
    if (statusTick.healthDelta > 0) this.player.health.heal(statusTick.healthDelta);
    else if (statusTick.healthDelta < 0) {
      this.player.health.applyDamage(-statusTick.healthDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
    this.hud.setStatusEffects(statusTick.active);
    if (this.hunger.isEmpty) {
      this.player.health.applyDamage(SURVIVAL_CONFIG.hunger.starvationDamagePerSecond * frameDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
    if (this.thirst.isEmpty) {
      this.player.health.applyDamage(SURVIVAL_CONFIG.thirst.dehydrationDamagePerSecond * frameDelta);
      if (this.player.health.dead) this.enterPlayerDefeatedState();
    }
  }

  private tickFoodSpoilage(dt: number): void {
    if (dt <= 0 || !this.gameStarted || !this.player.health.alive) return;
    this.spoilageNotifyCooldown = Math.max(0, this.spoilageNotifyCooldown - dt);
    let spoiled = this.spoilage.tickPlayer(this.inventory, dt, SPOIL_RATE_PLAYER);
    for (const container of this.worldContainers) {
      if (container.accessMode !== "storage") continue;
      spoiled += this.spoilage.tickContainer(container, dt, this.spoilRateForContainer(container.interactionId));
    }
    if (spoiled > 0 && this.spoilageNotifyCooldown <= 0) {
      this.notify.push(I18N.t("notify.foodSpoiled"), "warn");
      this.spoilageNotifyCooldown = 12;
    }
  }

  private spoilRateForContainer(containerId: string): number {
    const instanceId = pieceIdFromBuiltChestContainer(containerId);
    if (!instanceId) return SPOIL_RATE_CHEST;
    const piece = this.building.all.find((p) => p.id === instanceId);
    if (!piece || !isColdStoragePiece(piece.pieceId)) return SPOIL_RATE_CHEST;
    const powered = this.powerGrid.isPowered(powerDeviceIdForPiece(instanceId));
    // Cold-box is always "enabled" as a consumer when placed (see syncBuildDevice defaults).
    return powered ? SPOIL_RATE_FRIDGE_ON : SPOIL_RATE_FRIDGE_OFF;
  }

  private tickZoneVisit(frameDelta: number): void {
    if (!this.gameStarted || this.player.health.dead || this.mapPanel.isOpen) {
      this.hud.setZoneTimer(this.zoneTimer.remaining);
      return;
    }
    if (this.fidelity.motionFrozen || frameDelta <= 0) {
      this.hud.setZoneTimer(this.zoneTimer.remaining);
      return;
    }
    const tick = this.zoneTimer.tick(frameDelta);
    this.hud.setZoneTimer(tick.remaining);
    if (tick.warn === "half") this.notify.push(I18N.t("notify.zoneTimeHalf"), "info");
    if (tick.warn === "minute") this.notify.push(I18N.t("notify.zoneTimeMinute"), "warn");
    if (tick.expired && !this.zoneForceExitLatched) {
      this.zoneForceExitLatched = true;
      this.forceExitZoneForTimer();
    }
  }

  /** LDOE-style: zone clock hits zero → kick to overworld (south edge transit). */
  private forceExitZoneForTimer(): void {
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.localMap.close();
    this.setBuildMode(false);
    this.combat.cancelAttack();
    this.harvesting.cancel();
    this.player.stopMovement();
    this.notify.push(I18N.t("notify.zoneTimeUp"), "error");
    // Snapshot harvest so returning later keeps progress; enemies respawn on re-enter.
    this.loadedHarvestResources = this.world.serializeHarvestState();
    this.persistSave(false);
    this.mapPanel.openFromEdge(this.locations.currentId, "s");
    this.zoneTimer.clear();
    this.hud.setZoneTimer(null);
  }

  private beginZoneVisitForCurrentLocation(): void {
    this.zoneForceExitLatched = false;
    this.zoneTimer.start(this.locations.currentDefinition);
    this.hud.setZoneTimer(this.zoneTimer.remaining);
  }

  private syncHudNeeds(): void {
    this.hud.setNeeds(this.hunger.ratio, this.thirst.ratio, this.energy.ratio);
    const xpRatio = this.experience.currentXp / Math.max(1, this.experience.xpToNextLevel);
    this.hud.setLevel(this.experience.currentLevel, xpRatio);
    this.syncQuestHud();
  }

  private syncQuestHud(): void {
    const row = trackedQuestRow(this.quests);
    if (!row) {
      this.hud.setQuestTracker(null);
      return;
    }
    this.hud.setQuestTracker({
      title: questTitle(row.id, row.title),
      progress: row.progress,
      target: row.target,
      completed: row.completed,
    });
  }

  private syncBaseUtilityHud(): void {
    if (this.locations.currentId !== "home" || !this.gameStarted) {
      this.hud.setBaseUtility(null);
      return;
    }
    const view = formatBaseUtilityHud({
      production: this.powerGrid.production,
      consumption: this.powerGrid.consumption,
      storage: this.powerGrid.storage,
      batteryCapacity: this.powerGrid.batteryCapacity,
      cleanWater: this.water.cleanWater,
      cleanCapacity: this.water.cleanCapacity,
      dirtyWater: this.water.dirtyWater,
      dirtyCapacity: this.water.dirtyCapacity,
      pumpOn: this.water.pumpOn,
      purifierOn: this.water.purifierOn,
      hasCollector: this.water.hasCollector,
    });
    this.hud.setBaseUtility(view);
  }

  /** Lit only when lantern is enabled AND the grid can actually supply it. */
  private syncLanternPresentation(): void {
    if (!this.gameStarted) return;
    const lit = new Map<string, boolean>();
    for (const piece of this.building.all) {
      if (piece.pieceId !== "lantern-post") continue;
      lit.set(piece.id, this.powerGrid.isPowered(powerDeviceIdForPiece(piece.id)));
    }
    this.buildingPresentation.syncLanternLights(lit);
  }

  private updatePowerHudContext(interactionId: string): void {
    const instanceId = pieceInstanceFromBuiltPower(interactionId);
    if (!instanceId) {
      this.hud.setPrimaryActionContext("generic");
      return;
    }
    const device = this.powerGrid.getDevice(powerDeviceIdForPiece(instanceId));
    if (!device) {
      this.hud.setPrimaryActionContext("generic");
      return;
    }
    let label = I18N.t("hud.interact");
    if (device.kind === "generator" || device.kind === "advanced-generator") {
      if (device.fueled !== true) label = I18N.t("hud.utilityFuel");
      else label = device.enabled ? I18N.t("hud.utilityOff") : I18N.t("hud.utilityOn");
    } else if (device.kind === "radio") {
      label = device.enabled ? I18N.t("hud.utilityOff") : I18N.t("hud.utilityOn");
    } else if (device.kind === "lamp" || device.kind === "floodlight") {
      label = device.enabled ? I18N.t("hud.utilityOff") : I18N.t("hud.utilityOn");
    } else {
      label = device.enabled ? I18N.t("hud.utilityOff") : I18N.t("hud.utilityOn");
    }
    this.hud.setFarmPlotActionContext(label, null);
  }

  private updateDoorHudContext(interactionId: string): void {
    const instanceId = pieceInstanceFromBuiltDoor(interactionId);
    if (!instanceId) {
      this.hud.setPrimaryActionContext("generic");
      return;
    }
    const open = this.building.isPassageOpen(instanceId);
    this.hud.setFarmPlotActionContext(
      open ? I18N.t("hud.doorClose") : I18N.t("hud.doorOpen"),
      null,
    );
  }

  private interactBuiltDoor(interactionId: string): void {
    if (!isBuiltDoorInteractionId(interactionId)) return;
    const instanceId = pieceInstanceFromBuiltDoor(interactionId);
    if (!instanceId) return;
    const next = this.building.togglePassage(instanceId);
    if (next === null) return;
    this.buildingPresentation.sync(this.building);
    this.notify.push(
      next ? I18N.t("notify.doorOpened") : I18N.t("notify.doorClosed"),
      "info",
    );
    this.queueAutosaveSoon();
  }

  private syncQuickHud(): void {
    const a = this.quickSlots[0].current;
    const b = this.quickSlots[1].current;
    this.hud.setQuickSlot(a?.itemId ?? null, a?.quantity ?? 0);
    this.hud.setQuickSlot2(b?.itemId ?? null, b?.quantity ?? 0);
  }

  private useQuickSlot(index: 0 | 1 = 0): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    const slot = this.quickSlots[index];
    const system = this.quickSlotSystems[index];
    // Empty by default — never auto-fill. Player must put items via inventory / drag.
    if (slot.current === null) {
      this.notify.push(I18N.t("notify.quickEmpty"), "warn");
      return;
    }
    if (!system.canUse()) {
      // Occupied by a non-consumable (storage only) — no activate action.
      this.notify.push(I18N.t("notify.cantUse"), "info");
      return;
    }
    const result = this.consumables.useFromQuickSlot(index);
    if (!result.accepted) {
      if (result.reason === "full-health") this.notify.push(I18N.t("notify.healthFull"), "info");
      else if (result.reason === "empty") this.notify.push(I18N.t("notify.quickEmpty"), "warn");
      else if (result.reason === "cooldown") this.notify.push(I18N.t("notify.cooldown"), "info");
      else this.notify.push(I18N.t("notify.cantUse"), "warn");
      return;
    }
    this.syncQuickHud();
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.syncHudNeeds();
    this.feedbackConsumable(result);
  }

  /** Equip first torch from pockets into utility slot (or unequip when KeyU). */
  private toggleUtilityTorch(): void {
    if (!this.gameStarted) return;
    if (this.utilitySlot.current) {
      const ok = this.utilityEquipSystem.unequipToInventory(this.utilitySlot.current);
      if (!ok) this.notify.push(I18N.t("notify.inventoryFull"), "warn");
      return;
    }
    for (let i = 0; i < this.inventory.slotCount; i += 1) {
      const stack = this.inventory.getSlot(i).stack;
      if (!stack || !PlayerUtilitySlot.isCompatible(stack.itemId)) continue;
      if (this.utilityEquipSystem.equipFromInventory(i, stack)) {
        return;
      }
    }
    this.notify.push(I18N.t("notify.noUtility"), "warn");
  }

  private toggleSneak(): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    this.sneak.toggle();
    this.hud.setSneakActive(this.sneak.isSneaking);
  }

  private toggleBuild(): void {
    if (!this.gameStarted || !this.player.health.alive) return;
    if (this.locations.currentId !== "home") {
      this.notify.push(I18N.t("notify.buildHomeOnly"), "warn");
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
        this.notify.push(I18N.t("notify.buildHomeOnly"), "warn");
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
      this.buildingPresentation.setGhost(true, cursor.gx, cursor.gz, this.building.currentRotation, hasAny, this.building.selected, "demolish");
      return;
    }
    if (this.building.isRepairMode) {
      const target = this.building.repairTargetAt(cursor.gx, cursor.gz);
      const needs = target ? target.hp < target.maxHp : false;
      this.buildingPresentation.setGhost(
        true,
        cursor.gx,
        cursor.gz,
        this.building.currentRotation,
        needs,
        target?.pieceId ?? this.building.selected,
        "repair",
      );
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
      "place",
    );
  }

  private damageNearbyStructure(worldX: number, worldZ: number, amount: number): void {
    const target = this.building.nearestStructure(worldX, worldZ, 4.2);
    if (!target) return;
    const result = this.building.damagePiece(target.id, amount);
    if (result.destroyed && result.piece) {
      this.unregisterBuiltPieceInteractable(result.piece);
      this.syncBaseUtilities();
      this.notify.push(I18N.t("notify.structureDestroyed"), "warn");
    } else if (result.piece) {
      // Throttle spammy “damaged” toasts via chance.
      if (Math.random() < 0.22) this.notify.push(I18N.t("notify.structureDamaged"), "warn");
    }
    this.buildingPresentation.sync(this.building);
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
        this.notify.push(I18N.t("notify.nothingToRemove"), "warn");
        return;
      }
      this.unregisterBuiltPieceInteractable(removed);
      this.syncBaseUtilities();
      this.buildingPresentation.sync(this.building);
      this.buildPanel.refresh(this.inventory);
      this.refreshBuildGhost();
      this.queueAutosaveSoon();
      return;
    }
    if (this.building.isRepairMode) {
      const result = this.building.tryRepairAt(this.inventory, cursor.gx, cursor.gz);
      if (!result.ok) {
        if (result.reason === "none") this.notify.push(I18N.t("notify.nothingToRepair"), "warn");
        else if (result.reason === "full") this.notify.push(I18N.t("notify.alreadyRepaired"), "info");
        else this.notify.push(I18N.t("notify.repairNeedMats"), "warn");
        return;
      }
      this.notify.push(I18N.t("notify.structureRepaired"), "success");
      this.buildingPresentation.sync(this.building);
      this.buildPanel.refresh(this.inventory);
      this.refreshBuildGhost();
      this.queueAutosaveSoon();
      return;
    }
    const result = this.building.placeWithCost(this.inventory, cursor.gx, cursor.gz);
    if (!result.piece) {
      this.notify.push(this.buildFailMessage(result.reason), "warn");
      return;
    }
    this.registerBuiltPieceInteractable(result.piece);
    this.syncBaseUtilities();
    this.buildingPresentation.sync(this.building);
    this.buildPanel.refresh(this.inventory);
    this.refreshBuildGhost();
    this.queueAutosaveSoon();
    this.notifyAchievement("builder");
    if (result.piece.pieceId === "floor-l1" || result.piece.layer === "floor") this.completeQuest("build-floor");
    if (result.piece.pieceId === "chest-small" || result.piece.pieceId.includes("chest")) this.completeQuest("build-chest");
    if (result.piece.layer === "structure") this.completeQuest("build-wall");
  }

  private registerBuiltPieceInteractable(piece: PlacedBuildPiece): void {
    // Process stations take priority over pure craft tables for interaction routing.
    if (isStationPiece(piece.pieceId)) {
      if (this.builtStationInteractables.has(piece.id)) return;
      const pos = gridToWorld(piece.gridX, piece.gridZ);
      const id = `${builtStationInteractableId(piece.id)}:${piece.pieceId}`;
      const tagged = createInteractable({
        id,
        type: "station",
        position: () => Object.freeze({ x: pos.x, y: 0, z: pos.z }),
        radius: () => 0.95,
        enabled: () => true,
      });
      this.builtStationInteractables.set(piece.id, tagged);
      this.world.addInteractable(tagged);
      return;
    }
    if (isCraftBenchPiece(piece.pieceId)) {
      if (this.builtStationInteractables.has(piece.id)) return;
      const pos = gridToWorld(piece.gridX, piece.gridZ);
      const id = builtCraftInteractableId(piece.id, piece.pieceId);
      const tagged = createInteractable({
        id,
        type: "station",
        position: () => Object.freeze({ x: pos.x, y: 0, z: pos.z }),
        radius: () => 0.95,
        enabled: () => true,
      });
      this.builtStationInteractables.set(piece.id, tagged);
      this.world.addInteractable(tagged);
      return;
    }
    if (isStandalonePowerPiece(piece.pieceId)) {
      if (this.builtStationInteractables.has(piece.id)) return;
      const pos = gridToWorld(piece.gridX, piece.gridZ);
      const id = builtPowerInteractableId(piece.id, piece.pieceId);
      const tagged = createInteractable({
        id,
        type: "station",
        position: () => Object.freeze({ x: pos.x, y: 0, z: pos.z }),
        radius: () => 0.95,
        enabled: () => true,
      });
      this.builtStationInteractables.set(piece.id, tagged);
      this.world.addInteractable(tagged);
      return;
    }
    if (isDoorPiece(piece.pieceId)) {
      if (this.builtStationInteractables.has(piece.id)) return;
      const pos = gridToWorld(piece.gridX, piece.gridZ);
      const id = builtDoorInteractableId(piece.id, piece.pieceId);
      const tagged = createInteractable({
        id,
        type: "door",
        position: () => Object.freeze({ x: pos.x, y: 0, z: pos.z }),
        radius: () => 1.05,
        enabled: () => true,
      });
      this.builtStationInteractables.set(piece.id, tagged);
      this.world.addInteractable(tagged);
      return;
    }
    if (!isChestPiece(piece.pieceId)) return;
    const capacity = CHEST_PIECE_CAPACITY[piece.pieceId] ?? 8;
    const id = builtChestContainerId(piece.id);
    if (this.worldContainers.some((c) => c.interactionId === id)) return;
    const title = BUILD_PIECES.find((p) => p.id === piece.pieceId)?.title ?? "Chest";
    const pos = gridToWorld(piece.gridX, piece.gridZ);
    const entity = new WorldContainerEntity(
      id,
      title,
      Object.freeze({ x: pos.x, y: 0, z: pos.z }),
      capacity,
      [],
      "storage",
    );
    this.worldContainers.push(entity);
    this.world.addInteractable(entity);
  }

  private unregisterBuiltPieceInteractable(piece: PlacedBuildPiece): void {
    const station = this.builtStationInteractables.get(piece.id);
    if (station) {
      this.world.removeInteractable(station);
      this.builtStationInteractables.delete(piece.id);
    }
    if (isChestPiece(piece.pieceId)) {
      const id = builtChestContainerId(piece.id);
      const index = this.worldContainers.findIndex((c) => c.interactionId === id);
      if (index < 0) return;
      const entity = this.worldContainers[index]!;
      // Dump remaining stacks into player inv / mailbox when chest is demolished.
      for (let i = 0; i < entity.inventory.slotCount; i += 1) {
        const stack = entity.inventory.take(i);
        if (!stack) continue;
        if (!this.inventory.tryInsert(stack).accepted) {
          this.mailbox.deliver(stack, this.inventory);
        }
      }
      this.world.removeInteractable(entity);
      this.worldContainers.splice(index, 1);
      if (this.containerPanel.currentContainerId === id) this.containerPanel.close();
    }
  }

  /** Rebuild station interactables from placed pieces; ensure chests exist for each chest piece. */
  private syncBuiltPieceInteractables(): void {
    for (const ix of this.builtStationInteractables.values()) {
      this.world.removeInteractable(ix);
    }
    this.builtStationInteractables.clear();
    for (const piece of this.building.all) {
      this.registerBuiltPieceInteractable(piece);
    }
    this.syncBaseUtilities();
  }

  /**
   * Link placed generators/lamps/furnace draws + water infrastructure to power/water systems.
   */
  private syncBaseUtilities(): void {
    const keep = new Set<string>();
    let hasWater = false;
    for (const piece of this.building.all) {
      if (isWaterInfrastructurePiece(piece.pieceId)) hasWater = true;
      const spec = POWER_PIECE_SPECS[piece.pieceId];
      if (!spec) continue;
      const id = powerDeviceIdForPiece(piece.id);
      keep.add(id);
      this.powerGrid.syncBuildDevice({
        id,
        kind: spec.kind,
        label: spec.label,
        production: spec.production,
        consumption: spec.consumption,
        priority: spec.priority,
        enabled: !spec.needsFuel,
        fueled: spec.needsFuel ? false : undefined,
      });
    }
    this.powerGrid.pruneBuildDevicesExcept(keep);
    this.water.setCollector(hasWater);
    this.water.setPump(hasWater);
    this.water.setPurifier(hasWater);
  }

  private interactPowerUtility(interactionId: string): void {
    if (!isBuiltPowerInteractionId(interactionId)) return;
    const instanceId = pieceInstanceFromBuiltPower(interactionId);
    if (!instanceId) return;
    const deviceId = powerDeviceIdForPiece(instanceId);
    const device = this.powerGrid.getDevice(deviceId);
    if (!device) {
      this.syncBaseUtilities();
    }
    const live = this.powerGrid.getDevice(deviceId);
    if (!live) return;

    let fuelConsumed = false;
    if (
      (live.kind === "generator" || live.kind === "advanced-generator")
      && live.fueled !== true
    ) {
      if (!this.tryConsumeInventoryItem("charcoal")) {
        this.notify.push(I18N.t("notify.genNeedFuel"), "warn");
        return;
      }
      fuelConsumed = true;
    }

    const result = this.powerGrid.tryInteractDevice(deviceId, fuelConsumed);
    if (!result.ok) {
      if (result.message === "need-fuel") this.notify.push(I18N.t("notify.genNeedFuel"), "warn");
      return;
    }
    switch (result.message) {
      case "fueled":
        this.notify.push(I18N.t("notify.genFueled"), "success");
        break;
      case "on": {
        if (live.kind === "radio") {
          if (!this.powerGrid.isPowered(deviceId)) {
            this.notify.push(I18N.t("notify.radioNoPower"), "warn");
          } else {
            this.notify.push(I18N.t("notify.radioOn"), "info");
            this.pushRadioBriefing();
          }
          break;
        }
        const isLamp = live.kind === "lamp" || live.kind === "floodlight";
        if (isLamp && !this.powerGrid.isPowered(deviceId)) {
          this.notify.push(I18N.t("notify.lampNoPower"), "warn");
        } else {
          this.notify.push(isLamp ? I18N.t("notify.lampOn") : I18N.t("notify.genOn"), "info");
        }
        break;
      }
      case "off":
        if (live.kind === "radio") {
          this.notify.push(I18N.t("notify.radioOff"), "info");
          break;
        }
        this.notify.push(
          live.kind === "lamp" || live.kind === "floodlight"
            ? I18N.t("notify.lampOff")
            : I18N.t("notify.genOff"),
          "info",
        );
        break;
      default:
        break;
    }
    this.syncLanternPresentation();
    this.queueAutosaveSoon();
  }

  /** Home radio scan: list open world events + uncleared raid compounds. */
  private pushRadioBriefing(): void {
    const briefing = composeRadioBriefing(
      this.worldEvents.events.map((e) => ({
        title: e.title,
        danger: e.danger,
        claimed: e.claimed,
        locationTitle: locationTitle(eventAnchorLocation(e)),
      })),
      this.raids.list().map((r) => ({
        title: r.title,
        threat: r.threat,
        cleared: r.cleared,
      })),
    );
    if (briefing.empty) {
      this.notify.push(I18N.t("notify.radioScanClear"), "info");
      return;
    }
    this.notify.push(I18N.t("notify.radioScan"), "info");
    for (const line of briefing.lines) {
      if (line.kind === "event") {
        this.notify.push(
          line.where
            ? I18N.t("notify.radioEventAt", { title: line.title, danger: line.level, where: line.where })
            : I18N.t("notify.radioEvent", { title: line.title, danger: line.level }),
          line.level >= 4 ? "warn" : "info",
        );
      } else {
        this.notify.push(
          I18N.t("notify.radioRaid", { title: line.title, threat: line.level }),
          "warn",
        );
      }
    }
  }

  private tryLearnBlueprint(slotIndex: number, expected: import("../items/ItemSystem").ItemStack): boolean {
    const stack = this.inventory.getSlot(slotIndex).stack;
    if (!stack || stack !== expected) return false;
    if (!isBlueprintItemId(stack.itemId)) return false;
    if (this.blueprints.has(stack.itemId)) {
      this.notify.push(I18N.t("notify.blueprintKnown", {
        name: itemName(ITEM_REGISTRY.get(stack.itemId)),
      }), "warn");
      return false;
    }
    if (!this.blueprints.tryLearn(stack.itemId)) return false;
    if (stack.quantity <= 1) this.inventory.exchangeWholeStack(slotIndex, stack, null);
    else this.inventory.exchangeWholeStack(slotIndex, stack, createItemStack(stack.itemId, stack.quantity - 1));
    this.notify.push(I18N.t("notify.blueprintLearned", {
      name: itemName(ITEM_REGISTRY.get(stack.itemId)),
    }), "success");
    if (this.craftingPanel.isOpen) this.craftingPanel.refresh();
    this.queueAutosaveSoon();
    return true;
  }

  private tryConsumeInventoryItem(itemId: import("../items/ItemId").ItemId): boolean {
    const slot = this.inventory.findFirstSlotByItemId(itemId);
    if (slot === null) return false;
    const stack = this.inventory.getSlot(slot).stack;
    if (!stack) return false;
    if (stack.quantity <= 1) this.inventory.exchangeWholeStack(slot, stack, null);
    else this.inventory.exchangeWholeStack(slot, stack, createItemStack(itemId, stack.quantity - 1));
    return true;
  }

  private onItemCrafted(recipeId: string, outputItemId: string): void {
    this.stats.recordCraft();
    this.journal.discoverItem(outputItemId as import("../items/ItemId").ItemId);
    this.queueAutosaveSoon();
    this.notifyAchievement("first-craft");
    const crafted = this.stats.snapshot().itemsCrafted;
    if (crafted >= 25) this.notifyAchievement("master-crafter");
    if (crafted >= 100) this.notifyAchievement("craft-100");

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
      this.notifyAchievement("first-cook");
    }
    if (outputItemId === "iron-bar") this.completeQuest("smelt-iron");
    if (outputItemId === "crowbar" || outputItemId === "machete" || outputItemId === "cleaver" || outputItemId === "pipe-club") {
      this.completeQuest("craft-iron-weapon");
    }
    if (outputItemId.startsWith("leather-")) this.completeQuest("craft-leather-armor");
    if (outputItemId === "first-aid-kit") this.completeQuest("craft-first-aid");
    if (outputItemId === "steel-hatchet" || outputItemId === "steel-pickaxe") {
      this.completeQuest("craft-steel-tool");
      this.notifyAchievement("steel-worker");
    }
    if (outputItemId === "clean-water" || outputItemId === "purified-water") {
      this.completeQuest("purify-water");
      this.notifyAchievement("first-purify");
    }
    if (outputItemId === "reinforced-backpack") this.completeQuest("craft-backpack-reinforced");
    if (outputItemId === "advanced-medical-kit") this.completeQuest("craft-advanced-med");
    if (outputItemId.includes("composite") || outputItemId === "composite-axe" || outputItemId === "composite-fiber") {
      this.notifyAchievement("composite-crafter");
    }
    void recipeId;
  }

  private completeQuest(id: Parameters<QuestSystem["advance"]>[0]): void {
    const result = this.quests.advance(id);
    if (result.completedNow) {
      this.experience.addXp(result.rewardXp);
      this.notify.push(I18N.t("notify.questComplete", { xp: result.rewardXp }), "success");
      if (this.quests.trackedId === id) {
        this.quests.setTracked(nextActiveQuestId(this.quests));
      }
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

  /** Assembly complete / load → unlock overworld vehicle travel mode. */
  private syncVehicleTravelUnlock(): void {
    if (this.vehicle.hasAnyVehicle) this.locations.unlockVehicle();
  }

  private onVehicleAssemblyChanged(): void {
    const already = this.locations.hasVehicle;
    this.syncVehicleTravelUnlock();
    if (!already && this.vehicle.hasAnyVehicle) {
      this.notify.push(I18N.t("notify.vehicleAssembled"), "success");
    }
  }

  private enterLocationFromMap(id: LocationId): void {
    if (this.locations.mode === "vehicle") {
      if (!this.vehicle.hasAnyVehicle) {
        this.notify.push(I18N.t("notify.noVehicle"), "warn");
        return;
      }
      if (!this.vehicle.tryTravelConsume(1)) {
        this.notify.push(I18N.t("notify.noFuel"), "warn");
        return;
      }
      this.locations.unlockVehicle();
    }
    const result = this.locations.enterFromMap(id);
    if (!result.accepted) {
      this.notify.push(this.travelReasonMessage(result.reason) || I18N.t("notify.cantEnter"), "warn");
      return;
    }
    this.afterTravelArrive(id);
  }

  private afterTravelArrive(id: LocationId): void {
    void this.fullLoader.run(I18N.t("loader.arriving", { name: locationTitle(id) }), () => {
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
    // Keep in-memory harvest progress (layout respects depleted flags).
    this.loadedHarvestResources = this.world.serializeHarvestState();
    this.camera.snapTo(this.player.position);
    this.journal.discoverLocation(id);
    this.stats.recordTravel(1);
    this.stats.recordLocationDiscovered();
    for (const note of loreNotesForLocation(id)) {
      if (!this.journal.hasNote(note.id)) {
        this.journal.addNote(note.id, `${note.title}: ${note.text}`);
        this.notify.push(I18N.t("notify.journal", { title: note.title }), "info");
        if (journalCounts(this.journal).notes >= 5) this.notifyAchievement("journal-archivist");
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
    if (id !== "home") this.notifyAchievement("explorer");
    if (id === "old-highway") this.notifyAchievement("road-explorer");
    if (id === "survivor-camp") {
      this.reputation.add("frontier-survivors", 2);
      this.maybeUnlockFactionAlly();
      this.notify.push(I18N.t("notify.campHub"), "info");
    }
    if (id === "ironbound-fort") {
      this.reputation.add("ironbound-collective", 3);
      this.maybeUnlockFactionAlly();
    }
    if (id === "wayfarer-post") {
      this.reputation.add("wayfarer-network", 3);
      this.maybeUnlockFactionAlly();
    }
    if (id.startsWith("greyhaven") || id.startsWith("metro") || id === "city-sewers") {
      this.greyhavenVisits += 1;
      this.notifyAchievement("city-walker");
      if (this.greyhavenVisits >= 3) this.notifyAchievement("greyhaven-scout");
    }
    if (id === "metro-central") this.notifyAchievement("metro-linked");
    if (id === "exclusion-wastes" || id === "exclusion-safehouse") {
      this.notifyAchievement("exclusion-walker");
    }
    if (id === "helix-core") this.notifyAchievement("helix-ascendant");
    if (id === "bunker-echo") this.notifyAchievement("bunker-survivor");
    if (id === "bunker-echo-f3" || id === "bunker-echo-f4" || id === "bunker-echo-f5") {
      this.notifyAchievement("bunker-raider");
    }
    if (id === "bunker-echo-f3") {
      this.warden.reset();
      this.warden.acquire();
      this.notify.push(I18N.t("notify.bossStirs", { name: this.warden.profile.displayName }), "warn");
    }
    const openRaid = unclearedRaidAt(this.raids.list(), id);
    if (openRaid) {
      this.notify.push(I18N.t("notify.raidObjective", { title: openRaid.title }), "warn");
    }
    const exploreHit = firstExploreMatch(this.contracts.activeContracts, id);
    if (exploreHit) {
      const done = this.contracts.complete(exploreHit.id);
      if (done) {
        this.notify.push(I18N.t("notify.contractReady", { title: done.title }), "success");
      }
    }
    const siteEvent = unclaimedEventAt(this.worldEvents.events, id);
    if (siteEvent) {
      this.notify.push(
        I18N.t("notify.worldEventAt", { title: siteEvent.title, where: locationTitle(id) }),
        siteEvent.danger >= 4 ? "warn" : "info",
      );
      const claim = this.worldEvents.claim(siteEvent.id);
      if (claim.accepted) {
        if (isBarterEventKind(siteEvent.kind)) {
          this.spawnEventCaravan(siteEvent);
          this.completeQuest("claim-world-event");
          this.notifyAchievement("world-event-hunter");
          this.notify.push(I18N.t("notify.caravanOpen", { title: siteEvent.title }), "success");
          const traderId = eventTraderNpcId(siteEvent.id);
          this.npcPanel.open(traderId, this.inventory, "trade");
        } else {
          const reward = rollNamedLoot(claim.lootProfile, claim.seed * 9973);
          for (const stack of reward) {
            if (!this.inventory.tryInsert(stack).accepted) this.mailbox.deliver(stack, this.inventory);
          }
          this.completeQuest("claim-world-event");
          this.notifyAchievement("world-event-hunter");
          this.notify.push(I18N.t("notify.claimedEvent", { title: siteEvent.title }), "success");
        }
      }
    }
    this.persistSave(false);
    this.respawnLocationEnemies(id);
    this.syncDeathBagWorldPresence();
    this.syncHomeServiceInteractables();
    this.ensureCampNpcInteractables();
    this.syncEventCaravans();
    this.ensureLockedSitePresence();
    if (id !== "home") this.stopHomeDefenseEncounter();
    else this.maybeStartHomeDefense();
    this.beginZoneVisitForCurrentLocation();
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
    if (moved <= 0) this.notify.push(I18N.t("notify.cannotLoot"), "warn");
  }

  private lootDeathBag(bagId: string): void {
    const result = this.deathBags.lootInto(bagId, this.inventory);
    if (result.inserted <= 0 && result.remaining > 0) {
      this.notify.push(I18N.t("notify.inventoryFull"), "warn");
      return;
    }
    if (result.gone) {
      this.notify.push(I18N.t("notify.lootDeathBag"), "success");
    } else {
      this.notify.push(I18N.t("notify.lootDeathBagPartial"), "warn");
    }
    this.syncDeathBagWorldPresence();
    this.syncHeldWeaponVisual();
    this.equipmentVisual.resync();
    this.queueAutosaveSoon();
  }

  private openStationForInteractable(interactionId: string): void {
    if (isBuiltPowerInteractionId(interactionId)) {
      this.interactPowerUtility(interactionId);
      return;
    }
    if (isLockSupportId(interactionId)) {
      this.interactLockSupport(interactionId);
      return;
    }
    if (interactionId === "home-contract-board" || interactionId.includes("contract-board")) {
      this.inventoryPanel.close();
      this.stationPanel.close();
      this.containerPanel.close();
      this.craftingPanel.close();
      this.vehiclePanel.close();
      this.npcPanel.close();
      this.mapPanel.close();
      this.localMap.close();
      this.contracts.ensureBoard(this.worldDayAccum);
      this.contractPanel.open();
      return;
    }
    // Assembly bench → vehicle bay (blueprints still via B near any craft table).
    if (interactionId.includes("assembly-bench")) {
      this.inventoryPanel.close();
      this.stationPanel.close();
      this.containerPanel.close();
      this.craftingPanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.mapPanel.close();
      this.localMap.close();
      this.vehiclePanel.open(this.inventory);
      return;
    }
    if (isCraftBenchInteractionId(interactionId) && !interactionId.includes("metalwork")) {
      this.inventoryPanel.close();
      this.stationPanel.close();
      this.containerPanel.close();
      this.vehiclePanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.mapPanel.close();
      this.localMap.close();
      this.syncCraftBenchTier();
      this.craftingPanel.open();
      return;
    }
    let kind: WorkstationKind | null = null;
    // Built pieces encode catalog id after colon: built-station-build-3:furnace
    const taggedPiece = interactionId.includes(":")
      ? interactionId.slice(interactionId.lastIndexOf(":") + 1)
      : null;
    if (taggedPiece && taggedPiece in STATION_PIECE_TO_KIND) {
      kind = STATION_PIECE_TO_KIND[taggedPiece]!;
    } else if (interactionId.startsWith("campfire") || interactionId.includes("campfire")) {
      kind = "campfire";
    } else if (interactionId.startsWith("chopping") || interactionId.includes("woodwork")) {
      kind = "woodworking";
    } else if (interactionId.startsWith("furnace") || interactionId.includes("furnace")) {
      kind = "furnace";
    } else if (interactionId.includes("metalwork")) {
      kind = "metalwork";
    } else if (interactionId.includes("chemistry")) {
      kind = "chemistry";
    } else if (interactionId.includes("water-collector") || interactionId.includes("water")) {
      // Prefer explicit collector piece; avoid matching random ids with "water" alone if none tagged.
      if (interactionId.includes("water-collector") || interactionId.includes(":water")) {
        kind = "water";
      }
    }
    if (!kind && (interactionId.includes("composter") || interactionId.includes(":composter"))) {
      kind = "composter";
    }
    if (!kind && (interactionId.includes("recycler") || interactionId.includes(":recycler"))) {
      kind = "recycler";
    }
    if (!kind) return;
    // Furnace catalog piece must exist when opening smelt via non-furnace surfaces,
    // but standing at a built furnace always works.
    if (kind === "furnace" && !interactionId.includes("furnace") && !this.hasBuiltStation("furnace")) {
      this.notify.push(I18N.t("notify.stationNeedBuild"), "warn");
      return;
    }
    if (kind === "metalwork" && !interactionId.includes("metalwork") && !this.hasBuiltStation("metalwork-bench")) {
      this.notify.push(I18N.t("notify.stationNeedMetalwork"), "warn");
      return;
    }
    if (kind === "chemistry" && !interactionId.includes("chemistry") && !this.hasBuiltStation("chemistry-station")) {
      this.notify.push(I18N.t("notify.stationNeedChemistry"), "warn");
      return;
    }
    if (kind === "water" && !interactionId.includes("water") && !this.hasBuiltStation("water-collector")) {
      this.notify.push(I18N.t("notify.stationNeedWater"), "warn");
      return;
    }
    if (kind === "composter" && !interactionId.includes("composter") && !this.hasBuiltStation("composter")) {
      this.notify.push(I18N.t("notify.stationNeedComposter"), "warn");
      return;
    }
    if (kind === "recycler" && !interactionId.includes("recycler") && !this.hasBuiltStation("recycler")) {
      this.notify.push(I18N.t("notify.stationNeedRecycler"), "warn");
      return;
    }
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.containerPanel.close();
    this.vehiclePanel.close();
    this.contractPanel.close();
    this.npcPanel.close();
    this.mapPanel.close();
    this.localMap.close();
    this.stationPanel.open(kind, this.inventory, {
      furnaceUnlocked: this.hasBuiltStation("furnace") || kind === "furnace",
      metalworkUnlocked: this.hasBuiltStation("metalwork-bench") || kind === "metalwork",
      chemistryUnlocked: this.hasBuiltStation("chemistry-station") || kind === "chemistry",
      waterUnlocked: this.hasBuiltStation("water-collector") || kind === "water",
      composterUnlocked: this.hasBuiltStation("composter") || kind === "composter",
      recyclerUnlocked: this.hasBuiltStation("recycler") || kind === "recycler",
    });
  }

  /** Stand next to home workbench or a built assembly/metal table. */
  private isNearCraftBench(): boolean {
    const tier = this.getMaxNearCraftTier();
    if (tier < 0) return false;
    this.craftingSystem.setActiveBenchTier(tier);
    return true;
  }

  private getMaxNearCraftTier(): number {
    const benches: { x: number; z: number; enabled: boolean; tier: number }[] = [];
    for (const ix of this.world.interactables) {
      if (!isCraftBenchInteractionId(ix.interactionId)) continue;
      if (!ix.isInteractionEnabled()) continue;
      const p = ix.getInteractionPosition();
      benches.push({
        x: p.x,
        z: p.z,
        enabled: true,
        tier: craftTierFromInteractionId(ix.interactionId),
      });
    }
    return maxCraftBenchTierNear({
      playerX: this.player.position.x,
      playerZ: this.player.position.z,
      range: CRAFT_BENCH_RANGE,
      benches,
    });
  }

  private syncCraftBenchTier(): void {
    const tier = this.getMaxNearCraftTier();
    if (tier >= 0) this.craftingSystem.setActiveBenchTier(tier);
  }

  /** Live primary-action label for farm beds (plant / water / grow % / harvest). */
  private updateFarmHudContext(interactionId: string): void {
    const plotId = plotIdFromInteractable(interactionId);
    if (!plotId) {
      this.hud.setPrimaryActionContext("generic");
      return;
    }
    this.farming.ensurePlot(plotId);
    const plot = this.farming.getPlot(plotId);
    if (!plot) {
      this.hud.setPrimaryActionContext("generic");
      return;
    }
    const decision = decideFarmInteract(plot, this.inventory, this.farmInteractOptions());
    let label = I18N.t("hud.interact");
    let growth: number | null = null;
    switch (decision.kind) {
      case "plant":
        label = I18N.t("hud.farmPlant");
        break;
      case "water":
        label = I18N.t("hud.farmWater");
        break;
      case "fertilize":
        label = I18N.t("hud.farmFertilize");
        break;
      case "harvest":
        label = I18N.t("hud.farmHarvest");
        break;
      default:
        if (decision.state === "empty") label = I18N.t("hud.farmPlant");
        else {
          label = I18N.t("hud.farmGrow");
          growth = decision.growthPct;
        }
        break;
    }
    this.hud.setFarmPlotActionContext(label, growth);
  }

  private farmInteractOptions(): {
    preferredQuickSeeds: readonly (import("../items/ItemId").ItemId | null | undefined)[];
    baseCanIrrigate: boolean;
  } {
    return {
      preferredQuickSeeds: Object.freeze([
        this.quickSlots[0].current?.itemId,
        this.quickSlots[1].current?.itemId,
      ]),
      baseCanIrrigate: this.water.cleanWater >= FARM_BASE_IRRIGATION,
    };
  }

  private hasBuiltStation(pieceId: string): boolean {
    return this.building.all.some((p) => p.pieceId === pieceId);
  }

  /** E on garden bed: plant → water → fertilize → harvest (context-sensitive). */
  private interactFarmPlot(interactionId: string): void {
    if (!isFarmPlotInteractionId(interactionId)) return;
    const plotId = plotIdFromInteractable(interactionId);
    if (!plotId) return;
    this.farming.ensurePlot(plotId);
    const plot = this.farming.getPlot(plotId);
    if (!plot) return;
    const decision = decideFarmInteract(plot, this.inventory, this.farmInteractOptions());

    if (decision.blocked === "need-seed") {
      this.notify.push(I18N.t("notify.farmNeedSeed"), "warn");
      return;
    }
    if (decision.blocked === "need-water") {
      this.notify.push(I18N.t("notify.farmNeedWater"), "warn");
      return;
    }

    if (decision.kind === "plant" && decision.seedId) {
      if (!this.farming.plant(plotId, decision.seedId, this.inventory)) {
        this.notify.push(I18N.t("notify.farmNeedSeed"), "warn");
        return;
      }
      this.notify.push(I18N.t("notify.farmPlanted", { name: itemName(decision.seedId) }), "success");
      this.world.syncFarmBeds(this.farming.all);
      this.queueAutosaveSoon();
      return;
    }

    if (decision.kind === "water") {
      const hasBottleWater = this.inventory.totalQuantity("clean-water") > 0
        || this.inventory.totalQuantity("water-bottle") > 0
        || this.inventory.totalQuantity("rain-water") > 0;
      if (hasBottleWater) {
        if (!this.farming.water(plotId, this.inventory)) {
          this.notify.push(I18N.t("notify.farmNeedWater"), "warn");
          return;
        }
      } else if (
        this.water.irrigate(FARM_BASE_IRRIGATION)
        && this.farming.water(plotId, this.inventory, { fromBaseTank: true })
      ) {
        // base tank irrigation
      } else {
        this.notify.push(I18N.t("notify.farmNeedWater"), "warn");
        return;
      }
      this.notify.push(I18N.t("notify.farmWatered"), "success");
      this.world.syncFarmBeds(this.farming.all);
      this.queueAutosaveSoon();
      return;
    }

    if (decision.kind === "fertilize") {
      if (!this.farming.fertilize(plotId, this.inventory)) {
        this.notify.push(I18N.t("notify.farmGrowing", { pct: String(decision.growthPct) }), "info");
        return;
      }
      this.notify.push(I18N.t("notify.farmFertilized"), "success");
      this.world.syncFarmBeds(this.farming.all);
      this.queueAutosaveSoon();
      return;
    }

    if (decision.kind === "harvest") {
      const seedId = plot.seedId;
      if (!this.farming.harvest(plotId, this.inventory)) {
        this.notify.push(I18N.t("notify.inventoryFull"), "warn");
        return;
      }
      this.notify.push(I18N.t("notify.farmHarvest"), "success");
      this.completeQuest("farm-harvest");
      if (seedId) this.journal.discoverItem(seedId);
      this.world.syncFarmBeds(this.farming.all);
      this.queueAutosaveSoon();
      return;
    }

    // status
    if (decision.state === "empty") {
      this.notify.push(I18N.t("notify.farmNeedSeed"), "info");
    } else {
      this.notify.push(I18N.t("notify.farmGrowing", { pct: String(decision.growthPct) }), "info");
    }
  }

  private deliverStationOutput(stack: import("../items/ItemSystem").ItemStack, processId: string): void {
    if (this.inventory.tryInsert(stack).accepted) {
      this.notify.push(I18N.t("notify.stationDone", {
        name: itemName(stack.itemId),
      }), "success");
    } else {
      this.mailbox.deliver(stack, this.inventory);
      this.notify.push(I18N.t("notify.stationMailbox", {
        name: itemName(stack.itemId),
      }), "warn");
    }
    if (processId.startsWith("campfire:") && !processId.includes("charcoal")) {
      this.completeQuest("cook-meal");
      this.notifyAchievement("first-cook");
    }
    if (processId.includes("iron") || processId.includes("scrap")) {
      this.completeQuest("smelt-iron");
    }
    this.stats.recordCraft();
    this.journal.discoverItem(stack.itemId);
    this.stationPanel.refresh();
    this.queueAutosaveSoon();
  }

  /** Spawn corpse bag props for the current location only (LDoE-style recover trip). */
  private syncDeathBagWorldPresence(): void {
    for (const entity of this.deathBagEntities) {
      this.world.removeInteractable(entity);
      entity.dispose();
    }
    this.deathBagEntities.length = 0;
    for (const bag of this.deathBags.bagsAt(this.locations.currentId)) {
      const entity = new DeathBagEntity(this.scene, bag.id, bag.x, bag.z);
      this.deathBagEntities.push(entity);
      this.world.addInteractable(entity);
    }
  }

  private onEnemyKilled(enemy: RoamingZombie): void {
    const archetype = enemy.archetype;
    this.experience.addXp(archetype.xpReward);
    this.stats.recordEnemyKill(enemy.role === "boss");
    this.completeQuest("kill-zombie");
    this.completeQuest("kill-infected-10");
    this.journal.discoverEnemy(enemy.archetypeId);
    if (enemy.role === "boss") {
      const dungeon = dungeonForLocation(this.locations.currentId);
      if (dungeon) {
        this.dungeonResets.markBossDefeated(dungeon);
        this.notify.push(I18N.t("notify.bossDown", { name: enemy.displayName }), "success");
        this.queueAutosaveSoon();
      }
      if (enemy.archetypeId === "the-warden") this.notifyAchievement("warden-defeated");
      if (enemy.archetypeId === "metro-leviathan") this.notifyAchievement("metro-boss");
      if (enemy.archetypeId === "marrow-warden") this.notifyAchievement("hospital-boss");
      if (enemy.archetypeId === "helix-sovereign") this.notifyAchievement("blacksite-boss");
    }
    this.notifyAchievement("first-kill");
    const kills = this.stats.snapshot().enemiesKilled;
    if (kills >= 50) this.notifyAchievement("kills-50");
    if (kills >= 200) this.notifyAchievement("kills-200");
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
        this.notifyAchievement("map-fragment-finder");
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
      this.notify.push(I18N.t("notify.contractReady", { title: raidDone.title }), "success");
      this.completeQuest("frontier-favor");
    }
    if (enemy.combatId.startsWith("defense-") && this.homeDefenseRunning) {
      this.horde.onEnemyDefeated();
      if (this.horde.state === "complete") this.finishHomeDefenseVictory();
    }
    this.tryCompleteActiveRaid();
    this.syncHudNeeds();
  }

  private tickHomeDefense(frameDelta: number): void {
    if (!this.homeDefenseRunning || this.locations.currentId !== "home") return;
    const batch = this.horde.tick(frameDelta);
    for (const arch of batch) {
      this.spawnHomeDefenseEnemy(arch);
    }
    if (this.horde.state === "complete") {
      this.finishHomeDefenseVictory();
    }
  }

  private spawnHomeDefenseEnemy(archetypeId: import("../enemies/EnemyArchetypes").EnemyArchetypeId): void {
    const pos = homeDefenseSpawnPoint(this.defenseSpawnSerial++);
    const id = `defense-${archetypeId}-${String(this.defenseSpawnSerial).padStart(3, "0")}`;
    const enemy = new RoamingZombie(id, pos, archetypeId);
    this.enemies.register(enemy);
    this.collision.addCircle(pos.x, pos.z, enemy.archetype.collisionRadius, this.enemyCollisionLabel(enemy));
    for (const mesh of this.enemyPresentation.spawn(enemy)) this.lighting.addCaster(mesh);
  }

  /** Start Hold-the-Gate waves when a home defend contract is active at Home. */
  private maybeStartHomeDefense(): void {
    if (this.locations.currentId !== "home") return;
    if (this.homeDefenseRunning || this.horde.active) return;
    const job = this.contracts.activeContracts.find(
      (c) => c.kind === "defend" && !c.completed && isHomeDefenseContractHint(c.targetLocationHint),
    );
    if (!job) return;
    this.defenseSpawnSerial = 0;
    this.homeDefenseRunning = true;
    this.horde.start(HOME_GATE_DEFENSE);
    this.notify.push(I18N.t("notify.defenseStart", { title: job.title }), "warn");
  }

  private stopHomeDefenseEncounter(): void {
    this.homeDefenseRunning = false;
    this.horde.reset();
  }

  private finishHomeDefenseVictory(): void {
    if (!this.homeDefenseRunning) return;
    this.homeDefenseRunning = false;
    this.horde.reset();
    const done = this.contracts.completeByKind("defend");
    if (done) {
      this.notify.push(I18N.t("notify.defenseCleared", { title: done.title }), "success");
      this.notify.push(I18N.t("notify.contractReady", { title: done.title }), "success");
    } else {
      this.notify.push(I18N.t("notify.defenseCleared", { title: "Home" }), "success");
    }
    this.queueAutosaveSoon();
  }

  /** When the last hostile at an open raid site dies — clear compound + loot. */
  private tryCompleteActiveRaid(): void {
    if (!this.activeRaidSiteId) return;
    if (this.enemies.liveCount > 0) return;
    const raidId = this.activeRaidSiteId;
    const site = this.raids.list().find((r) => r.id === raidId);
    if (!site || site.cleared) {
      this.activeRaidSiteId = null;
      return;
    }
    if (!this.raids.markCleared(raidId)) return;
    this.activeRaidSiteId = null;
    this.stats.recordRaidClear();
    this.notifyAchievement("raid-clearer");
    this.completeQuest("clear-raid");
    const raidContract = this.contracts.completeByKind("raid");
    if (raidContract) {
      this.notify.push(I18N.t("notify.contractReady", { title: raidContract.title }), "success");
    }
    const loot = rollNamedLoot(site.lootProfile, site.seed * 1337);
    for (const stack of loot) {
      if (!this.inventory.tryInsert(stack).accepted) this.mailbox.deliver(stack, this.inventory);
    }
    this.experience.addXp(25 + site.threat * 12);
    this.notify.push(I18N.t("notify.raidCleared", { title: site.title }), "success");
    this.queueAutosaveSoon();
  }

  private spawnStarterMaterialsAndContainers(): void {
    this.spawnStarterGroundMats();
    this.spawnStarterSupplyCrate();
  }

  private seedWorldLootDefaults(): void {
    spawnStarterGroundResources(this.groundLoot);
    this.spawnStarterMaterialsAndContainers();
  }

  private clearWorldLootAndContainers(): void {
    this.groundLoot.clearAll();
    for (const container of this.worldContainers) {
      this.world.removeInteractable(container);
    }
    this.worldContainers.length = 0;
    for (const ix of this.builtStationInteractables.values()) {
      this.world.removeInteractable(ix);
    }
    this.builtStationInteractables.clear();
    this.containerPanel.close();
    for (const entity of this.deathBagEntities) {
      this.world.removeInteractable(entity);
      entity.dispose();
    }
    this.deathBagEntities.length = 0;
  }

  private spawnStarterGroundMats(): void {
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
  }

  private spawnStarterSupplyCrate(): void {
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
    this.ensureHomeServiceInteractables();
    this.ensureCampNpcInteractables();
    this.ensureLockedSitePresence();
  }

  /** Mailbox storage + contract bulletin (home only). */
  private ensureHomeServiceInteractables(): void {
    // Mailbox is Interactable-only (serialized via blob.mailbox, not worldContainers).
    if (!this.homeMailboxMounted) {
      this.world.addInteractable(this.mailbox.entity);
      this.homeMailboxMounted = true;
    }
    this.mailbox.entity.setActive(this.locations.currentId === "home");

    if (!this.homeBoardInteractable) {
      this.homeBoardInteractable = createInteractable({
        id: "home-contract-board",
        type: "station",
        position: () => Object.freeze({
          x: HOME_HOUSE_ORIGIN.x - 2.2,
          y: 0,
          z: HOME_HOUSE_ORIGIN.z + 1.4,
        }),
        radius: () => 0.95,
        enabled: () => this.locations.currentId === "home" && this.gameStarted,
      });
      this.world.addInteractable(this.homeBoardInteractable);
    }
  }

  private syncHomeServiceInteractables(): void {
    this.mailbox.entity.setActive(this.locations.currentId === "home" && this.gameStarted);
  }

  /** Jon / Mira talk+trade points at survivor-camp. */
  private ensureCampNpcInteractables(): void {
    for (const def of npcsAtLocation(SURVIVOR_CAMP_NPCS, "survivor-camp")) {
      const id = npcInteractableId(def.id);
      if (this.campNpcInteractables.has(id)) continue;
      const offset = npcCampOffset(def.id);
      const entity = createInteractable({
        id,
        type: "npc",
        position: () => Object.freeze({ x: offset.x, y: 0, z: offset.z }),
        radius: () => 1.05,
        enabled: () => this.locations.currentId === "survivor-camp" && this.gameStarted,
      });
      this.campNpcInteractables.set(id, entity);
      this.world.addInteractable(entity);
    }
  }

  /** Register / refresh a claimed barter event as a temporary trader NPC. */
  private spawnEventCaravan(event: { id: string; kind: WorldEventKind; seed: number }): void {
    if (!isBarterEventKind(event.kind)) return;
    const npcId = eventTraderNpcId(event.id);
    const locationId = eventAnchorLocation(event);
    this.npcs.registerNpc(Object.freeze({
      id: npcId,
      name: caravanDisplayName(event.kind),
      role: "trader" as const,
      locationId,
    }));
    this.npcs.setOffers(npcId, caravanOffersFor(event.kind, event.seed));
    this.eventCaravanNpcIds.add(npcId);
    this.ensureEventTraderInteractable(npcId, locationId);
  }

  private ensureEventTraderInteractable(npcId: string, locationId: string): void {
    const id = npcInteractableId(npcId);
    if (this.eventTraderInteractables.has(id)) return;
    const offset = npcCampOffset(npcId);
    const entity = createInteractable({
      id,
      type: "npc",
      position: () => Object.freeze({ x: offset.x, y: 0, z: offset.z }),
      radius: () => 1.1,
      enabled: () => this.locations.currentId === locationId
        && this.gameStarted
        && this.eventCaravanNpcIds.has(npcId),
    });
    this.eventTraderInteractables.set(id, entity);
    this.world.addInteractable(entity);
  }

  /**
   * Keep caravan NPCs in sync with claimed barter events that are still live.
   * Call after event tick / travel / load.
   */
  private syncEventCaravans(): void {
    const live = new Set<string>();
    for (const event of this.worldEvents.events) {
      if (!event.claimed || !isBarterEventKind(event.kind)) continue;
      if (event.expiresAtWorldDay <= this.worldDayAccum) continue;
      const npcId = eventTraderNpcId(event.id);
      live.add(npcId);
      if (!this.eventCaravanNpcIds.has(npcId)) {
        this.spawnEventCaravan(event);
      }
    }
    for (const npcId of [...this.eventCaravanNpcIds]) {
      if (live.has(npcId)) continue;
      this.despawnEventCaravan(npcId);
    }
  }

  private despawnEventCaravan(npcId: string): void {
    this.eventCaravanNpcIds.delete(npcId);
    this.npcs.unregisterNpc(npcId);
    if (this.npcPanel.isOpen && this.npcPanel.currentNpcId === npcId) {
      this.npcPanel.close();
      this.notify.push(I18N.t("notify.caravanGone"), "info");
    }
    this.eventTraderInteractables.delete(npcInteractableId(npcId));
  }

  /** Locked site chests + key desks / breakers for motel, factory, bunker. */
  private ensureLockedSitePresence(): void {
    const here = this.locations.currentId;
    const live = this.gameStarted;
    for (const site of LOCKED_SITES) {
      const atSite = live && here === site.locationId;
      let chest = this.worldContainers.find((c) => c.interactionId === site.containerId);
      if (!chest) {
        const loot = rollNamedLoot(site.lootProfile, site.lockId.length * 911 + site.capacity * 17);
        chest = new WorldContainerEntity(
          site.containerId,
          site.title,
          Object.freeze({ x: site.x, y: 0, z: site.z }),
          site.capacity,
          loot,
          "take-all",
        );
        this.worldContainers.push(chest);
        this.world.addInteractable(chest);
      }
      chest.setActive(atSite);

      const support = site.support;
      if (!support) continue;
      if (support.kind === "key-stash") {
        let desk = this.worldContainers.find((c) => c.interactionId === support.id);
        if (!desk) {
          const initial = support.keyItem ? [createItemStack(support.keyItem, 1)] : [];
          desk = new WorldContainerEntity(
            support.id,
            support.title ?? "Desk",
            Object.freeze({ x: support.x, y: 0, z: support.z }),
            4,
            initial,
            "take-all",
          );
          this.worldContainers.push(desk);
          this.world.addInteractable(desk);
        }
        desk.setActive(atSite);
      } else if (support.kind === "breaker") {
        if (!this.lockSupportInteractables.has(support.id)) {
          const entity = createInteractable({
            id: support.id,
            type: "station",
            position: () => Object.freeze({ x: support.x, y: 0, z: support.z }),
            radius: () => 0.95,
            enabled: () => this.locations.currentId === site.locationId && this.gameStarted,
          });
          this.lockSupportInteractables.set(support.id, entity);
          this.world.addInteractable(entity);
        }
      }
    }
  }

  /** Returns false when the container stays locked. */
  private tryAccessLockedContainer(container: WorldContainerEntity): boolean {
    const lockId = lockIdFromContainerId(container.interactionId);
    if (!lockId) return true;
    if (!this.locks.isLocked(lockId)) return true;
    const result = this.locks.tryUnlockWithInventory(lockId, this.inventory);
    if (!result.ok) {
      this.notifyLockFailure(result.reason, lockId);
      return false;
    }
    this.notify.push(I18N.t("notify.lockOpened"), "success");
    this.queueAutosaveSoon();
    return true;
  }

  private interactLockSupport(interactionId: string): void {
    const site = lockSupportSite(interactionId);
    if (!site?.support || site.support.kind !== "breaker") return;
    this.locks.setPowered(site.lockId, true);
    this.notify.push(I18N.t("notify.lockPowered"), "info");
    if (this.locks.isLocked(site.lockId)) {
      const unlocked = this.locks.tryUnlockWithInventory(site.lockId, this.inventory);
      if (unlocked.ok) this.notify.push(I18N.t("notify.lockOpened"), "success");
    }
    this.queueAutosaveSoon();
  }

  private notifyLockFailure(reason: string | null, lockId: string): void {
    const lock = this.locks.get(lockId);
    if (reason === "need-key" && lock?.requiredKey) {
      this.notify.push(I18N.t("notify.lockNeedKey", { name: itemName(lock.requiredKey) }), "warn");
      return;
    }
    if (reason === "no-power") {
      this.notify.push(I18N.t("notify.lockNeedPower"), "warn");
      return;
    }
    this.notify.push(I18N.t("notify.lockBlocked"), "warn");
  }

  private openNpcForInteractable(interactionId: string): void {
    const npcId = npcIdFromInteractable(interactionId);
    if (!npcId || !this.npcs.getNpc(npcId)) return;
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.containerPanel.close();
    this.stationPanel.close();
    this.vehiclePanel.close();
    this.contractPanel.close();
    this.mapPanel.close();
    this.localMap.close();
    const node = defaultDialogueNode(npcId, this.inventory);
    if (node) this.npcs.beginDialogue(npcId, node);
    const prefer: "talk" | "trade" = this.npcs.getNpc(npcId)?.role === "trader" && !node
      ? "trade"
      : "talk";
    this.npcPanel.open(npcId, this.inventory, prefer);
  }

  private handleNpcChoice(choiceId: string): void {
    const peek = this.npcs.peekChoice(choiceId);
    if (!peek) return;

    if (peek.consumeItem === COURIER_PACKAGE_ID) {
      const delivered = tryDeliverCourierPackage(this.inventory);
      if (!delivered.ok) {
        this.notify.push(I18N.t("notify.courierNoPackage"), "warn");
        return;
      }
    } else if (peek.consumeItem) {
      const slot = this.inventory.findFirstSlotByItemId(peek.consumeItem);
      if (slot === null) {
        this.notify.push(I18N.t("notify.courierNoPackage"), "warn");
        return;
      }
      const stack = this.inventory.getSlot(slot).stack;
      if (stack) this.inventory.exchangeWholeStack(slot, stack, null);
    }

    if (peek.grantItem === COURIER_PACKAGE_ID) {
      const granted = tryGrantCourierPackage(this.inventory);
      if (!granted.ok) {
        this.notify.push(
          granted.reason === "already-carrying"
            ? I18N.t("notify.courierAlready")
            : I18N.t("notify.inventoryFull"),
          "warn",
        );
        return;
      }
      this.notify.push(I18N.t("notify.courierGranted"), "success");
    } else if (peek.grantItem) {
      if (!this.inventory.tryInsert(createItemStack(peek.grantItem, 1)).accepted) {
        this.notify.push(I18N.t("notify.inventoryFull"), "warn");
        return;
      }
    }

    const result = this.npcs.choose(choiceId);
    if (result.reputation > 0) {
      this.reputation.add("frontier-survivors", result.reputation);
      this.maybeUnlockFactionAlly();
    }
    if (result.grantTokens > 0) {
      this.npcs.addTokens(result.grantTokens);
    }
    if (result.startQuest) {
      const questId = result.startQuest as Parameters<QuestSystem["setTracked"]>[0];
      this.quests.setTracked(questId);
      const def = QUEST_DEFS.find((q) => q.id === questId);
      this.notify.push(I18N.t("notify.npcQuest", { title: def?.title ?? questId }), "success");
    }
    if (result.completeQuest) {
      this.completeQuest(result.completeQuest as Parameters<QuestSystem["advance"]>[0]);
      if (result.consumeItem === COURIER_PACKAGE_ID) {
        this.notify.push(I18N.t("notify.courierDelivered"), "success");
      }
    }
    const npcId = this.npcPanel.currentNpcId;
    if (result.ended && choiceId === "browse" && npcId) {
      this.npcPanel.open(npcId, this.inventory, "trade");
      return;
    }
    this.npcPanel.refresh();
    this.queueAutosaveSoon();
  }

  private handleNpcTrade(offerId: string): void {
    const npcId = this.npcPanel.currentNpcId;
    if (!npcId) return;
    const offer = this.npcs.listOffers(npcId).find((o) => o.id === offerId);
    const result = this.npcs.tryBarter(npcId, offerId, this.inventory);
    if (!result.accepted) {
      this.notify.push(I18N.t("notify.npcTradeFail", { reason: result.reason ?? "blocked" }), "warn");
      this.npcPanel.refresh();
      return;
    }
    const name = offer ? itemName(offer.offer.itemId) : offerId;
    this.notify.push(I18N.t("notify.npcTradeOk", { name }), "success");
    this.npcPanel.refresh();
    this.queueAutosaveSoon();
  }

  private purchaseSkill(id: SkillId): void {
    const result = tryBuySkill(this.skills, this.experience, id);
    if (!result.ok) {
      this.notify.push(
        result.reason === "max-rank" ? I18N.t("skills.maxed") : I18N.t("notify.noSkillPoints"),
        "warn",
      );
      this.skillsPanel.refresh();
      return;
    }
    this.syncSkillEffects();
    this.notify.push(I18N.t("notify.skillBought", { name: I18N.t(`skill.${id}` as "skill.max-hp") }), "success");
    this.skillsPanel.refresh();
    this.queueAutosaveSoon();
  }

  /** Apply vitality max HP + harvest swing speed from the skill tree. */
  private syncSkillEffects(): void {
    const maxHp = playerMaxHealthFromSkills(this.skills);
    if (this.player.health.maxHealth !== maxHp) {
      this.player.health.setMaxHealth(maxHp);
    }
    this.harvesting.setSpeedMultiplier(this.skills.harvestSpeedMultiplier());
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
  }

  private claimContractReward(id: string): void {
    const c = this.contracts.claim(id);
    if (!c) {
      this.notify.push(I18N.t("notify.contractNotReady"), "warn");
      return;
    }
    this.experience.addXp(c.rewardXp);
    this.reputation.add(c.factionId, c.rewardReputation);
    this.maybeUnlockFactionAlly();
    const loot = rollNamedLoot(lootProfileForContract(c), Date.now() + c.id.length * 97);
    for (const stack of loot) {
      if (!this.inventory.tryInsert(stack).accepted) this.mailbox.deliver(stack, this.inventory);
    }
    this.notify.push(I18N.t("notify.contractClaimed", { title: c.title, xp: c.rewardXp }), "success");
    this.contractPanel.refresh();
    this.queueAutosaveSoon();
  }

  private restoreWorldContainers(entries: readonly SerializedContainer[]): void {
    for (const entry of entries) {
      // Mailbox is save-domain separate (blob.mailbox).
      if (entry.id === "home-mailbox") continue;
      const mode = entry.accessMode === "storage" || entry.id.startsWith("built-chest-")
        ? "storage"
        : "take-all";
      const entity = new WorldContainerEntity(
        entry.id,
        entry.title || "Container",
        Object.freeze({ x: entry.x, y: entry.y ?? 0, z: entry.z }),
        Math.max(1, entry.capacity || 8),
        [],
        mode,
      );
      const slots = entry.slots ?? [];
      for (let i = 0; i < entity.inventory.slotCount; i += 1) {
        const data = slots[i] ?? null;
        const stack = data ? deserializeStack(data) : null;
        entity.inventory.place(i, stack);
      }
      entity.setActive(entry.active !== false);
      this.worldContainers.push(entity);
      this.world.addInteractable(entity);
    }
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

    const raid = unclearedRaidAt(this.raids.list(), locationId);
    if (raid) {
      this.activeRaidSiteId = raid.id;
      this.spawnRaidCompoundWave(raid, locationId);
      return;
    }
    this.activeRaidSiteId = null;

    const specs = withNightSpawnPressure(
      enemySpawnSpecsFor(locationId),
      this.worldClock.isNight,
      locationId,
    );
    const dungeon = dungeonForLocation(locationId);
    const bossCleared = dungeon ? this.dungeonResets.getState(dungeon)?.bossDefeated === true : false;
    const filtered = bossCleared
      ? specs.filter((s) => combatRoleFor(s.archetypeId) !== "boss")
      : specs;
    const total = filtered.reduce((n, s) => n + s.count, 0);
    if (total === 0) return;
    const positions = spawnPositionsForLocation(total, locationId);
    let index = 0;
    for (const spec of filtered) {
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

  /** Relock chests, refill loot, respawn if the player is inside the cycling dungeon. */
  private applyDungeonResets(resetIds: readonly DungeonId[]): void {
    this.notify.push(
      I18N.t("notify.dungeonReset", { names: formatDungeonResetNames(resetIds) }),
      "warn",
    );
    for (const id of resetIds) {
      for (const lockId of locksForDungeon(id)) {
        this.locks.relock(lockId);
        this.refillLockedChestForLock(lockId, id);
      }
      if (id === "bunker-echo") {
        this.warden.reset();
      }
    }
    if (playerInsideResetDungeon(this.locations.currentId, resetIds)) {
      this.notify.push(I18N.t("notify.dungeonResetHere"), "warn");
      this.respawnLocationEnemies(this.locations.currentId);
      this.syncDeathBagWorldPresence();
    }
    this.queueAutosaveSoon();
  }

  private refillLockedChestForLock(lockId: string, dungeonId: DungeonId): void {
    const site = LOCKED_SITES.find((s) => s.lockId === lockId);
    if (!site) return;
    const chest = this.worldContainers.find((c) => c.interactionId === site.containerId);
    if (!chest) return;
    const wave = this.dungeonResets.getState(dungeonId)?.lootWave ?? 1;
    for (let i = 0; i < chest.inventory.slotCount; i += 1) {
      if (chest.inventory.getSlot(i)) chest.inventory.place(i, null);
    }
    const loot = rollNamedLoot(site.lootProfile, lockId.length * 911 + wave * 1301 + site.capacity * 17);
    for (const stack of loot) {
      chest.inventory.tryInsert(stack);
    }
  }

  /** Dense hostile wave for an open map raid compound. */
  private spawnRaidCompoundWave(
    raid: import("../raids/RaidSystem").RaidSite,
    locationId: LocationId,
  ): void {
    const count = raidReinforcementCount(raid);
    const positions = spawnPositionsForLocation(count, locationId);
    const roster: import("../enemies/EnemyArchetypes").EnemyArchetypeId[] = raid.hasLeader
      ? ["marauder-melee", "marauder-scout", "marauder-ranged", "marauder-heavy", "bandit-leader", "ash-jackal"]
      : ["marauder-melee", "marauder-scout", "marauder-ranged", "ash-jackal", "industrial-raider"];
    for (let i = 0; i < count; i += 1) {
      const position = positions[i] ?? { x: 6 + (i % 4), y: 0, z: 6 + Math.floor(i / 4) };
      const arch = roster[i % roster.length]!;
      const id = `raid-${raid.id}-${arch}-${String(i + 1).padStart(2, "0")}`;
      const enemy = new RoamingZombie(id, position, arch);
      this.enemies.register(enemy);
      this.collision.addCircle(position.x, position.z, enemy.archetype.collisionRadius, this.enemyCollisionLabel(enemy));
      for (const mesh of this.enemyPresentation.spawn(enemy)) this.lighting.addCaster(mesh);
    }
  }

  /** Ensure raid pin locations are walkable on the overworld map. */
  private syncRaidLocationUnlocks(): void {
    for (const site of this.raids.list()) {
      if (site.cleared) continue;
      this.locations.unlock(raidAnchorLocation(site));
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
    this.status.clear();
    this.hud.setStatusEffects([]);
    this.combat.cancelAttack();
    this.harvesting.cancel();
    this.player.stopMovement();
    this.inventoryPanel.close();
    this.craftingPanel.close();
    this.mapPanel.close();
    this.stationPanel.close();
    this.vehiclePanel.close();
    this.contractPanel.close();
    this.npcPanel.close();
    this.skillsPanel.close();
    this.journalPanel.close();
    this.achievementsPanel.close();
    this.questsPanel.close();
    this.containerPanel.close();
    this.deathBags.captureAndStrip({
      locationId: this.locations.currentId,
      x: this.player.position.x,
      z: this.player.position.z,
      inventory: this.inventory,
      equipment: this.equipment,
      weapon: this.weaponSlot,
      backpack: this.backpackSlot,
      quicks: this.quickSlots,
      utility: this.utilitySlot,
    });
    this.syncDeathBagWorldPresence();
    this.syncHeldWeaponVisual();
    this.syncQuickHud();
    this.equipmentVisual.resync();
    this.applyGameplayPanelState(true);
    this.deathScreen.open({
      locationName: locationTitle(this.locations.currentId),
      cause: this.lastDeathCause,
    });
    this.notify.push(I18N.t("notify.died"), "error");
    // Persist stripped loadout + death bag immediately (don't wait for autosave).
    this.deferredSaveTimer = 0;
    this.persistSave(false);
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
    this.beginZoneVisitForCurrentLocation();
    this.sneak.setActive(false);
    this.hud.setSneakActive(false);
    this.status.clear();
    this.hud.setStatusEffects([]);
    this.applyGameplayPanelState(false);
    this.hud.setPlayerHealth(this.player.health.currentHealth, this.player.health.maxHealth);
    this.syncHudNeeds();
    this.notify.push(I18N.t("notify.respawned"), "success");
    // Hint where the gear still is (LDoE recovery trip).
    const elsewhere = this.deathBags.all.find((b) => b.locationId !== "home");
    if (elsewhere) {
      this.notify.push(I18N.t("notify.deathBagHere", { location: locationTitle(elsewhere.locationId) }), "warn");
    }
    this.syncDeathBagWorldPresence();
    this.persistSave(false);
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

    // Exactly 10 stacks → fill permanent POCKETS only (never into backpack storage).
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
    ] as const;
    for (let i = 0; i < packs.length && i < this.inventory.baseSlotCount; i += 1) {
      this.inventory.placeIntoEmptySlot(i, packs[i]);
    }
    this.farming.ensurePlot("home-plot-1");
  }


  private applyCombatWound(finalDamage: number, archetypeId?: string): void {
    const bleedChance = finalDamage >= 12 ? 0.42 : finalDamage >= 6 ? 0.28 : 0.14;
    if (Math.random() < bleedChance) {
      const wasNew = this.status.apply("bleeding");
      if (wasNew) this.notify.push(I18N.t("notify.bleeding"), "warn");
    }
    const slowChance = finalDamage >= 10 ? 0.28 : 0.16;
    if (Math.random() < slowChance) {
      const wasNew = this.status.apply("slow");
      if (wasNew) this.notify.push(I18N.t("notify.slowed"), "info");
    }
    if (archetypeId) {
      const infectious = canInfectFromArchetype(archetypeId);
      const infectChance = infectionChanceFromHit(finalDamage, infectious);
      if (infectChance > 0 && Math.random() < infectChance) {
        const wasNew = this.status.apply("infection");
        if (wasNew) this.notify.push(I18N.t("notify.infection"), "warn");
      }
    }
    this.hud.setStatusEffects(this.status.ids());
  }

  private feedbackConsumable(result: {
    clearedBleeding?: boolean;
    clearedInfection?: boolean;
    appliedRegen?: boolean;
    warmthCleared?: number;
  }): void {
    if (result.clearedBleeding) {
      GAME_AUDIO.playHeal();
      this.notify.push(I18N.t("notify.woundTreated"), "success");
    }
    if (result.clearedInfection) {
      GAME_AUDIO.playHeal();
      this.notify.push(I18N.t("notify.infectionCleared"), "success");
    }
    if (result.appliedRegen) {
      this.notify.push(I18N.t("notify.regenerating"), "info");
    }
    if ((result.warmthCleared ?? 0) > 0) {
      this.notify.push(I18N.t("notify.warmedUp"), "success");
      this.hud.setColdExposure(this.cold.ratio);
    }
    this.hud.setStatusEffects(this.status.ids());
  }

  private notifyAchievement(id: AchievementId): void {
    if (!this.achievements.tryUnlock(id)) return;
    const def = ACHIEVEMENT_DEFS.find((d) => d.id === id);
    this.notify.push(I18N.t("notify.achievement", { title: achievementTitle(id, def?.title ?? id) }), "success");
    if (this.achievementsPanel.isOpen) this.achievementsPanel.refresh();
  }

  private maybeUnlockFactionAlly(): void {
    for (const def of this.reputation.defs()) {
      if (this.reputation.tier(def.id) === "ally") {
        this.notifyAchievement("faction-ally");
        return;
      }
    }
  }

  private travelReasonMessage(reason: string | null | undefined): string {
    const key = ({
      Locked: "travel.locked",
      "Use parent entrance": "travel.parent",
      "Need bunker access card": "travel.needBunker",
      "Exhausted — walk home or rest": "travel.exhausted",
      locked: "travel.locked",
      parent: "travel.parent",
      "need-bunker": "travel.needBunker",
      exhausted: "travel.exhausted",
    } as Record<string, Parameters<typeof I18N.t>[0]>)[reason ?? ""] ?? "travel.unknown";
    // if still free text EN from system, try code map else return translated unknown + reason
    if (key === "travel.unknown" && reason) {
      const codeKey = `travel.${reason}` as Parameters<typeof I18N.t>[0];
      const tried = I18N.tx(codeKey, "");
      if (tried) return tried;
      return reason;
    }
    return I18N.t(key);
  }

  private buildFailMessage(reason: string | null | undefined): string {
    const map: Record<string, Parameters<typeof I18N.t>[0] | string> = {
      "not-enough-resources": "build.reason.no-materials",
      "needs-floor": "build.reason.needs-floor",
      "not-adjacent": "build.reason.invalid",
      "slot-occupied": "build.reason.occupied",
      "out-of-bounds": "build.reason.out-of-bounds",
      "not-selected": "build.reason.no-piece",
      "unknown-piece": "build.reason.no-piece",
      "invalid-cell": "build.reason.invalid",
    };
    const k = map[reason ?? "invalid-cell"] ?? "build.reason.invalid";
    return I18N.t(k as Parameters<typeof I18N.t>[0]);
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
    const containers: SerializedContainer[] = this.worldContainers
      .filter((container) => container.interactionId !== "home-mailbox")
      .map((container) => {
      const p = container.getInteractionPosition();
      const slots = container.inventory.getSlots().map((s) => (s.stack ? serializeStack(s.stack) : null));
      return Object.freeze({
        id: container.interactionId,
        title: container.inventory.title,
        x: p.x,
        y: p.y,
        z: p.z,
        capacity: container.inventory.slotCount,
        active: container.isInteractionEnabled(),
        accessMode: container.accessMode,
        slots: Object.freeze(slots),
      });
    });
    // Preferences always live in their own localStorage keys; also embed for full save export.
    try {
      localStorage.setItem(GAME_CONFIG.localStorageKey, JSON.stringify(this.config));
    } catch { /* ignore quota */ }
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
      quick: this.quickSlots[0].current ? serializeStack(this.quickSlots[0].current) : null,
      quick2: this.quickSlots[1].current ? serializeStack(this.quickSlots[1].current) : null,
      utility: this.utilitySlot.current ? serializeStack(this.utilitySlot.current) : null,
      bunkerAccess: this.locations.hasBunkerAccess,
      unlockedLocations: this.locations.unlockedIds,
      playtimeSec: Math.floor(this.totalPlaytimeSec),
      position: Object.freeze({ x: pos.x, y: pos.y, z: pos.z }),
      facingYaw: this.player.facingYaw,
      locations: this.locations.serialize(),
      quests: this.quests.serialize(),
      achievements: this.achievements.serialize(),
      learnedBlueprints: this.blueprints.serialize(),
      farming: this.farming.serialize(),
      building: this.building.serialize(),
      power: this.powerGrid.serialize(),
      water: this.water.serialize(),
      spoilage: this.spoilage.serialize(),
      mailbox: this.mailbox.serialize() as SaveBlob["mailbox"],
      worldClock: this.worldClock.serialize(),
      worldDayAccum: this.worldDayAccum,
      stats: this.stats.serialize(),
      journal: this.journal.serialize(),
      reputation: this.reputation.serialize(),
      npcs: this.npcs.serialize(),
      raids: this.raids.serialize(),
      contracts: this.contracts.serialize(),
      groundLoot: this.groundLoot.serialize(),
      worldContainers: Object.freeze(containers),
      settings: I18N.serializeSettings(),
      locale: I18N.currentLocale,
      character: CHARACTER_PROFILE.snapshot,
      calibration: JSON.parse(JSON.stringify(this.config)) as import("../config/calibrationConfig").CalibrationConfig,
      vehicle: this.vehicle.serialize(),
      dungeonResets: this.dungeonResets.serialize(),
      worldEvents: this.worldEvents.serialize(),
      deathBags: this.deathBags.serialize(),
      statusEffects: this.status.serialize(),
      locks: this.locks.serialize(),
      greyhavenVisits: this.greyhavenVisits,
      campfireQueue: this.stations.queueOf("campfire").serialize(),
      stations: this.stations.serialize(),
      sneakActive: this.sneak.isSneaking,
      zoneVisitRemaining: this.zoneTimer.serialize(),
      harvestResources: this.world.serializeHarvestState(),
    }) as unknown as SaveBlob;
  }

  private applySave(blob: SaveBlob): void {
    this.clearInventoryCompletely();

    // Preferences: live keys are primary. Restore from blob when present so exports/loads stay intact.
    // New Game never calls applySave, so menu preference changes survive a soft wipe of progress-only.
    if (blob.settings) {
      I18N.replaceSettings(blob.settings);
    }
    if (blob.locale) {
      I18N.setLocale(blob.locale);
    }
    if (blob.character) {
      CHARACTER_PROFILE.patch(blob.character);
    }
    if (blob.calibration) {
      try {
        const next = blob.calibration;
        Object.assign(this.config.camera, next.camera);
        Object.assign(this.config.player, next.player);
        Object.assign(this.config.world, next.world);
        Object.assign(this.config.lighting, next.lighting);
        Object.assign(this.config.interaction, next.interaction);
        Object.assign(this.config.harvesting, next.harvesting);
        Object.assign(this.config.visual, next.visual);
        localStorage.setItem(GAME_CONFIG.localStorageKey, JSON.stringify(this.config));
        this.applyCalibration();
      } catch { /* keep runtime calibration */ }
    }

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
      const stacks = deserializeStacks(entry);
      if (stacks.length === 0) continue;
      if ("index" in entry && typeof (entry as SerializedInventorySlot).index === "number") {
        indexed.push({ index: (entry as SerializedInventorySlot).index, stack: stacks[0]! });
        for (let i = 1; i < stacks.length; i += 1) ordered.push(stacks[i]!);
      } else {
        for (const stack of stacks) ordered.push(stack);
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
      if (stack) this.quickSlots[0].assignIfAccepted(stack, () => true);
    }
    if (blob.quick2) {
      const stack = deserializeStack(blob.quick2);
      if (stack) this.quickSlots[1].assignIfAccepted(stack, () => true);
    }
    if (blob.utility) {
      const stack = deserializeStack(blob.utility);
      if (stack) this.utilitySlot.equipIfAccepted(stack, () => true);
    }
    this.syncHeldWeaponVisual();

    this.experience.load(blob.xp);
    this.skills.load(blob.skills ?? {});
    this.syncSkillEffects();
    this.player.health.setCurrent(blob.health);
    this.hunger.set(blob.hunger);
    this.thirst.set(blob.thirst);
    this.energy.set(blob.energy);
    if (typeof blob.cold === "number") this.cold.set(blob.cold);

    if (blob.locations) this.locations.load(blob.locations as Partial<ReturnType<LocationManager["serialize"]>>);
    this.locations.forceSet(blob.locationId);
    if (blob.bunkerAccess) this.locations.grantBunkerAccess();
    for (const id of blob.unlockedLocations ?? []) this.locations.unlock(id);

    if (blob.position && Number.isFinite(blob.position.x) && Number.isFinite(blob.position.z)) {
      this.player.visual.root.position.set(blob.position.x, blob.position.y ?? 0, blob.position.z);
      this.player.stopMovement();
    }
    if (typeof blob.facingYaw === "number" && Number.isFinite(blob.facingYaw)) {
      this.player.visual.root.rotation.y = blob.facingYaw;
    }

    if (blob.quests) this.quests.load(blob.quests as { tracked?: string; progress?: Record<string, number>; completed?: string[] });
    if (blob.achievements) this.achievements.load(blob.achievements);
    this.blueprints.load(blob.learnedBlueprints);
    if (blob.farming) this.farming.load(blob.farming as Parameters<FarmingSystem["load"]>[0]);
    if (blob.building) {
      this.building.load(blob.building as Parameters<BuildingRegistry["load"]>[0]);
      this.buildingPresentation.sync(this.building);
    } else {
      this.building.clear();
      this.buildingPresentation.sync(this.building);
    }
    if (blob.power) this.powerGrid.load(blob.power as { storage?: number; devices?: import("../base/PowerGrid").PowerDevice[] });
    else this.powerGrid.resetToDefaults();
    if (blob.water) this.water.load(blob.water as { dirty?: number; clean?: number; pump?: boolean; purifier?: boolean });
    else this.water.load(undefined);
    this.spoilage.load(blob.spoilage);
    if (blob.mailbox) this.mailbox.load(blob.mailbox);
    else this.mailbox.load([]);
    if (typeof blob.worldClock === "number") this.worldClock.load(blob.worldClock);
    this.wasNight = this.worldClock.isNight;
    if (typeof blob.worldDayAccum === "number") this.worldDayAccum = blob.worldDayAccum;
    if (blob.stats) this.stats.load(blob.stats);
    if (blob.journal) this.journal.load(blob.journal);
    else this.journal.load({});
    if (blob.reputation) this.reputation.load(blob.reputation);
    else this.reputation.load({});
    if (blob.npcs) this.npcs.load(blob.npcs);
    else this.npcs.load({ tokens: 0 });
    if (blob.raids) this.raids.load(blob.raids as Parameters<RaidSystem["load"]>[0]);
    else {
      this.raids.load([]);
      this.raids.generate(1001, 2);
      this.raids.generate(1002, 3);
      this.raids.generate(1003, 4);
    }
    this.syncRaidLocationUnlocks();
    this.activeRaidSiteId = null;
    if (blob.contracts) this.contracts.load(blob.contracts as { active?: import("../contracts/ContractSystem").ContractDef[]; nextId?: number; lastRefreshDay?: number });
    else this.contracts.load(undefined);

    this.vehicle.load(blob.vehicle as Parameters<VehicleSystem["load"]>[0]);
    this.syncVehicleTravelUnlock();
    this.dungeonResets.load(blob.dungeonResets as Parameters<DungeonResetSystem["load"]>[0]);
    this.worldEvents.load((blob.worldEvents ?? []) as Parameters<WorldEventDirector["load"]>[0]);
    this.syncEventCaravans();
    this.deathBags.load(blob.deathBags);
    this.status.load(blob.statusEffects as Parameters<StatusEffectSystem["load"]>[0]);
    this.locks.load(blob.locks);
    this.stations.load({
      campfire: blob.stations?.campfire,
      woodworking: blob.stations?.woodworking,
      furnace: blob.stations?.furnace,
      metalwork: blob.stations?.metalwork,
      chemistry: blob.stations?.chemistry,
      water: blob.stations?.water,
      composter: blob.stations?.composter,
      recycler: blob.stations?.recycler,
      legacyCampfire: blob.campfireQueue,
    });
    this.greyhavenVisits = Math.max(0, Math.floor(blob.greyhavenVisits ?? 0));
    if (blob.sneakActive) {
      this.sneak.setActive(true);
      this.hud.setSneakActive(true);
    } else {
      this.sneak.setActive(false);
      this.hud.setSneakActive(false);
    }

    // Zone visit clock: restore exact remaining when present; otherwise start a fresh budget.
    if (blob.zoneVisitRemaining !== undefined) {
      this.zoneTimer.load(blob.zoneVisitRemaining);
      this.zoneForceExitLatched = blob.zoneVisitRemaining === 0;
    } else {
      this.zoneTimer.start(this.locations.currentDefinition);
      this.zoneForceExitLatched = false;
    }
    this.hud.setZoneTimer(this.zoneTimer.remaining);

    // Ground piles + chests — empty arrays are intentional (player looted everything).
    // Only missing/undefined fields re-seed starter world loot for pre-v3 saves.
    this.clearWorldLootAndContainers();
    if (Array.isArray(blob.groundLoot)) {
      for (const entry of blob.groundLoot) {
        const stack = deserializeStack(entry);
        if (!stack) continue;
        this.groundLoot.restoreEntity(entry.id, stack, Object.freeze({ x: entry.x, y: entry.y, z: entry.z }));
      }
    } else {
      spawnStarterGroundResources(this.groundLoot);
      this.spawnStarterGroundMats();
    }
    if (Array.isArray(blob.worldContainers)) {
      this.restoreWorldContainers(blob.worldContainers);
    } else {
      this.spawnStarterSupplyCrate();
    }
    this.ensureHomeServiceInteractables();
    this.ensureCampNpcInteractables();
    this.ensureLockedSitePresence();
    // Station props for placed furniture (chests come from worldContainers).
    this.syncBuiltPieceInteractables();

    const theme = this.world.applyLocationVisual(blob.locationId);
    this.lighting.applyLocationTheme(theme);
    this.nearFire = blob.locationId === "home" || theme.showCampfire;
    // Keep harvested trees/rocks as saved (layout would re-enable otherwise).
    this.loadedHarvestResources = blob.harvestResources
      ? Object.freeze(blob.harvestResources.map((r) => Object.freeze({ ...r })))
      : null;
    this.world.restoreHarvestState(this.loadedHarvestResources);
    this.totalPlaytimeSec = blob.playtimeSec ?? 0;
    this.sessionPlaytimeSec = 0;
    this.applyUserSettingsRuntime();
    this.equipmentVisual.resync();
    this.syncHeldWeaponVisual();
    this.hud.setStatusEffects(this.status.ids());
    this.camera.clearShake();
    this.camera.snapTo(this.player.position);
    this.syncDeathBagWorldPresence();
  }

  /**
   * Write current session to localStorage.
   * Periodic autosave no longer depends on a re-checked timer (previous bug skipped every tick).
   */
  private persistSave(notifyUser: boolean): void {
    if (!this.gameStarted || this.saveHydrating) return;
    const blob = this.buildSaveBlob();
    if (!this.shouldWriteSaveBlob(blob)) return;
    const ok = SAVE_SYSTEM.save(blob);
    if (notifyUser) this.notify.push(ok ? I18N.t("notify.saved") : I18N.t("notify.saveFailed"), ok ? "success" : "error");
  }

  /** Never clobber a rich on-disk loadout with an accidental mid-wipe empty snapshot. */
  private shouldWriteSaveBlob(blob: SaveBlob): boolean {
    const next = this.countSerializedLoadout(blob);
    if (next > 0) return true;
    if (this.player.health.dead || this.deathHandled) return true;
    const prev = SAVE_SYSTEM.load();
    if (!prev) return true;
    if (this.countSerializedLoadout(prev) > 0) {
      console.warn("[Game.persistSave] refused empty loadout overwrite of existing save");
      return false;
    }
    return true;
  }

  private countSerializedLoadout(blob: SaveBlob): number {
    let n = blob.inventory?.length ?? 0;
    if (blob.equipment) {
      for (const v of Object.values(blob.equipment)) if (v) n += 1;
    }
    if (blob.weapon) n += 1;
    if (blob.backpack) n += 1;
    if (blob.utility) n += 1;
    if (blob.quick) n += 1;
    if (blob.quick2) n += 1;
    return n;
  }

  /** Coalesce rapid inventory/equip changes into one write within ~0.4s. */
  private queueAutosaveSoon(): void {
    if (!this.gameStarted) return;
    // Keep short so reloads right after actions still flush full progress.
    if (this.deferredSaveTimer <= 0 || this.deferredSaveTimer > 0.4) {
      this.deferredSaveTimer = 0.4;
    }
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
      if (this.inventoryPanel.isOpen || this.craftingPanel.isOpen || this.mapPanel.isOpen
        || this.stationPanel.isOpen || this.containerPanel.isOpen || this.vehiclePanel.isOpen
        || this.contractPanel.isOpen || this.npcPanel.isOpen || this.skillsPanel.isOpen
        || this.journalPanel.isOpen || this.achievementsPanel.isOpen || this.questsPanel.isOpen) {
        this.inventoryPanel.close();
        this.craftingPanel.close();
        this.mapPanel.close();
        this.stationPanel.close();
        this.containerPanel.close();
        this.vehiclePanel.close();
        this.contractPanel.close();
        this.npcPanel.close();
        this.skillsPanel.close();
        this.journalPanel.close();
        this.achievementsPanel.close();
        this.questsPanel.close();
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
      if (reload && !reload.accepted && reload.reason === "no-ammo") this.notify.push(I18N.t("notify.noAmmo"), "warn");
      return;
    }
    if (event.code === "KeyK" && !event.repeat) {
      event.preventDefault();
      if (this.player.health.dead) return;
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.stationPanel.close();
      this.vehiclePanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.containerPanel.close();
      this.journalPanel.close();
      this.achievementsPanel.close();
      this.questsPanel.close();
      this.skillsPanel.toggle();
      return;
    }
    if (event.code === "KeyJ" && !event.repeat) {
      event.preventDefault();
      if (this.player.health.dead) return;
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.stationPanel.close();
      this.vehiclePanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.containerPanel.close();
      this.skillsPanel.close();
      this.achievementsPanel.close();
      this.questsPanel.close();
      this.journalPanel.toggle();
      return;
    }
    if (event.code === "KeyY" && !event.repeat) {
      event.preventDefault();
      if (this.player.health.dead) return;
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.stationPanel.close();
      this.vehiclePanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.containerPanel.close();
      this.skillsPanel.close();
      this.journalPanel.close();
      this.questsPanel.close();
      this.achievementsPanel.toggle();
      return;
    }
    if (event.code === "KeyQ" && !event.repeat) {
      event.preventDefault();
      if (this.player.health.dead) return;
      this.inventoryPanel.close();
      this.craftingPanel.close();
      this.mapPanel.close();
      this.stationPanel.close();
      this.vehiclePanel.close();
      this.contractPanel.close();
      this.npcPanel.close();
      this.containerPanel.close();
      this.skillsPanel.close();
      this.journalPanel.close();
      this.achievementsPanel.close();
      this.questsPanel.toggle();
      return;
    }
    if (event.code === "Digit1" && !event.repeat) { event.preventDefault(); this.useQuickSlot(0); return; }
    if (event.code === "Digit2" && !event.repeat) { event.preventDefault(); this.useQuickSlot(1); return; }
    if (event.code === "KeyU" && !event.repeat) { event.preventDefault(); this.toggleUtilityTorch(); return; }
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
