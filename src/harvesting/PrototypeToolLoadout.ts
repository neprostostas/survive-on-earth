import type { HarvestTool } from "./HarvestingTypes";

export interface HarvestToolAvailability {
  hasTool(tool: HarvestTool): boolean;
}

export class PrototypeToolLoadout implements HarvestToolAvailability {
  private readonly available: Record<HarvestTool, boolean> = { hatchet: true, pickaxe: true };

  hasTool(tool: HarvestTool): boolean { return this.available[tool]; }
  setTool(tool: HarvestTool, available: boolean): void { this.available[tool] = available; }
}
