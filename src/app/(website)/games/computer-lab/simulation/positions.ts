"use client";

import type { SimComponentLayout, BusPath } from "./types";

export const COMPONENT_LAYOUT: SimComponentLayout[] = [
  { id: "keyboard", x: 2, y: 72, w: 28, h: 18, spriteKey: "keyboard", labelKey: "component.keyboard", glowColor: "#4A90D9", maxIO: 30 },
  { id: "mouse", x: 32, y: 76, w: 10, h: 10, spriteKey: "mouse", labelKey: "component.mouse", glowColor: "#4A90D9", maxIO: 5 },
  { id: "pccase", x: 14, y: 12, w: 32, h: 56, spriteKey: "pccase", labelKey: "component.pccase", glowColor: "#222222", maxIO: 0 },
  { id: "cpu", x: 17, y: 18, w: 12, h: 10, spriteKey: "cpu", labelKey: "component.cpu", glowColor: "#F5A623", maxIO: 400 },
  { id: "gpu", x: 17, y: 30, w: 12, h: 8, spriteKey: "gpu", labelKey: "component.gpu", glowColor: "#7ED321", maxIO: 200 },
  { id: "ram", x: 30, y: 18, w: 10, h: 10, spriteKey: "ram", labelKey: "component.ram", glowColor: "#50E3C2", maxIO: 800 },
  { id: "ssd", x: 30, y: 30, w: 10, h: 6, spriteKey: "ssd", labelKey: "component.ssd", glowColor: "#9013FE", maxIO: 350 },
  { id: "hdd", x: 30, y: 38, w: 10, h: 6, spriteKey: "hdd", labelKey: "component.hdd", glowColor: "#F8E71C", maxIO: 80 },
  { id: "psu", x: 18, y: 60, w: 14, h: 6, spriteKey: "psu", labelKey: "component.psu", glowColor: "#D0021B", maxIO: 0 },
  { id: "fan", x: 25, y: 14, w: 8, h: 4, spriteKey: "fan", labelKey: "component.fan", glowColor: "#888888", maxIO: 0 },
  { id: "motherboard", x: 16, y: 16, w: 28, h: 50, spriteKey: "motherboard", labelKey: "component.motherboard", glowColor: "#4A4A4A", maxIO: 0 },
  { id: "monitor", x: 62, y: 10, w: 36, h: 50, spriteKey: "monitor", labelKey: "component.monitor", glowColor: "#4A90D9", maxIO: 100 },
];

export const BUS_PATHS: BusPath[] = [
  {
    id: "bus_keyboard_cpu",
    fromId: "keyboard",
    toId: "cpu",
    waypoints: [{ x: 16, y: 68 }, { x: 16, y: 23 }],
    bidirectional: false,
    color: "#4A90D9",
    laneCount: 1,
    bandwidthPerLane: 10,
    caseBoundaryProgress: 0.20,
  },
  {
    id: "bus_cpu_ram",
    fromId: "cpu",
    toId: "ram",
    waypoints: [{ x: 29, y: 23 }],
    bidirectional: true,
    color: "#50E3C2",
    laneCount: 4,
    bandwidthPerLane: 100,
    caseBoundaryProgress: 1,
  },
  {
    id: "bus_cpu_gpu",
    fromId: "cpu",
    toId: "gpu",
    waypoints: [{ x: 23, y: 28.5 }],
    bidirectional: true,
    color: "#7ED321",
    laneCount: 2,
    bandwidthPerLane: 50,
    caseBoundaryProgress: 1,
  },
  {
    id: "bus_cpu_ssd",
    fromId: "cpu",
    toId: "ssd",
    waypoints: [{ x: 35, y: 23 }],
    bidirectional: true,
    color: "#9013FE",
    laneCount: 2,
    bandwidthPerLane: 80,
    caseBoundaryProgress: 1,
  },
  {
    id: "bus_cpu_hdd",
    fromId: "cpu",
    toId: "hdd",
    waypoints: [{ x: 35, y: 24 }],
    bidirectional: true,
    color: "#F8E71C",
    laneCount: 1,
    bandwidthPerLane: 30,
    caseBoundaryProgress: 1,
  },
  {
    id: "bus_monitor_output",
    fromId: "cpu",
    toId: "monitor",
    waypoints: [{ x: 46, y: 23 }, { x: 80, y: 23 }],
    bidirectional: false,
    color: "#D0021B",
    laneCount: 2,
    bandwidthPerLane: 40,
    caseBoundaryProgress: 0.33,
  },
  {
    id: "bus_gpu_monitor",
    fromId: "gpu",
    toId: "monitor",
    waypoints: [{ x: 46, y: 34 }, { x: 80, y: 34 }],
    bidirectional: false,
    color: "#7ED321",
    laneCount: 1,
    bandwidthPerLane: 50,
    caseBoundaryProgress: 0.33,
  },
];

function getComponentCenter(id: string): { x: number; y: number } {
  const comp = COMPONENT_LAYOUT.find((c) => c.id === id);
  if (!comp) return { x: 50, y: 50 };
  return { x: comp.x + comp.w / 2, y: comp.y + comp.h / 2 };
}

export function getBusPathPoints(bus: BusPath): { x: number; y: number }[] {
  const from = getComponentCenter(bus.fromId);
  const to = getComponentCenter(bus.toId);
  return [from, ...bus.waypoints, to];
}

export function getBusCornerPoints(bus: BusPath): { x: number; y: number }[] {
  return bus.waypoints;
}
