"use client";

import type { RouteType, DataSize } from "./types";

export type WorkloadType =
  | "calculation"
  | "text"
  | "image"
  | "video"
  | "database"
  | "web"
  | "ml"
  | "compression";

export interface WorkloadPreset {
  type: WorkloadType;
  labelKey: string;
  route: RouteType;
  color: string;
  dataSize: DataSize;
  requireGpu: boolean;
}

export const WORKLOAD_PRESETS: WorkloadPreset[] = [
  { type: "calculation", labelKey: "workload.calculation", route: "compute", color: "#7ED321", dataSize: "byte", requireGpu: false },
  { type: "text", labelKey: "workload.text", route: "compute", color: "#50E3C2", dataSize: "byte", requireGpu: false },
  { type: "image", labelKey: "workload.image", route: "graphics", color: "#F5A623", dataSize: "mb", requireGpu: true },
  { type: "video", labelKey: "workload.video", route: "graphics", color: "#D0021B", dataSize: "mb", requireGpu: true },
  { type: "database", labelKey: "workload.database", route: "storage", color: "#9013FE", dataSize: "kb", requireGpu: false },
  { type: "web", labelKey: "workload.web", route: "compute", color: "#4A90D9", dataSize: "byte", requireGpu: false },
  { type: "ml", labelKey: "workload.ml", route: "graphics", color: "#9B59B6", dataSize: "mb", requireGpu: true },
  { type: "compression", labelKey: "workload.compression", route: "compute", color: "#E67E22", dataSize: "kb", requireGpu: false },
];

export interface WorkloadConfig {
  id: string;
  type: WorkloadType;
  concurrency: number;
  dataSize: DataSize;
  requireGpu: boolean;
  active: boolean;
}

export interface AppConfig {
  id: string;
  nameKey: string;
  spriteKey: string;
  ramCost: number;
  requireGpu: boolean;
  active: boolean;
}

export const SIM_APPS: AppConfig[] = [
  { id: "vscode", nameKey: "app.vscode", spriteKey: "sw_vscode", ramCost: 512, requireGpu: false, active: false },
  { id: "chrome", nameKey: "app.chrome", spriteKey: "sw_chrome", ramCost: 1024, requireGpu: false, active: false },
  { id: "photoshop", nameKey: "app.photoshop", spriteKey: "sw_photoshop", ramCost: 2048, requireGpu: true, active: false },
  { id: "youtube", nameKey: "app.youtube", spriteKey: "sw_youtube", ramCost: 512, requireGpu: false, active: false },
  { id: "discord", nameKey: "app.discord", spriteKey: "sw_discord", ramCost: 256, requireGpu: false, active: false },
  { id: "spotify", nameKey: "app.spotify", spriteKey: "sw_spotify", ramCost: 256, requireGpu: false, active: false },
  { id: "calculator", nameKey: "app.calculator", spriteKey: "sw_calculator", ramCost: 32, requireGpu: false, active: false },
  { id: "minecraft", nameKey: "app.minecraft", spriteKey: "sw_minecraft", ramCost: 2048, requireGpu: true, active: false },
];
