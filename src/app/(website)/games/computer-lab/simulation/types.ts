"use client";

export type SimStep =
  | "idle"
  | "input"
  | "cpu_fetch"
  | "cpu_decode"
  | "cpu_execute"
  | "ram_read"
  | "ram_write"
  | "storage_read"
  | "storage_write"
  | "cpu_finalize"
  | "output_send"
  | "output_display";

export type PacketShape = "circle" | "square" | "diamond";

export type DataSize = "byte" | "kb" | "mb";

export type VramType = "GDDR5" | "GDDR6" | "GDDR7";

export type RamType = "DDR3" | "DDR4" | "DDR5";

export type BottleneckType =
  | "cpu"
  | "gpu"
  | "ram"
  | "storage_io"
  | "thermal"
  | null;

export type RouteType = "compute" | "storage" | "graphics";

export type PacketStatus =
  | "spawning"
  | "traveling"
  | "comp_queued"
  | "processing"
  | "bus_queued"
  | "disk_full"
  | "swapping"
  | "done";

export interface FlowPacket {
  id: string;
  fromId: string;
  toId: string;
  progress: number;
  status: PacketStatus;
  route: RouteType;
  busId: string | null;
  byteValue: number;
  dataSize: DataSize;
  color: string;
  shape: PacketShape;
  streamId: string;
  sourceInput: string | null;
  isAuto: boolean;
  queueStartTime: number;
  arrivalTime: number;
  laneIndex: number;
}

export interface SimComponentLayout {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
  spriteKey: string;
  labelKey: string;
  glowColor: string;
  maxIO: number;
}

export type ResourceLevel = "light" | "medium" | "heavy";

export type EmergentCrashType = "overheat" | "freeze" | "disk_full" | "bsod" | "slow" | null;

export interface BusPath {
  id: string;
  fromId: string;
  toId: string;
  waypoints: { x: number; y: number }[];
  bidirectional: boolean;
  color: string;
  laneCount: number;
  bandwidthPerLane: number;
  caseBoundaryProgress: number;
}

export interface CpuState {
  cores: number;
  clock: number;
  temp: number;
  tdp: number;
}

export interface GpuState {
  cores: number;
  vram: number;
  vramType: VramType;
  load: number;
  fps: number;
}

export interface RamState {
  sticks: number;
  capacityPerStick: number;
  type: RamType;
  speed: number;
  usage: number;
}

export interface StorageState {
  rwSpeed: number;
  capacity: number;
  usage: number;
}

export interface PsuState {
  wattage: number;
  powerDraw: number;
}

export interface FanState {
  rpm: number;
  cfm: number;
}

export interface Bottleneck {
  type: BottleneckType;
  severity: "mild" | "moderate" | "severe";
  utilPercent: number;
}

export interface FaultState {
  componentId: string;
  severity: "mild" | "severe";
  animationKey: string;
  description: string;
}

export interface StreamTheme {
  color: string;
  name: string;
}

export const STREAM_THEMES: StreamTheme[] = [
  { color: "#7ED321", name: "Stream A" },
  { color: "#F8E71C", name: "Stream B" },
  { color: "#50E3C2", name: "Stream C" },
  { color: "#9013FE", name: "Stream D" },
];

export const MONITOR_APPS: Record<RouteType, { icon: string; name: string }[]> = {
  compute: [
    { icon: "\u{1F4AC}", name: "Messenger" },
    { icon: "\u{1F3AE}", name: "Roblox" },
    { icon: "\u{25B6}", name: "YouTube" },
    { icon: "\u{1F4BB}", name: "VS Code" },
    { icon: "\u{1F4E5}", name: "Download" },
  ],
  storage: [
    { icon: "\u{1F4C1}", name: "File Explorer" },
    { icon: "\u{1F4BE}", name: "Backup" },
    { icon: "\u{1F5C4}", name: "Documents" },
    { icon: "\u{1F4F7}", name: "Photos" },
    { icon: "\u{1F3B5}", name: "Music" },
  ],
  graphics: [
    { icon: "\u{1F3A8}", name: "Photoshop" },
    { icon: "\u{1F3AC}", name: "Premiere" },
    { icon: "\u{1F4F9}", name: "OBS Studio" },
    { icon: "\u{1F3AE}", name: "Game" },
    { icon: "\u{1F4CA}", name: "Blender" },
  ],
};
