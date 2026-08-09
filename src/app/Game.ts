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
    this.hud = new HUD(uiRoot);
    this.resultFeedback = new ResourceResultFeedback(uiRoot, this.scene, this.engine);
    this.input = new InputController(this.hud.joystick, this.hud.primaryAction, GAME_CONFIG.joystickDeadZone);
    this.interaction = new InteractionSystem(this.scene, this.world.interactables, this.config);
    this.harvesting = new HarvestingSystem(this.config, this.prototypeTools, this.player, this.interaction, this.resultFeedback, (resource) => {
      this.world.removeResourceCollision(resource.resourceId);
    });
    this.debug = new DebugOverlay(uiRoot, this.scene, this.engine, this.player, this.collision, this.interaction, this.harvesting, this.resultFeedback, this.world, this.postProcessing, this.config);
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
    if (!this.fidelity.motionFrozen) this.player.update(delta, movement, this.camera.screenRight, this.camera.screenUp);
    this.world.update(frameDelta);
    this.interaction.update(frameDelta, this.player.position, this.player.facingYaw);
    if (!this.fidelity.motionFrozen) {
      const harvestingConsumed = this.harvesting.update(delta, action, movement, this.player.position);
      if (action.pressedThisFrame && !harvestingConsumed) {
        this.interaction.tryInteract(this.player.position, (targetPosition) => { this.player.requestFacing(targetPosition); });
      }
    }
    this.hud.updateMinimap(this.player.position, this.player.facingYaw, this.world.interactables);
    const target = this.interaction.target;
    if (target instanceof HarvestableResource) {
      this.hud.setPrimaryActionContext(target.requiredTool, this.prototypeTools.hasTool(target.requiredTool), this.harvesting.state.unavailableFeedback);
    } else this.hud.setPrimaryActionContext(target ? "generic" : "none");
    this.camera.update(frameDelta, this.player.position);
    this.resultFeedback.update(frameDelta);
    this.debug.update();
    this.scene.render();
  }

  private applyCalibration(): void {
    this.player.applyCalibration();
    this.world.applyCalibration();
    this.lighting.applyCalibration();
    this.postProcessing.applyCalibration();
    this.camera.applyProjection();
    this.debug.refreshObstacles();
  }

  private readonly onResize = (): void => { this.engine.resize(); this.camera.applyProjection(); };
  private readonly onFunctionKey = (event: KeyboardEvent): void => {
    if (event.code === "F1") { event.preventDefault(); this.calibration.toggle(); }
    if (event.code === "F2") { event.preventDefault(); this.debug.toggle(); }
    if (event.code === "F3") { event.preventDefault(); this.fidelity.toggle(); }
  };
}
