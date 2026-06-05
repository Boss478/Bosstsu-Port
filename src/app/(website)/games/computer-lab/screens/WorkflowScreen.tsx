"use client";

import { useState, useCallback } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import { useComponentState } from "../hooks/useComponentState";
import { useDataFlow } from "../hooks/useDataFlow";

import SimDeskView from "../components/SimDeskView";
import SimControls from "../components/SimControls";
import SimMonitor from "../components/SimMonitor";
import SimTaskManager from "../components/SimTaskManager";
import SimComponentPopup from "../components/SimComponentPopup";
import SimComponentDrillDown from "../components/SimComponentDrillDown";
import type { Speed } from "../hooks/useSimulationSpeed";
import type { WorkloadType, WorkloadConfig, AppConfig } from "../simulation/workloads";
import { WORKLOAD_PRESETS, SIM_APPS } from "../simulation/workloads";
import type { DataSize, ResourceLevel } from "../simulation/types";

let workloadCounter = 0;



export default function WorkflowScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx } = useGame();

  /* Hooks */
  const componentState = useComponentState();
  const {
    cpuState, gpuState, ramState, ssdState, hddState, fanState,
    setCpuCores, setCpuClock, setGpuCores, setGpuVram, setGpuVramType, setGpuLoad,
    setRamConfig, setSsdConfig, setHddConfig, setFanRpm,
  } = componentState;

  const [speed, setSpeed] = useState<Speed>(1);
  const [isPaused, setIsPaused] = useState(false);
  const togglePause = useCallback(() => setIsPaused((p) => !p), []);

  const [workloads, setWorkloads] = useState<WorkloadConfig[]>([]);
  const [runningApps, setRunningApps] = useState<AppConfig[]>([]);
  const [concurrency, setConcurrency] = useState(5);
  const [dataSize, setDataSize] = useState<DataSize>("byte");

  const ramTotal = ramState.sticks * ramState.capacityPerStick;
  const ramUsed = ramState.usage + runningApps.reduce((sum, a) => sum + (a.active ? a.ramCost : 0), 0);

  const appRamTotal = runningApps.reduce((s, a) => s + (a.active ? a.ramCost : 0), 0);
  const resourceLevel: ResourceLevel = appRamTotal >= 3072 ? "heavy" : appRamTotal >= 1024 ? "medium" : "light";



  const dataFlow = useDataFlow({
    cpuState, gpuState, ramState, ssdState, hddState,
    speed, isPaused, fanRpm: fanState.rpm,
    workloads, runningApps,
    concurrency, dataSize, resourceLevel,
    ramTotal: ramTotal * 1024,
  });
  const {
    packets, lastAppArrivals,
    resetFlow, cpuTemp, crashEvent, dismissCrash,
    bottleneck, componentUtilization,
  } = dataFlow;

  /* View state */
  const [showInterior, setShowInterior] = useState(false);
  const [activeComponent, setActiveComponent] = useState<string | null>(null);
  const [popupComponent, setPopupComponent] = useState<string | null>(null);
  const [drillDownComponent, setDrillDownComponent] = useState<string | null>(null);

  const handleAddWorkload = useCallback((type: WorkloadType) => {
    const preset = WORKLOAD_PRESETS.find((p) => p.type === type);
    if (!preset) return;
    const existing = workloads.find((w) => w.type === type && w.active);
    if (existing) return;
    workloadCounter++;
    const wl: WorkloadConfig = {
      id: `wl_${workloadCounter}`,
      type,
      concurrency: 10,
      dataSize: preset.dataSize,
      requireGpu: preset.requireGpu,
      active: true,
    };
    setWorkloads((prev) => [...prev, wl]);
  }, [workloads]);

  const handleRemoveWorkload = useCallback((id: string) => {
    setWorkloads((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const handleToggleApp = useCallback((appId: string) => {
    setRunningApps((prev) => {
      const existing = prev.find((a) => a.id === appId);
      if (existing) {
        return prev.filter((a) => a.id !== appId);
      }
      const config = SIM_APPS.find((a) => a.id === appId);
      if (!config) return prev;
      return [...prev, { ...config, active: true }];
    });
  }, []);

  /* Component drill-down overlay */
  const handleComponentClick = useCallback((id: string) => {
    playSfx("click");
    setActiveComponent(id);
    setDrillDownComponent(id);
  }, [playSfx]);

  const handleToggleInterior = useCallback(() => {
    playSfx("click");
    setShowInterior((s) => !s);
  }, [playSfx]);

  const handleReset = useCallback(() => {
    resetFlow();
  }, [resetFlow]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-1.5">
        <div>
          <h2 className="text-base sm:text-lg font-black text-green-400">{t("stage3.title", lang, mode)}</h2>
          <p className="text-zinc-500 text-[10px]">{t("stage3.instruction", lang, mode)}</p>
        </div>
        <button
          onClick={() => onNavigate("menu")}
          className="px-2 py-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-green-400 text-[10px] font-bold transition-colors"
        >
          ← {t("topbar.back", lang, mode)}
        </button>
      </div>

      {/* Main split: Desk left full height, right panel scrollable */}
      <div className="flex-1 flex gap-2 px-3 pb-2 min-h-0">
        {/* Left: Desk view */}
        <div className="flex-1 min-w-0 relative">
          <SimDeskView
            packets={packets}
            activeComponent={activeComponent}
            onComponentClick={handleComponentClick}
            lastAppArrivals={lastAppArrivals}
            monitorContent={packets.length > 0 ? `${packets.filter(p => p.status !== "done").length} active pkt` : undefined}
            showInterior={showInterior}
            onToggleInterior={handleToggleInterior}
          />
          <button
            onClick={handleToggleInterior}
            className="absolute top-1 left-1 z-20 px-1.5 py-0.5 rounded bg-blue-600/80 text-white text-[8px] font-bold hover:bg-blue-500 transition-colors"
          >
            {showInterior ? t("sim.interior.close", lang, mode) || "Close" : t("sim.interior", lang, mode)}
          </button>
        </div>

        {/* Right panel */}
        <div className="w-80 lg:w-96 shrink-0 flex flex-col gap-2 overflow-y-auto">
          <SimTaskManager
            util={componentUtilization}
            bottleneck={bottleneck}
            cpuTemp={cpuTemp}
            swapActive={packets.some(p => p.status === "swapping")}
            diskFull={packets.some(p => p.status === "disk_full")}
          />

          <SimMonitor
            history={packets
              .filter(p => p.status !== "done")
              .slice(-8)
              .map(p => `${p.fromId}→${p.toId} (${p.route})`)}
            currentOutput={
              activeComponent
                ? `Viewing: ${activeComponent}\n${packets.filter(p => p.toId === activeComponent && p.status !== "done").length} active ops`
                : `${packets.filter(p => p.status !== "done").length} packets in flight`
            }
            isTyping={packets.some(p => p.status !== "done")}
            className="h-36 shrink-0"
          />

          <SimControls
            onReset={handleReset}
            speed={speed}
            onSpeedChange={setSpeed}
            isPaused={isPaused}
            onTogglePause={togglePause}
            concurrency={concurrency}
            onConcurrencyChange={setConcurrency}
            dataSize={dataSize}
            onDataSizeChange={setDataSize}
            workloads={workloads}
            onAddWorkload={handleAddWorkload}
            onRemoveWorkload={handleRemoveWorkload}
            runningApps={runningApps}
            onToggleApp={handleToggleApp}
            ramTotal={ramTotal}
            ramUsed={ramUsed}
            resourceLevel={resourceLevel}
            cpuState={cpuState}
            gpuState={gpuState}
            ramState={ramState}
            ssdState={ssdState}
            hddState={hddState}
            onUpdateCpuCores={setCpuCores}
            onUpdateCpuClock={setCpuClock}
            onUpdateGpuCores={setGpuCores}
            onUpdateGpuVram={setGpuVram}
            onUpdateRamConfig={(sticks, perStickGb) => setRamConfig(sticks, perStickGb, "DDR4", 3200)}
            onUpdateSsdConfig={setSsdConfig}
            onUpdateHddConfig={setHddConfig}
          />
        </div>
      </div>

      {/* Crash overlay */}
      {crashEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={dismissCrash}>
          <div
            className="bg-zinc-900 border-2 border-red-500/50 rounded-xl max-w-sm w-full mx-3 p-5 animate-popup-enter"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-red-500 text-lg font-black mb-2">{t("sim.crash.title", lang, mode)}</div>
            <div className="text-zinc-300 text-sm font-bold mb-1">{crashEvent.title}</div>
            <div className="text-zinc-400 text-xs mb-4 leading-relaxed">{crashEvent.desc}</div>
            <div className="bg-zinc-800/60 rounded-lg p-3 mb-4">
              <div className="text-[9px] uppercase tracking-wider text-amber-400 mb-1 font-bold">{t("sim.crash.fix", lang, mode)}</div>
              <div className="text-zinc-300 text-xs leading-relaxed">{crashEvent.fix}</div>
            </div>
            <button
              onClick={() => { dismissCrash(); playSfx("click"); }}
              className="w-full px-4 py-2 rounded-lg bg-red-600 text-white text-xs font-bold hover:bg-red-500 transition-colors"
            >
              {t("ui.ok", lang, mode)}
            </button>
          </div>
        </div>
      )}

      {/* Component drill-down overlay */}
      {drillDownComponent && (
        <SimComponentDrillDown
          componentId={drillDownComponent}
          cpuState={cpuState}
          gpuState={gpuState}
          ramState={ramState}
          ssdState={ssdState}
          hddState={hddState}
          onClose={() => setDrillDownComponent(null)}
        />
      )}

      {/* Component popup */}
      <SimComponentPopup
        componentId={popupComponent}
        cpuState={cpuState}
        gpuState={gpuState}
        ramState={ramState}
        ssdState={ssdState}
        hddState={hddState}
        fanState={fanState}
        onUpdateCpuCores={setCpuCores}
        onUpdateCpuClock={setCpuClock}
        onUpdateGpuCores={setGpuCores}
        onUpdateGpuVram={setGpuVram}
        onUpdateGpuVramType={setGpuVramType}
        onUpdateGpuLoad={setGpuLoad}
        onUpdateRamConfig={setRamConfig}
        onUpdateSsdConfig={setSsdConfig}
        onUpdateHddConfig={setHddConfig}
        onUpdateFanRpm={setFanRpm}
        onClose={() => setPopupComponent(null)}
      />
    </div>
  );
}