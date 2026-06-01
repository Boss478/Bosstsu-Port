"use client";

import { useState, useMemo, useCallback } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { t } from "../lang";
import PixelSprite from "../components/PixelSprite";
import { SPRITE_MAP } from "../sprites";

/* ─── Scenario Data ─── */

interface ScenarioData {
  id: number;
  nameKey: string;
  descKey: string;
  cardNameKey: string;
  cardDescKey: string;
  cpu: number;
  ram: number;
  stor: number;
  gpu: number;
  temp: number;
}

const SCENARIO_DATA: ScenarioData[] = [
  { id: 1, nameKey: "scenario.normal", descKey: "scenario.normal.desc", cardNameKey: "card.speed", cardDescKey: "card.speed.desc", cpu: 25, ram: 30, stor: 20, gpu: 15, temp: 45 },
  { id: 2, nameKey: "scenario.cpu", descKey: "scenario.cpu.desc", cardNameKey: "card.cpu", cardDescKey: "card.cpu.desc", cpu: 95, ram: 50, stor: 30, gpu: 20, temp: 82 },
  { id: 3, nameKey: "scenario.ram", descKey: "scenario.ram.desc", cardNameKey: "card.ram", cardDescKey: "card.ram.desc", cpu: 60, ram: 95, stor: 40, gpu: 30, temp: 65 },
  { id: 4, nameKey: "scenario.bottleneck", descKey: "scenario.bottleneck.desc", cardNameKey: "card.slow", cardDescKey: "card.slow.desc", cpu: 45, ram: 90, stor: 30, gpu: 20, temp: 58 },
  { id: 5, nameKey: "scenario.noram", descKey: "scenario.noram.desc", cardNameKey: "card.noram", cardDescKey: "card.noram.desc", cpu: 0, ram: 0, stor: 0, gpu: 0, temp: 25 },
  { id: 6, nameKey: "scenario.turbo", descKey: "scenario.turbo.desc", cardNameKey: "card.turbo", cardDescKey: "card.turbo.desc", cpu: 99, ram: 55, stor: 35, gpu: 25, temp: 92 },
  { id: 7, nameKey: "scenario.multitask", descKey: "scenario.multitask.desc", cardNameKey: "card.context", cardDescKey: "card.context.desc", cpu: 80, ram: 70, stor: 45, gpu: 40, temp: 71 },
];

/* ─── Helpers ─── */

function barColor(v: number): string {
  if (v >= 80) return "bg-red-500";
  if (v >= 50) return "bg-amber-500";
  return "bg-emerald-500";
}

function barColorText(v: number): string {
  if (v >= 80) return "text-red-400";
  if (v >= 50) return "text-amber-400";
  return "text-emerald-400";
}

/* ─── Sub-components ─── */

function TaskManagerPanel({ cpu, ram, stor, gpu, temp }: { cpu: number; ram: number; stor: number; gpu: number; temp: number }) {
  const { lang, mode } = useGame();
  const bars = [
    { label: t("workflow.cpu", lang, mode), val: cpu },
    { label: t("workflow.ram", lang, mode), val: ram },
    { label: t("workflow.storage", lang, mode), val: stor },
    { label: t("workflow.gpu", lang, mode), val: gpu },
  ];

  return (
    <div className="bg-zinc-900/80 border border-zinc-700 rounded-xl p-3 min-w-[160px]">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-3 font-bold text-center">
        {t("workflow.taskmanager", lang, mode)}
      </div>
      <div className="space-y-2.5">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="text-zinc-400 font-bold">{b.label}</span>
              <span className={barColorText(b.val)}>{b.val}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${barColor(b.val)}`}
                style={{ width: `${b.val}%`, transition: "width 0.6s ease, background-color 0.3s ease" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-zinc-700 flex justify-between items-center text-[10px]">
        <span className="text-zinc-500">{t("workflow.temp", lang, mode)}</span>
        <span className={temp >= 80 ? "text-red-400 font-bold" : temp >= 50 ? "text-amber-400" : "text-emerald-400"}>
          {temp}°C
        </span>
      </div>
    </div>
  );
}

function KnowledgeCard({ nameKey, descKey }: { nameKey: string; descKey: string }) {
  const { lang, mode } = useGame();
  return (
    <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-3">
      <div className="text-[10px] uppercase tracking-wider text-zinc-500 mb-1.5 font-bold">
        {t("victory.card", lang, mode)}
      </div>
      <div className="text-sm font-bold text-emerald-400 mb-1">
        {t(nameKey, lang, mode)}
      </div>
      <div className="text-xs text-zinc-400 leading-relaxed">
        {t(descKey, lang, mode)}
      </div>
    </div>
  );
}

function FlowNodeBox({
  label,
  connector,
  selected,
  onClick,
}: {
  label: string;
  connector: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-1 sm:gap-2">
      <button
        onClick={onClick}
        className={`px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors whitespace-nowrap ${
          selected
            ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
            : "border-zinc-600 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500"
        }`}
      >
        {label}
      </button>
      {connector && (
        <span className="text-zinc-600 text-sm sm:text-base select-none">{connector}</span>
      )}
    </div>
  );
}

/* ─── Main Component ─── */

export default function WorkflowScreen({ onNavigate }: ScreenShellProps) {
  const { lang, mode, playSfx } = useGame();

  /* Tab state */
  const [tab, setTab] = useState<"explore" | "scenarios">("explore");

  /* Explore state */
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [activeSim, setActiveSim] = useState<string | null>(null);
  const [simCores, setSimCores] = useState(4);
  const [simSpeed, setSimSpeed] = useState(3);
  const [simGpuCores, setSimGpuCores] = useState(4);
  const [simGpuLoad, setSimGpuLoad] = useState(5);
  const [simSticks, setSimSticks] = useState(2);

  /* Scenarios state */
  const [activeScenario, setActiveScenario] = useState<ScenarioData | null>(null);
  const [scenarioDone, setScenarioDone] = useState(false);

  const tempCpu = Math.round(30 + simCores * 2.5 + simSpeed * 4);
  const gpuFps = simGpuCores * simGpuLoad * 5;
  const ramTotal = simSticks * 8;
  const ramUsed = Math.min(20 + simSticks * 15, 95);

  /* Random knowledge card for explore tab */
  const [randomCard] = useState(() => SCENARIO_DATA[Math.floor(Math.random() * SCENARIO_DATA.length)]);

  /* Simulator button labels */
  const simLabels = useMemo(
    () => ({
      cpu: t("part.cpu", lang, mode),
      gpu: t("part.gpu", lang, mode),
      ram: t("hw.ram", lang, mode),
      storage: t("hardware.storage", lang, mode),
      motherboard: t("hw.motherboard", lang, mode),
    }),
    [lang, mode],
  );

  /* Flow nodes */
  const flowNodes = useMemo(
    () => [
      { id: "input", label: t("hardware.input", lang, mode), description: "Keyboard, mouse, scanner — send data into the system", connector: "→" },
      { id: "cpu", label: t("hw.cpu", lang, mode), description: "The brain — fetches, decodes, and executes instructions", connector: "↔" },
      { id: "ram", label: t("hw.ram", lang, mode), description: "Temporary workspace — fast but volatile memory", connector: "→" },
      { id: "storage", label: t("hardware.storage", lang, mode), description: "HDD / SSD — permanent data storage", connector: "→" },
      { id: "output", label: t("hardware.output", lang, mode), description: "Monitor, speaker, printer — send results to the user", connector: "" },
    ],
    [lang, mode],
  );

  const handleScenarioStart = useCallback(
    (s: ScenarioData) => {
      playSfx("click");
      setActiveScenario(s);
      setScenarioDone(true);
    },
    [playSfx],
  );

  const handleScenarioReset = useCallback(() => {
    playSfx("click");
    setActiveScenario(null);
    setScenarioDone(false);
  }, [playSfx]);

  const switchTab = useCallback(
    (t: "explore" | "scenarios") => {
      playSfx("click");
      setTab(t);
    },
    [playSfx],
  );

  const handleSelectNode = useCallback(
    (id: string) => {
      playSfx("click");
      setSelectedNode((prev) => (prev === id ? null : id));
    },
    [playSfx],
  );

  const handleSelectSim = useCallback(
    (s: string) => {
      playSfx("click");
      setActiveSim((prev) => (prev === s ? null : s));
    },
    [playSfx],
  );

  return (
    <div className="flex flex-col p-3 sm:p-4 min-h-full">
      {/* Header */}
      <h2 className="text-xl sm:text-2xl font-black text-green-400 mb-1">{t("stage3.title", lang, mode)}</h2>
      <p className="text-zinc-500 text-xs sm:text-sm mb-3">{t("stage3.instruction", lang, mode)}</p>

      {/* Tabs */}
      <div className="flex gap-2 bg-zinc-900 rounded-xl p-1 mb-4 self-start">
        <button
          onClick={() => switchTab("explore")}
          className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            tab === "explore"
              ? "bg-green-500 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <PixelSprite data={SPRITE_MAP.magnify} size={16} className="inline-block" /> {t("workflow.tab.explore", lang, mode)}
        </button>
        <button
          onClick={() => switchTab("scenarios")}
          className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition-colors ${
            tab === "scenarios"
              ? "bg-green-500 text-black"
              : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <PixelSprite data={SPRITE_MAP.clipboard} size={16} className="inline-block" /> {t("workflow.tab.scenarios", lang, mode)}
        </button>
      </div>

      {/* ─── Explore Tab ─── */}
      {tab === "explore" && (
        <div className="space-y-5 w-full max-w-2xl">
          {/* Section A: Data Flow Diagram */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              {t("workflow.overview", lang, mode)}
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 sm:p-4">
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-center">
                {flowNodes.map((n) => (
                  <FlowNodeBox
                    key={n.id}
                    label={n.label}
                    connector={n.connector}
                    selected={selectedNode === n.id}
                    onClick={() => handleSelectNode(n.id)}
                  />
                ))}
              </div>
              {selectedNode && (
                <div className="mt-3 p-2.5 bg-zinc-800/60 rounded-lg border border-zinc-700">
                  <div className="text-xs font-bold text-emerald-400 mb-0.5">
                    {flowNodes.find((n) => n.id === selectedNode)?.label}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    {flowNodes.find((n) => n.id === selectedNode)?.description}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Component Simulators */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              {t("workflow.click.motherboard", lang, mode)}
            </h3>
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 sm:p-4">
              <div className="flex flex-wrap gap-2 mb-3">
                {(["cpu", "gpu", "ram", "storage", "motherboard"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSelectSim(s)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-bold border transition-colors ${
                      activeSim === s
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-400"
                        : "border-zinc-600 bg-zinc-800/60 text-zinc-300 hover:border-zinc-500"
                    }`}
                  >
                    {simLabels[s]}
                  </button>
                ))}
              </div>

              {/* Simulator Cards */}
              {activeSim === "cpu" && (
                <div className="space-y-2.5">
                  <div className="text-sm font-bold text-emerald-400">{t("hw.cpu", lang, mode)}</div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Cores: {simCores}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={simCores}
                      onChange={(e) => setSimCores(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Speed: {simSpeed} GHz</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={6}
                      step={0.5}
                      value={simSpeed}
                      onChange={(e) => setSimSpeed(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5"
                    />
                  </div>
                  <div className={barColorText(tempCpu)}>
                    <span className="text-zinc-400">Temp: </span>
                    <span className="font-bold">{tempCpu}°C</span>
                  </div>
                </div>
              )}

              {activeSim === "gpu" && (
                <div className="space-y-2.5">
                  <div className="text-sm font-bold text-emerald-400">{t("hw.gpu", lang, mode)}</div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Cores: {simGpuCores}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={8}
                      value={simGpuCores}
                      onChange={(e) => setSimGpuCores(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Load: {simGpuLoad}/10</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={10}
                      value={simGpuLoad}
                      onChange={(e) => setSimGpuLoad(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5"
                    />
                  </div>
                  <div className="text-emerald-400">
                    <span className="text-zinc-400">FPS: </span>
                    <span className="font-bold">{gpuFps}</span>
                  </div>
                </div>
              )}

              {activeSim === "ram" && (
                <div className="space-y-2.5">
                  <div className="text-sm font-bold text-emerald-400">{t("hw.ram", lang, mode)}</div>
                  <div>
                    <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                      <span>Sticks: {simSticks}</span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={4}
                      value={simSticks}
                      onChange={(e) => setSimSticks(Number(e.target.value))}
                      className="w-full accent-emerald-500 h-1.5"
                    />
                  </div>
                  <div className="text-[11px] text-zinc-400 mb-1">{ramTotal} GB total</div>
                  <div>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-zinc-400">Used</span>
                      <span className={barColorText(ramUsed)}>{ramUsed}%</span>
                    </div>
                    <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${barColor(ramUsed)}`}
                        style={{ width: `${ramUsed}%`, transition: "width 0.4s ease" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeSim === "storage" && (
                <div className="space-y-2.5">
                  <div className="text-sm font-bold text-emerald-400">{t("hardware.storage", lang, mode)}</div>
                  <div className="text-[11px] text-zinc-400 space-y-1 leading-relaxed">
                    <div className="flex justify-between items-center p-2 bg-zinc-800/60 rounded-lg">
                      <span className="font-bold text-zinc-300">HDD</span>
                      <span className="text-amber-400">~10ms seek</span>
                    </div>
                    <div className="flex justify-between items-center p-2 bg-zinc-800/60 rounded-lg">
                      <span className="font-bold text-zinc-300">SSD</span>
                      <span className="text-emerald-400">~0.1ms seek</span>
                    </div>
                    <p className="text-zinc-500 mt-1">
                      SSD is <span className="text-emerald-400 font-bold">~100x faster</span> than HDD at finding data. No moving parts means less latency and better durability.
                    </p>
                  </div>
                </div>
              )}

              {activeSim === "motherboard" && (
                <div className="space-y-2.5">
                  <div className="text-sm font-bold text-emerald-400">{t("hw.motherboard", lang, mode)}</div>
                  <div className="text-[11px] text-zinc-400 space-y-1.5 leading-relaxed">
                    <p>
                      The motherboard connects all components via <span className="text-zinc-300 font-bold">data buses</span>:
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div className="p-2 bg-zinc-800/60 rounded-lg text-center">
                        <div className="text-[10px] text-amber-400">FSB</div>
                        <div className="text-[9px] text-zinc-500">CPU ↔ RAM</div>
                      </div>
                      <div className="p-2 bg-zinc-800/60 rounded-lg text-center">
                        <div className="text-[10px] text-amber-400">PCIe</div>
                        <div className="text-[9px] text-zinc-500">CPU ↔ GPU</div>
                      </div>
                      <div className="p-2 bg-zinc-800/60 rounded-lg text-center">
                        <div className="text-[10px] text-amber-400">SATA</div>
                        <div className="text-[9px] text-zinc-500">CPU ↔ Storage</div>
                      </div>
                      <div className="p-2 bg-zinc-800/60 rounded-lg text-center">
                        <div className="text-[10px] text-amber-400">USB</div>
                        <div className="text-[9px] text-zinc-500">CPU ↔ Peripherals</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {!activeSim && (
                <p className="text-[11px] text-zinc-600 text-center py-3">
                  {t("workflow.click.case", lang, mode)}
                </p>
              )}
            </div>
          </div>

          {/* Section C: Knowledge Card */}
          <div>
            <h3 className="text-xs uppercase tracking-wider text-zinc-500 mb-2 font-bold">
              {t("victory.card", lang, mode)}
            </h3>
            <KnowledgeCard nameKey={randomCard.cardNameKey} descKey={randomCard.cardDescKey} />
          </div>
        </div>
      )}

      {/* ─── Scenarios Tab ─── */}
      {tab === "scenarios" && (
        <div className="flex flex-col sm:flex-row gap-4 w-full max-w-3xl">
          {/* Left: Scenarios */}
          <div className="flex-1 space-y-3 min-w-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SCENARIO_DATA.map((s) => (
                <button
                  key={s.id}
                  onClick={() => handleScenarioStart(s)}
                  className={`p-2.5 rounded-xl border text-left transition-colors ${
                    activeScenario?.id === s.id && scenarioDone
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-zinc-700 bg-zinc-800/40 hover:border-zinc-500"
                  }`}
                >
                  <div className="text-[9px] text-zinc-600 mb-0.5">#{s.id}</div>
                  <div className="text-[11px] sm:text-xs font-bold text-zinc-200 leading-tight">
                    {t(s.nameKey, lang, mode)}
                  </div>
                </button>
              ))}
            </div>

            {/* Scenario result */}
            {activeScenario && scenarioDone && (
              <div className="space-y-3">
                <div className="bg-zinc-900/60 border border-zinc-700 rounded-xl p-3">
                  <div className="text-xs font-bold text-emerald-400 mb-1">
                    {t(activeScenario.nameKey, lang, mode)}
                  </div>
                  <div className="text-[11px] text-zinc-400 leading-relaxed">
                    {t(activeScenario.descKey, lang, mode)}
                  </div>
                </div>

                <KnowledgeCard nameKey={activeScenario.cardNameKey} descKey={activeScenario.cardDescKey} />

                <button
                  onClick={handleScenarioReset}
                  className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-400 hover:text-green-400 text-xs font-bold transition-colors"
                >
                  {t("scenario.restart", lang, mode)}
                </button>
              </div>
            )}

            {!activeScenario && (
              <p className="text-[11px] text-zinc-600 text-center py-4">
                {t("workflow.click.case", lang, mode)}
              </p>
            )}
          </div>

          {/* Right: Task Manager */}
          <div className="sm:w-44 shrink-0">
            <div className="sm:sticky sm:top-4">
              <TaskManagerPanel
                cpu={activeScenario?.cpu ?? 0}
                ram={activeScenario?.ram ?? 0}
                stor={activeScenario?.stor ?? 0}
                gpu={activeScenario?.gpu ?? 0}
                temp={activeScenario?.temp ?? 0}
              />
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <button
        onClick={() => onNavigate("menu")}
        className="self-start mt-5 px-4 py-2 rounded bg-zinc-800 text-zinc-400 hover:text-green-400 text-xs sm:text-sm transition-colors"
      >
        ← {t("topbar.back", lang, mode)}
      </button>
    </div>
  );
}
