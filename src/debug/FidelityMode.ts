type ComparisonMode = "overlay" | "current" | "reference" | "blink" | "split";
type FitMode = "viewport" | "width" | "height";

export class FidelityMode {
  private readonly panel: HTMLElement;
  private readonly referenceLayer: HTMLElement;
  private readonly referenceImage: HTMLImageElement;
  private readonly guides: HTMLElement;
  private readonly fileInput: HTMLInputElement;
  private readonly freezeInput: HTMLInputElement;
  private visible = false;
  private objectUrl: string | null = null;
  private mode: ComparisonMode = "overlay";
  private fitMode: FitMode = "viewport";
  private opacity = 0.5;
  private scale = 1;
  private offsetX = 0;
  private offsetY = 0;
  private split = 50;
  private lockAspect = true;
  private blinkTimer: number | null = null;
  private blinkReferenceVisible = true;

  constructor(root: HTMLElement, private readonly onFreezeChange: (frozen: boolean) => void) {
    this.referenceLayer = document.createElement("div");
    this.referenceLayer.className = "fidelity-reference-layer";
    this.referenceImage = document.createElement("img");
    this.referenceImage.alt = "Local LDOE reference screenshot";
    this.referenceLayer.append(this.referenceImage);

    this.guides = document.createElement("div");
    this.guides.className = "fidelity-guides center thirds safe rulers";
    this.guides.innerHTML = `
      <i class="guide-center-v"></i><i class="guide-center-h"></i>
      <i class="guide-third-v first"></i><i class="guide-third-v second"></i>
      <i class="guide-third-h first"></i><i class="guide-third-h second"></i>
      <i class="guide-safe"></i><i class="guide-ruler top"></i><i class="guide-ruler left"></i><i class="guide-split-line"></i>`;
    for (let percentage = 10; percentage < 100; percentage += 10) {
      const topLabel = document.createElement("b");
      topLabel.className = "ruler-label top";
      topLabel.style.left = `${percentage}%`;
      topLabel.textContent = String(percentage);
      const leftLabel = document.createElement("b");
      leftLabel.className = "ruler-label left";
      leftLabel.style.top = `${percentage}%`;
      leftLabel.textContent = String(percentage);
      this.guides.append(topLabel, leftLabel);
    }

    this.panel = document.createElement("aside");
    this.panel.className = "fidelity-panel";
    this.panel.innerHTML = `
      <header><div><small>MILESTONE F1</small><h2>LDOE Fidelity</h2></div><span>F3</span></header>
      <div class="fidelity-scroll">
        <section class="fidelity-file-actions">
          <button type="button" data-action="load">Load reference</button>
          <button type="button" data-action="remove" class="muted">Remove</button>
        </section>
        <label class="fidelity-field"><span>Comparison</span><select data-control="mode">
          <option value="overlay">Overlay</option><option value="current">Current only</option>
          <option value="reference">Reference only</option><option value="blink">Blink</option><option value="split">Split view</option>
        </select></label>
        <label class="fidelity-field"><span>Overlay opacity</span><input data-control="opacity" type="range" min="0" max="1" step="0.01" value="0.5"><output>50%</output></label>
        <label class="fidelity-field"><span>Split position</span><input data-control="split" type="range" min="0" max="100" step="1" value="50"><output>50%</output></label>
        <label class="fidelity-field"><span>Reference scale</span><input data-control="scale" type="range" min="0.25" max="3" step="0.01" value="1"><output>1.00×</output></label>
        <label class="fidelity-field"><span>Offset X</span><input data-control="offset-x" type="range" min="-800" max="800" step="1" value="0"><output>0px</output></label>
        <label class="fidelity-field"><span>Offset Y</span><input data-control="offset-y" type="range" min="-500" max="500" step="1" value="0"><output>0px</output></label>
        <label class="fidelity-field fidelity-check"><input data-control="aspect" type="checkbox" checked><span>Lock aspect ratio</span></label>
        <div class="fidelity-fit-actions">
          <button type="button" data-fit="width">Fit width</button><button type="button" data-fit="height">Fit height</button><button type="button" data-fit="viewport">Fit viewport</button>
        </div>
        <button type="button" class="fidelity-reset" data-action="reset">Reset alignment</button>
        <h3>Guides</h3>
        <div class="fidelity-guide-options">
          <label><input type="checkbox" data-guide="center" checked> Center</label>
          <label><input type="checkbox" data-guide="thirds" checked> Thirds</label>
          <label><input type="checkbox" data-guide="safe" checked> Safe area</label>
          <label><input type="checkbox" data-guide="rulers" checked> % rulers</label>
        </div>
        <label class="fidelity-field fidelity-check freeze"><input data-control="freeze" type="checkbox"><span>Freeze visual motion</span></label>
        <p class="fidelity-note">The selected image stays local and is never added to the project.</p>
      </div>`;

    this.fileInput = document.createElement("input");
    this.fileInput.type = "file";
    this.fileInput.accept = "image/png,image/jpeg,image/webp";
    this.fileInput.hidden = true;
    this.freezeInput = this.require<HTMLInputElement>("[data-control='freeze']");
    root.append(this.referenceLayer, this.guides, this.panel, this.fileInput);
    this.bindControls();
    this.applyReferenceLayout();
    this.applyVisibility();
  }

  get motionFrozen(): boolean { return this.visible && this.freezeInput.checked; }
  get isOpen(): boolean { return this.visible; }

  toggle(): void {
    this.visible = !this.visible;
    if (!this.visible && this.freezeInput.checked) {
      this.freezeInput.checked = false;
      this.onFreezeChange(false);
    }
    this.applyVisibility();
    this.updateBlink();
  }

  private bindControls(): void {
    this.panel.addEventListener("click", (event) => {
      const target = (event.target as HTMLElement).closest<HTMLButtonElement>("button");
      if (!target) return;
      if (target.dataset.action === "load") this.fileInput.click();
      if (target.dataset.action === "remove") this.removeReference();
      if (target.dataset.action === "reset") this.resetAlignment();
      if (target.dataset.fit) {
        this.fitMode = target.dataset.fit as FitMode;
        this.applyReferenceLayout();
      }
    });
    this.fileInput.addEventListener("change", () => {
      const file = this.fileInput.files?.[0];
      if (!file) return;
      if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
      this.objectUrl = URL.createObjectURL(file);
      this.referenceImage.src = this.objectUrl;
      this.referenceImage.dataset.loaded = "true";
      this.applyReferenceLayout();
      this.updateBlink();
      this.fileInput.value = "";
    });
    this.bindRange("opacity", (value) => { this.opacity = value; }, (value) => `${Math.round(value * 100)}%`);
    this.bindRange("split", (value) => { this.split = value; }, (value) => `${Math.round(value)}%`);
    this.bindRange("scale", (value) => { this.scale = value; }, (value) => `${value.toFixed(2)}×`);
    this.bindRange("offset-x", (value) => { this.offsetX = value; }, (value) => `${Math.round(value)}px`);
    this.bindRange("offset-y", (value) => { this.offsetY = value; }, (value) => `${Math.round(value)}px`);
    this.require<HTMLSelectElement>("[data-control='mode']").addEventListener("change", (event) => {
      this.mode = (event.currentTarget as HTMLSelectElement).value as ComparisonMode;
      this.applyReferenceLayout();
      this.updateBlink();
    });
    this.require<HTMLInputElement>("[data-control='aspect']").addEventListener("change", (event) => {
      this.lockAspect = (event.currentTarget as HTMLInputElement).checked;
      this.applyReferenceLayout();
    });
    this.freezeInput.addEventListener("change", () => { this.onFreezeChange(this.motionFrozen); });
    for (const input of this.panel.querySelectorAll<HTMLInputElement>("[data-guide]")) {
      input.addEventListener("change", () => { this.guides.classList.toggle(input.dataset.guide ?? "", input.checked); });
    }
  }

  private bindRange(name: string, set: (value: number) => void, format: (value: number) => string): void {
    const input = this.require<HTMLInputElement>(`[data-control='${name}']`);
    const output = input.parentElement?.querySelector<HTMLOutputElement>("output");
    input.addEventListener("input", () => {
      const value = Number(input.value);
      set(value);
      if (output) output.value = format(value);
      this.applyReferenceLayout();
    });
  }

  private applyVisibility(): void {
    this.panel.classList.toggle("visible", this.visible);
    this.referenceLayer.classList.toggle("fidelity-active", this.visible);
    this.guides.classList.toggle("visible", this.visible);
  }

  private applyReferenceLayout(): void {
    const hasReference = Boolean(this.objectUrl);
    const showReference = this.visible && hasReference && this.mode !== "current";
    this.referenceLayer.classList.toggle("has-reference", showReference);
    this.referenceLayer.classList.toggle("split", this.mode === "split");
    this.guides.classList.toggle("split-mode", this.mode === "split");
    this.guides.style.setProperty("--fidelity-split", `${this.split}%`);
    this.referenceLayer.style.background = this.mode === "reference" ? "#050705" : "transparent";
    this.referenceLayer.style.opacity = String(this.mode === "overlay" ? this.opacity : 1);
    this.referenceLayer.style.clipPath = this.mode === "split" ? `inset(0 ${100 - this.split}% 0 0)` : "none";
    this.referenceImage.style.transform = `translate(-50%, -50%) translate(${this.offsetX}px, ${this.offsetY}px) scale(${this.scale})`;
    this.referenceImage.style.objectFit = this.lockAspect ? "contain" : "fill";
    if (this.fitMode === "width") {
      this.referenceImage.style.width = "100%";
      this.referenceImage.style.height = this.lockAspect ? "auto" : "100%";
    } else if (this.fitMode === "height") {
      this.referenceImage.style.width = this.lockAspect ? "auto" : "100%";
      this.referenceImage.style.height = "100%";
    } else {
      this.referenceImage.style.width = "100%";
      this.referenceImage.style.height = "100%";
    }
    if (this.mode !== "blink") this.referenceImage.style.visibility = "visible";
  }

  private updateBlink(): void {
    if (this.blinkTimer !== null) {
      window.clearInterval(this.blinkTimer);
      this.blinkTimer = null;
    }
    this.blinkReferenceVisible = true;
    this.referenceImage.style.visibility = "visible";
    if (!this.visible || !this.objectUrl || this.mode !== "blink") return;
    this.blinkTimer = window.setInterval(() => {
      this.blinkReferenceVisible = !this.blinkReferenceVisible;
      this.referenceImage.style.visibility = this.blinkReferenceVisible ? "visible" : "hidden";
    }, 450);
  }

  private resetAlignment(): void {
    this.opacity = 0.5; this.scale = 1; this.offsetX = 0; this.offsetY = 0; this.split = 50; this.fitMode = "viewport"; this.lockAspect = true;
    const values: Record<string, string> = { opacity: "0.5", scale: "1", "offset-x": "0", "offset-y": "0", split: "50" };
    for (const [name, value] of Object.entries(values)) {
      const input = this.require<HTMLInputElement>(`[data-control='${name}']`);
      input.value = value;
      input.dispatchEvent(new Event("input"));
    }
    this.require<HTMLInputElement>("[data-control='aspect']").checked = true;
    this.applyReferenceLayout();
  }

  private removeReference(): void {
    if (this.objectUrl) URL.revokeObjectURL(this.objectUrl);
    this.objectUrl = null;
    this.referenceImage.removeAttribute("src");
    delete this.referenceImage.dataset.loaded;
    this.applyReferenceLayout();
    this.updateBlink();
  }

  private require<T extends Element>(selector: string): T {
    const element = this.panel.querySelector<T>(selector);
    if (!element) throw new Error(`Fidelity control is missing: ${selector}`);
    return element;
  }
}
