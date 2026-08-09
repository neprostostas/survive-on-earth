export class HUD {
  readonly joystick: HTMLElement;
  readonly primaryAction: HTMLButtonElement;

  constructor(root: HTMLElement) {
    root.innerHTML = `
      <div class="hud" aria-label="Gameplay HUD">
        <section class="player-status">
          <div class="avatar">S</div>
          <div class="status-copy">
            <span class="player-name">SURVIVOR</span>
            <div class="hp-track"><div class="hp-fill"></div><span>100</span></div>
          </div>
        </section>
        <div class="joystick" aria-label="Movement joystick"><div class="joystick-ring"></div><div class="joystick-knob"></div></div>
        <div class="actions">
          <button class="action secondary" aria-label="Secondary action">✦</button>
          <button class="action primary" aria-label="Primary action">●</button>
        </div>
        <div class="key-hints"><b>E</b> ACTION &nbsp; <b>F1</b> CALIBRATION &nbsp; <b>F2</b> DEBUG</div>
      </div>`;
    const joystick = root.querySelector<HTMLElement>(".joystick");
    if (!joystick) throw new Error("HUD joystick failed to mount");
    const primaryAction = root.querySelector<HTMLButtonElement>(".action.primary");
    if (!primaryAction) throw new Error("HUD primary action failed to mount");
    this.joystick = joystick;
    this.primaryAction = primaryAction;
  }

  setPrimaryActionAvailable(available: boolean): void {
    this.primaryAction.classList.toggle("available", available);
    this.primaryAction.setAttribute("aria-label", available ? "Interact with selected target" : "No interaction target nearby");
    this.primaryAction.setAttribute("aria-disabled", String(!available));
  }
}
