"use client";

import type { SimStep } from "./types";

export interface StepMeta {
  id: SimStep;
  labelKey: string;
  componentId: string | null;
  isProcessing: boolean;
}

export const STEP_ORDER: SimStep[] = [
  "idle",
  "input",
  "cpu_fetch",
  "cpu_decode",
  "cpu_execute",
  "ram_read",
  "ram_write",
  "storage_read",
  "storage_write",
  "cpu_finalize",
  "output_send",
  "output_display",
];

export const STEP_META: Record<SimStep, StepMeta> = {
  idle: { id: "idle", labelKey: "step.idle", componentId: null, isProcessing: false },
  input: { id: "input", labelKey: "step.input", componentId: "keyboard", isProcessing: true },
  cpu_fetch: { id: "cpu_fetch", labelKey: "step.cpu_fetch", componentId: "cpu", isProcessing: true },
  cpu_decode: { id: "cpu_decode", labelKey: "step.cpu_decode", componentId: "cpu", isProcessing: true },
  cpu_execute: { id: "cpu_execute", labelKey: "step.cpu_execute", componentId: "cpu", isProcessing: true },
  ram_read: { id: "ram_read", labelKey: "step.ram_read", componentId: "ram", isProcessing: true },
  ram_write: { id: "ram_write", labelKey: "step.ram_write", componentId: "ram", isProcessing: true },
  storage_read: { id: "storage_read", labelKey: "step.storage_read", componentId: "ssd", isProcessing: true },
  storage_write: { id: "storage_write", labelKey: "step.storage_write", componentId: "ssd", isProcessing: true },
  cpu_finalize: { id: "cpu_finalize", labelKey: "step.cpu_finalize", componentId: "cpu", isProcessing: true },
  output_send: { id: "output_send", labelKey: "step.output_send", componentId: "monitor", isProcessing: true },
  output_display: { id: "output_display", labelKey: "step.output_display", componentId: "monitor", isProcessing: false },
};

export function getNextStep(current: SimStep): SimStep {
  const idx = STEP_ORDER.indexOf(current);
  if (idx < 0 || idx >= STEP_ORDER.length - 1) return "idle";
  return STEP_ORDER[idx + 1];
}

export const STEP_TRANSITION_DURATION = 500;
