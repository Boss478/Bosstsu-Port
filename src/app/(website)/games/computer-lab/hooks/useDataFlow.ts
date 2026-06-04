"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import type { FlowPacket, DataSize, CpuState, GpuState, RamState, StorageState, RouteType, Bottleneck, ResourceLevel } from "../simulation/types";
import { BUS_PATHS } from "../simulation/positions";
import { STREAM_THEMES, MONITOR_APPS } from "../simulation/types";
import type { WorkloadConfig, AppConfig } from "../simulation/workloads";
import { WORKLOAD_PRESETS } from "../simulation/workloads";

interface UseDataFlowProps {
  cpuState: CpuState;
  gpuState: GpuState;
  ramState: RamState;
  ssdState: StorageState;
  hddState: StorageState;
  speed: 0.25 | 0.5 | 1 | 2 | 3;
  isPaused: boolean;
  fanRpm: number;
  workloads: WorkloadConfig[];
  runningApps: AppConfig[];
  concurrency: number;
  dataSize: DataSize;
  resourceLevel: ResourceLevel;
  bottleneck: Bottleneck | null;
  ramTotal: number;
}

interface AppArrival {
  route: RouteType;
  index: number;
  icon: string;
  name: string;
  time: number;
}

interface CrashEvent {
  type: string;
  title: string;
  desc: string;
  fix: string;
}

interface UseDataFlowReturn {
  packets: FlowPacket[];
  resetFlow: () => void;
  lastAppArrivals: AppArrival[];
  cpuTemp: number;
  crashEvent: CrashEvent | null;
  dismissCrash: () => void;
}

let packetCounter = 0;

const ROUTE_HOPS: Record<RouteType, { from: string; to: string; busId: string }[]> = {
  compute: [
    { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
    { from: "cpu", to: "ram", busId: "bus_cpu_ram" },
    { from: "ram", to: "cpu", busId: "bus_cpu_ram" },
    { from: "cpu", to: "monitor", busId: "bus_monitor_output" },
  ],
  storage: [
    { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
    { from: "cpu", to: "ssd", busId: "bus_cpu_ssd" },
    { from: "ssd", to: "cpu", busId: "bus_cpu_ssd" },
    { from: "cpu", to: "monitor", busId: "bus_monitor_output" },
  ],
  graphics: [
    { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
    { from: "cpu", to: "gpu", busId: "bus_cpu_gpu" },
    { from: "gpu", to: "monitor", busId: "bus_gpu_monitor" },
  ],
};

const ROUTE_DISTRIBUTION: { route: RouteType; weight: number }[] = [
  { route: "compute", weight: 40 },
  { route: "storage", weight: 30 },
  { route: "graphics", weight: 30 },
];

const BASE_TRAVEL_MS = 300;
const PROCESSING_MS = 300;

function pickRoute(): RouteType {
  const total = ROUTE_DISTRIBUTION.reduce((s, r) => s + r.weight, 0);
  let roll = Math.random() * total;
  for (const entry of ROUTE_DISTRIBUTION) {
    roll -= entry.weight;
    if (roll <= 0) return entry.route;
  }
  return "compute";
}

function pickStorageComponent(ssdUsage: number, hddUsage: number): string {
  const ssdFull = ssdUsage >= 100;
  const hddFull = hddUsage >= 100;
  if (ssdFull && hddFull) return "ssd";
  if (ssdFull) return "hdd";
  if (hddFull) return "ssd";
  return Math.random() < 0.5 ? "ssd" : "hdd";
}

function computeCpuTemp(cores: number, clock: number, fanRpm: number): number {
  return Math.min(100, Math.round(30 + cores * 2.5 + clock * 4 - fanRpm * 0.3));
}

const RESOURCE_MULTIPLIER: Record<ResourceLevel, number> = {
  light: 1,
  medium: 2,
  heavy: 3,
};

export function useDataFlow({
  cpuState, gpuState, ramState, ssdState, hddState,
  speed, isPaused, fanRpm, workloads, runningApps,
  concurrency, dataSize, resourceLevel, bottleneck, ramTotal,
}: UseDataFlowProps): UseDataFlowReturn {
  const [packets, setPackets] = useState<FlowPacket[]>([]);
  const [lastAppArrivals, setLastAppArrivals] = useState<AppArrival[]>([]);
  const [crashEvent, setCrashEvent] = useState<CrashEvent | null>(null);

  const packetsRef = useRef<FlowPacket[]>([]);
  const frameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const speedRef = useRef<0.25 | 0.5 | 1 | 2 | 3>(1);
  const isPausedRef = useRef(false);
  const concurrencyRef = useRef(concurrency);
  const dataSizeRef = useRef<DataSize>(dataSize);
  const resourceMultRef = useRef<number>(1);
  const cpuTempRef = useRef(50);
  const ramUsageRef = useRef(ramState.usage);
  const ssdUsageRef = useRef(ssdState.usage);
  const hddUsageRef = useRef(hddState.usage);
  const componentQueuesRef = useRef<Record<string, FlowPacket[]>>({});
  const busOccupancyRef = useRef<Record<string, number>>({});
  const appArrivalsRef = useRef<AppArrival[]>([]);
  const routeTypeCountersRef = useRef<Record<RouteType, number>>({ compute: 0, storage: 0, graphics: 0 });
  const workloadsRef = useRef<WorkloadConfig[]>(workloads);
  const runningAppsRef = useRef<AppConfig[]>(runningApps);
  const bottleneckRef = useRef<Bottleneck | null>(bottleneck);
  const crashTimersRef = useRef<Record<string, number>>({});
  const crashActiveRef = useRef(false);

  useEffect(() => {
    packetsRef.current = packets;
  }, [packets]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    concurrencyRef.current = concurrency;
  }, [concurrency]);

  useEffect(() => {
    dataSizeRef.current = dataSize;
  }, [dataSize]);

  useEffect(() => {
    resourceMultRef.current = RESOURCE_MULTIPLIER[resourceLevel] ?? 1;
  }, [resourceLevel]);

  useEffect(() => {
    cpuTempRef.current = computeCpuTemp(cpuState.cores, cpuState.clock, fanRpm);
  }, [cpuState.cores, cpuState.clock, fanRpm]);

  useEffect(() => {
    ramUsageRef.current = ramState.usage;
  }, [ramState.usage]);

  useEffect(() => {
    ssdUsageRef.current = ssdState.usage;
  }, [ssdState.usage]);

  useEffect(() => {
    hddUsageRef.current = hddState.usage;
  }, [hddState.usage]);

  useEffect(() => {
    workloadsRef.current = workloads;
  }, [workloads]);

  useEffect(() => {
    runningAppsRef.current = runningApps;
  }, [runningApps]);

  useEffect(() => {
    bottleneckRef.current = bottleneck;
  }, [bottleneck]);

  useEffect(() => {
    if (isPaused) {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = 0;
      return;
    }
    if (frameRef.current) return;

    lastTimeRef.current = performance.now();
    let crashCheckTimer = 0;

    const animate = (now: number) => {
      if (isPausedRef.current) {
        frameRef.current = requestAnimationFrame(animate);
        return;
      }

      const rawDt = now - lastTimeRef.current;
      lastTimeRef.current = now;
      const dt = Math.min(rawDt, 100) * speedRef.current;

      const currentPackets = packetsRef.current;
      const activeWorkloads = workloadsRef.current.filter((w) => w.active);
      const newPackets: FlowPacket[] = [];

      const maxActive = concurrencyRef.current * resourceMultRef.current;
      const activeCount = currentPackets.filter(p => p.status !== "done").length;
      const spawnBudget = maxActive - activeCount;

      if (spawnBudget > 0 && !crashActiveRef.current) {
        if (activeWorkloads.length > 0) {
          for (const wl of activeWorkloads) {
            if (newPackets.length >= spawnBudget) break;
            const preset = WORKLOAD_PRESETS.find((p) => p.type === wl.type);
            if (!preset) continue;
            for (let i = 0; i < wl.concurrency && newPackets.length < spawnBudget; i++) {
              const route = preset.route;
              let targetStorage = "";
              if (route === "storage") {
                targetStorage = pickStorageComponent(ssdUsageRef.current, hddUsageRef.current);
              }
              const hops = route === "storage" && targetStorage === "hdd"
                ? [
                    { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
                    { from: "cpu", to: "hdd", busId: "bus_cpu_hdd" },
                    { from: "hdd", to: "cpu", busId: "bus_cpu_hdd" },
                    { from: "cpu", to: "monitor", busId: "bus_monitor_output" },
                  ]
                : ROUTE_HOPS[route];
              const firstHop = hops[0];
              const busConfig = BUS_PATHS.find(b => b.id === firstHop.busId);
              if (!busConfig) continue;
              const occupancy = busOccupancyRef.current[firstHop.busId] ?? 0;
              if (occupancy >= busConfig.laneCount) continue;

              packetCounter++;
              routeTypeCountersRef.current[route]++;
              const pkt: FlowPacket = {
                id: `pkt_${packetCounter}`,
                fromId: firstHop.from,
                toId: firstHop.to,
                progress: 0,
                status: "traveling",
                route,
                busId: firstHop.busId,
                byteValue: wl.dataSize === "mb" ? 1048576 : wl.dataSize === "kb" ? 1024 : 1,
                dataSize: wl.dataSize,
                color: preset.color,
                shape: "circle",
                streamId: `wl_${wl.type}`,
                sourceInput: null,
                isAuto: true,
                queueStartTime: now,
                arrivalTime: 0,
                laneIndex: Math.floor(Math.random() * 3),
              };
              busOccupancyRef.current[firstHop.busId] = (busOccupancyRef.current[firstHop.busId] ?? 0) + 1;
              newPackets.push(pkt);
            }
          }
        } else {
          for (let i = 0; i < spawnBudget; i++) {
            const route = pickRoute();
            let targetStorage = "";
            if (route === "storage") {
              targetStorage = pickStorageComponent(ssdUsageRef.current, hddUsageRef.current);
            }
            const hops = route === "storage" && targetStorage === "hdd"
              ? [
                  { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
                  { from: "cpu", to: "hdd", busId: "bus_cpu_hdd" },
                  { from: "hdd", to: "cpu", busId: "bus_cpu_hdd" },
                  { from: "cpu", to: "monitor", busId: "bus_monitor_output" },
                ]
              : ROUTE_HOPS[route];
            const firstHop = hops[0];
            const busConfig = BUS_PATHS.find(b => b.id === firstHop.busId);
            if (!busConfig) continue;

            const occupancy = busOccupancyRef.current[firstHop.busId] ?? 0;
            if (occupancy >= busConfig.laneCount) continue;

            packetCounter++;
            const theme = STREAM_THEMES[routeTypeCountersRef.current[route] % STREAM_THEMES.length];
            routeTypeCountersRef.current[route]++;

            const pkt: FlowPacket = {
              id: `pkt_${packetCounter}`,
              fromId: firstHop.from,
              toId: firstHop.to,
              progress: 0,
              status: "traveling",
              route,
              busId: firstHop.busId,
              byteValue: dataSizeRef.current === "mb" ? 1048576 : dataSizeRef.current === "kb" ? 1024 : 1,
              dataSize: dataSizeRef.current,
              color: theme.color,
              shape: "circle",
              streamId: theme.name,
              sourceInput: null,
              isAuto: true,
              queueStartTime: now,
              arrivalTime: 0,
              laneIndex: Math.floor(Math.random() * 3),
            };
            busOccupancyRef.current[firstHop.busId] = (busOccupancyRef.current[firstHop.busId] ?? 0) + 1;
            newPackets.push(pkt);
          }
        }
      }

      const componentProcessed: Record<string, number> = {};
      const updatedPackets = currentPackets.map((pkt) => {
        if (pkt.status === "done") return pkt;

        if (pkt.status === "traveling") {
          if (!pkt.busId) return { ...pkt, status: "done" as const };
          const busConfig = BUS_PATHS.find(b => b.id === pkt.busId);
          if (!busConfig) return { ...pkt, status: "done" as const };

          const progress = pkt.progress + dt / BASE_TRAVEL_MS;
          if (progress >= 1) {
            busOccupancyRef.current[pkt.busId] = Math.max(0, (busOccupancyRef.current[pkt.busId] ?? 1) - 1);

            if (pkt.toId === "monitor") {
              const appIdx = routeTypeCountersRef.current[pkt.route] % 5;
              const app = MONITOR_APPS[pkt.route][appIdx];
              const arrival: AppArrival = {
                route: pkt.route,
                index: appIdx,
                icon: app.icon,
                name: app.name,
                time: now,
              };
              appArrivalsRef.current = [...appArrivalsRef.current.slice(-9), arrival];

              return { ...pkt, progress: 1, status: "done" as const };
            }

            const existingQueue = componentQueuesRef.current[pkt.toId] ?? [];
            componentQueuesRef.current[pkt.toId] = [...existingQueue, { ...pkt, id: `q_${pkt.id}`, progress: 0, status: "comp_queued" as const }];

            return { ...pkt, progress: 1, status: "done" as const };
          }

          return { ...pkt, progress };
        }

        if (pkt.status === "comp_queued" || pkt.status === "processing") {
          return pkt;
        }

        return pkt;
      });

      for (const compId of ["cpu", "ram", "gpu", "ssd", "hdd"]) {
        const queue = componentQueuesRef.current[compId] ?? [];
        if (queue.length === 0) continue;

        const compLayout = [{ id: "cpu", maxIO: 400 }, { id: "ram", maxIO: 800 }, { id: "gpu", maxIO: 200 }, { id: "ssd", maxIO: 350 }, { id: "hdd", maxIO: 80 }].find(c => c.id === compId);
        const maxIO = compLayout?.maxIO ?? 100;
        const temp = cpuTempRef.current;
        let throttle = 1;
        if (temp > 95) {
          throttle = 1 + 0.25 * ((temp - 95) / 5);
        }
        const effectiveRate = (maxIO / throttle) * (dt / 1000);
        const bytesToProcess = Math.round(effectiveRate);
        let processed = 0;

        const remaining: FlowPacket[] = [];
        for (const pkt of queue) {
          if (pkt.status !== "comp_queued" && pkt.status !== "swapping") {
            remaining.push(pkt);
            continue;
          }
          if (pkt.status === "swapping") {
            if (processed >= bytesToProcess) {
              remaining.push(pkt);
              continue;
            }
            processed += pkt.byteValue;
            continue;
          }
          if (processed >= bytesToProcess) {
            remaining.push(pkt);
            continue;
          }

          const pktBytes = pkt.byteValue;
          if (processed + pktBytes <= bytesToProcess) {
            processed += pktBytes;

            if (compId === "ram" && ramUsageRef.current >= 95) {
              const swapPkt = { ...pkt, status: "swapping" as const };
              const ssdQueue = componentQueuesRef.current["ssd"] ?? [];
              componentQueuesRef.current["ssd"] = [...ssdQueue, swapPkt];
              continue;
            }

            if ((compId === "ssd" && ssdUsageRef.current >= 100) || (compId === "hdd" && hddUsageRef.current >= 100)) {
              continue;
            }

            const hops = getHopsForRoute(pkt.route, pkt.fromId, pkt.toId, ssdUsageRef.current, hddUsageRef.current);
            const currentHopIdx = hops.findIndex(h => h.from === pkt.fromId && h.to === pkt.toId);
            const nextHop = hops[currentHopIdx + 1];
            if (nextHop) {
              const busConfig = BUS_PATHS.find(b => b.id === nextHop.busId);
              if (busConfig) {
                const occupancy = busOccupancyRef.current[nextHop.busId] ?? 0;
                if (occupancy >= busConfig.laneCount) {
                  remaining.push({ ...pkt, status: "bus_queued" as const, fromId: nextHop.from, toId: nextHop.to, busId: nextHop.busId });
                  continue;
                }
              }
              busOccupancyRef.current[nextHop.busId] = (busOccupancyRef.current[nextHop.busId] ?? 0) + 1;
              const hopPkt = {
                ...pkt,
                id: pkt.id.replace(/^q_/, ""),
                fromId: nextHop.from,
                toId: nextHop.to,
                busId: nextHop.busId,
                progress: 0,
                status: "traveling" as const,
                queueStartTime: now,
              };
              updatedPackets.push(hopPkt);
            }
          } else {
            remaining.push(pkt);
          }
        }
        componentQueuesRef.current[compId] = remaining;
      }

      const busQueuedToTravel: FlowPacket[] = [];
      for (const compId of ["cpu", "ram", "gpu", "ssd", "hdd"]) {
        const queue = componentQueuesRef.current[compId] ?? [];
        const remaining: FlowPacket[] = [];
        for (const pkt of queue) {
          if (pkt.status === "bus_queued" && pkt.busId) {
            const busConfig = BUS_PATHS.find(b => b.id === pkt.busId);
            if (busConfig) {
              const occupancy = busOccupancyRef.current[pkt.busId] ?? 0;
              if (occupancy < busConfig.laneCount) {
                busOccupancyRef.current[pkt.busId] = occupancy + 1;
                busQueuedToTravel.push({
                  ...pkt,
                  id: pkt.id.replace(/^q_/, ""),
                  status: "traveling",
                  progress: 0,
                  queueStartTime: now,
                });
                continue;
              }
            }
          }
          remaining.push(pkt);
        }
        componentQueuesRef.current[compId] = remaining;
      }

      const qFilter = (p: FlowPacket) => !p.id.startsWith("q_");
      const finalPackets = [
        ...newPackets,
        ...updatedPackets.filter(p => p.status === "traveling" || p.status === "processing"),
        ...busQueuedToTravel,
        ...(componentQueuesRef.current["cpu"] ?? []).filter(qFilter).map(p => ({ ...p })),
        ...(componentQueuesRef.current["ram"] ?? []).filter(qFilter).map(p => ({ ...p })),
        ...(componentQueuesRef.current["gpu"] ?? []).filter(qFilter).map(p => ({ ...p })),
        ...(componentQueuesRef.current["ssd"] ?? []).filter(qFilter).map(p => ({ ...p })),
        ...(componentQueuesRef.current["hdd"] ?? []).filter(qFilter).map(p => ({ ...p })),
      ];

      setPackets(finalPackets as FlowPacket[]);
      packetsRef.current = finalPackets as FlowPacket[];

      const arrivals = [...appArrivalsRef.current];
      setLastAppArrivals(arrivals);

      // Emergent crash detection (throttled to ~2s)
      crashCheckTimer += dt;
      if (crashCheckTimer > 2000 && !crashActiveRef.current) {
        crashCheckTimer = 0;
        const timers = crashTimersRef.current;
        const bn = bottleneckRef.current;

        // Thermal: bottleneck?.type === "thermal" for 3s
        if (bn?.type === "thermal" && bn.severity === "severe") {
          timers.thermal = (timers.thermal ?? 0) + 2000;
          if (timers.thermal >= 3000) {
            setCrashEvent({ type: "overheat", title: "Overheating", desc: "CPU temperature exceeds safe limit — system will shut down", fix: "Reduce CPU cores/clock or increase fan speed" });
            crashActiveRef.current = true;
          }
        } else {
          timers.thermal = 0;
        }

        // RAM full: ramUsage >= 100 for 3s
        if (ramUsageRef.current >= 100) {
          timers.ram = (timers.ram ?? 0) + 2000;
          if (timers.ram >= 3000) {
            setCrashEvent({ type: "freeze", title: "System Freeze", desc: "RAM is completely full — system becomes unresponsive", fix: "Close running apps or upgrade RAM" });
            crashActiveRef.current = true;
          }
        } else {
          timers.ram = 0;
        }

        // Storage full: SSD+HDD both >= 100
        if (ssdUsageRef.current >= 100 && hddUsageRef.current >= 100) {
          setCrashEvent({ type: "disk_full", title: "Storage Full", desc: "Both SSD and HDD are full — cannot write data", fix: "Clean up files or add more storage" });
          crashActiveRef.current = true;
        }

        // OOM: app RAM demand > total RAM
        if (ramTotal > 0) {
          const appRamTotal = runningAppsRef.current.reduce((s, a) => s + (a.active ? a.ramCost : 0), 0);
          if (appRamTotal > ramTotal) {
            setCrashEvent({ type: "bsod", title: "Out of Memory (BSOD)", desc: "Running apps demand more RAM than installed — critical error", fix: "Close memory-heavy apps or install more RAM" });
            crashActiveRef.current = true;
          }
        }

        // Bottleneck stall: severe for 5s
        if (bn && bn.severity === "severe" && bn.type !== "thermal") {
          timers.bottleneck = (timers.bottleneck ?? 0) + 2000;
          if (timers.bottleneck >= 5000) {
            setCrashEvent({ type: "slow", title: "Severe Bottleneck", desc: "A component is maxed out — system is extremely slow", fix: "Upgrade the bottlenecked component" });
            crashActiveRef.current = true;
          }
        } else {
          timers.bottleneck = 0;
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = 0;
      }
    };
  }, [isPaused, speed, concurrency, dataSize, resourceLevel, cpuState.cores, cpuState.clock, ramState.usage, ssdState.usage, hddState.usage, ramTotal]);

  const cpuTemp = computeCpuTemp(cpuState.cores, cpuState.clock, fanRpm);

  function getHopsForRoute(route: RouteType, fromId: string, toId: string, ssdUsage: number, hddUsage: number): { from: string; to: string; busId: string }[] {
    if (route === "storage") {
      const target = pickStorageComponent(ssdUsage, hddUsage);
      return target === "hdd"
        ? [
            { from: "keyboard", to: "cpu", busId: "bus_keyboard_cpu" },
            { from: "cpu", to: "hdd", busId: "bus_cpu_hdd" },
            { from: "hdd", to: "cpu", busId: "bus_cpu_hdd" },
            { from: "cpu", to: "monitor", busId: "bus_monitor_output" },
          ]
        : ROUTE_HOPS["storage"];
    }
    return ROUTE_HOPS[route];
  }

  const resetFlow = useCallback(() => {
    setPackets([]);
    packetsRef.current = [];
    packetCounter = 0;
    componentQueuesRef.current = {};
    busOccupancyRef.current = {};
    appArrivalsRef.current = [];
    setLastAppArrivals([]);
    setCrashEvent(null);
    crashActiveRef.current = false;
    crashTimersRef.current = {};
    if (frameRef.current) cancelAnimationFrame(frameRef.current);
    frameRef.current = 0;
  }, []);

  const dismissCrash = useCallback(() => {
    setCrashEvent(null);
    crashActiveRef.current = false;
    crashTimersRef.current = {};
    resetFlow();
  }, [resetFlow]);

  useEffect(() => {
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return {
    packets,
    resetFlow,
    lastAppArrivals,
    cpuTemp,
    crashEvent,
    dismissCrash,
  };
}