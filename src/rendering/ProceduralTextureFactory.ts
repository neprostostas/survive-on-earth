import { DynamicTexture } from "@babylonjs/core/Materials/Textures/dynamicTexture";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";
import type { Scene } from "@babylonjs/core/scene";
import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";

type DrawContext = ReturnType<DynamicTexture["getContext"]>;

export class ProceduralTextureFactory {
  constructor(private readonly scene: Scene) {}

  createGroundTexture(detail: number, dirtIntensity: number): DynamicTexture {
    const texture = new DynamicTexture("GeneratedGroundColor", 1024, this.scene, true);
    texture.wrapU = Texture.CLAMP_ADDRESSMODE;
    texture.wrapV = Texture.CLAMP_ADDRESSMODE;
    this.drawGround(texture.getContext(), texture.getSize().width, detail, dirtIntensity);
    texture.update(false);
    return texture;
  }

  redrawGround(texture: DynamicTexture, detail: number, dirtIntensity: number): void {
    this.drawGround(texture.getContext(), texture.getSize().width, detail, dirtIntensity);
    texture.update(false);
  }

  createGroundDetailTexture(): DynamicTexture {
    const size = 256;
    const texture = new DynamicTexture("GeneratedGroundDetail", size, this.scene, true);
    const context = texture.getContext();
    const rng = this.random(8127);
    context.fillStyle = "rgb(128,128,255)";
    context.fillRect(0, 0, size, size);
    for (let i = 0; i < 2200; i += 1) {
      const red = 118 + Math.floor(rng() * 21);
      const green = 118 + Math.floor(rng() * 21);
      const blue = 238 + Math.floor(rng() * 18);
      const radius = 0.4 + rng() * 1.8;
      context.fillStyle = `rgb(${red},${green},${blue})`;
      context.beginPath();
      context.arc(rng() * size, rng() * size, radius, 0, Math.PI * 2);
      context.fill();
    }
    texture.update(false);
    texture.uScale = 12;
    texture.vScale = 12;
    return texture;
  }

  createWoodTexture(): DynamicTexture {
    const size = 256;
    const texture = new DynamicTexture("GeneratedWood", size, this.scene, true);
    const context = texture.getContext();
    const rng = this.random(441);
    context.fillStyle = "#755335";
    context.fillRect(0, 0, size, size);
    for (let y = 0; y < size; y += 32) {
      context.fillStyle = y % 64 === 0 ? "#68482e" : "#7c5838";
      context.fillRect(0, y, size, 30);
      context.fillStyle = "rgba(40,25,16,.42)";
      context.fillRect(0, y + 29, size, 3);
      for (let i = 0; i < 14; i += 1) {
        const x = rng() * size;
        context.strokeStyle = `rgba(45,28,17,${0.1 + rng() * 0.14})`;
        context.beginPath();
        context.moveTo(x, y + 3);
        context.lineTo(x + 5, y + 10);
        context.lineTo(x - 3, y + 19);
        context.lineTo(x + 13, y + 27);
        context.stroke();
      }
    }
    texture.update(false);
    texture.uScale = 2;
    texture.vScale = 2;
    return texture;
  }

  createBarkTexture(): DynamicTexture {
    const size = 256;
    const texture = new DynamicTexture("GeneratedBark", size, this.scene, true);
    const context = texture.getContext();
    const rng = this.random(919);
    context.fillStyle = "#513821";
    context.fillRect(0, 0, size, size);
    for (let i = 0; i < 110; i += 1) {
      const x = rng() * size;
      context.strokeStyle = `rgba(${45 + Math.floor(rng() * 28)},${28 + Math.floor(rng() * 20)},16,${0.28 + rng() * 0.3})`;
      context.lineWidth = 1 + rng() * 3;
      context.beginPath();
      context.moveTo(x, -4);
      context.lineTo(x + rng() * 12 - 6, 82);
      context.lineTo(x + rng() * 16 - 8, 168);
      context.lineTo(x + rng() * 12 - 6, 260);
      context.stroke();
    }
    texture.update(false);
    texture.uScale = 2.5;
    texture.vScale = 1.3;
    return texture;
  }

  createSoftCircleTexture(): DynamicTexture {
    const size = 128;
    const texture = new DynamicTexture("GeneratedSoftCircle", size, this.scene, false);
    const context = texture.getContext();
    context.clearRect(0, 0, size, size);
    const gradient = context.createRadialGradient(size / 2, size / 2, 2, size / 2, size / 2, size / 2);
    gradient.addColorStop(0, "rgba(255,255,255,.9)");
    gradient.addColorStop(0.55, "rgba(255,255,255,.5)");
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);
    texture.hasAlpha = true;
    texture.update(false);
    return texture;
  }

  private drawGround(context: DrawContext, size: number, detail: number, dirtIntensity: number): void {
    const rng = this.random(202603);
    context.fillStyle = "#667249";
    context.fillRect(0, 0, size, size);

    const broadMarks = Math.floor(260 * detail);
    for (let i = 0; i < broadMarks; i += 1) {
      const green = 94 + Math.floor(rng() * 26);
      const radius = 10 + rng() * 48;
      context.fillStyle = `rgba(${green - 26},${green},${58 + Math.floor(rng() * 16)},${0.025 + rng() * 0.05})`;
      context.beginPath();
      context.arc(rng() * size, rng() * size, radius * (0.55 + rng() * 0.45), 0, Math.PI * 2);
      context.fill();
    }

    const patches = [[-8,4,3.2],[5,7,2.4],[13,-2,2.8],[-14,-11,2.1],[1,-13,2.7],[-4,0,1.8],[9,-8,2.2]];
    for (const [worldX, worldZ, worldRadius] of patches) {
      const x = (worldX / 56 + 0.5) * size;
      const y = (0.5 - worldZ / 56) * size;
      const radius = worldRadius / 56 * size * 2.2;
      const gradient = context.createRadialGradient(x, y, radius * 0.08, x, y, radius);
      const variation = Math.min(1, dirtIntensity) * 0.14;
      gradient.addColorStop(0, `rgba(65,96,47,${variation})`);
      gradient.addColorStop(0.52, `rgba(82,109,55,${variation * 0.65})`);
      gradient.addColorStop(1, "rgba(78,105,52,0)");
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }

    const speckles = Math.floor(1500 * detail);
    for (let i = 0; i < speckles; i += 1) {
      const alpha = 0.025 + rng() * 0.07;
      context.fillStyle = rng() > 0.25 ? `rgba(40,72,33,${alpha * 0.8})` : `rgba(116,137,72,${alpha * 0.5})`;
      context.fillRect(rng() * size, rng() * size, 1 + rng() * 2.5, 1 + rng() * 2.5);
    }
  }

  private random(seed: number): () => number {
    let state = seed >>> 0;
    return () => {
      state = (state * 1664525 + 1013904223) >>> 0;
      return state / 0x100000000;
    };
  }
}
