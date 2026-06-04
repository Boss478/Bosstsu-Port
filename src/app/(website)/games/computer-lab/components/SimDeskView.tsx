"use client";

import { useState, type ReactNode } from "react";
import PixelSprite from "./PixelSprite";
import { SPRITE_MAP } from "../sprites";
import { COMPONENT_LAYOUT, BUS_PATHS, DESK_COLORS, getBusPathPoints, getBusCornerPoints, getOutsideLanePaths } from "../simulation/positions";
import type { FlowPacket, DataSize } from "../simulation/types";
import { useGame } from "../context";
import { t } from "../lang";

interface AppArrival {
  route: string;
  icon: string;
  name: string;
  time: number;
}

interface SimDeskViewProps {
  children?: ReactNode;
  packets?: FlowPacket[];
  activeComponent?: string | null;
  onComponentClick?: (id: string) => void;
  lastAppArrivals?: AppArrival[];
  monitorContent?: string;
  monitorScreen?: ReactNode;
  showInterior?: boolean;
  onToggleInterior?: () => void;
}

const GLOW_FILTER_ID = "cable-glow";

function CableGlowFilter() {
  return (
    <defs>
      <filter id={GLOW_FILTER_ID} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

function getDotSize(dataSize: DataSize): number {
  if (dataSize === "mb") return 18;
  if (dataSize === "kb") return 12;
  return 7;
}

function laneOffset(busIdx: number, laneCount: number, isOutsideCase: boolean = false): { dx: number; dy: number } {
  if (!isOutsideCase) return { dx: 0, dy: 0 };
  const spread = 1.5;
  const mid = (laneCount - 1) / 2;
  const n = busIdx - mid;
  const angle = Math.PI / 4;
  return { dx: Math.cos(angle) * n * spread, dy: Math.sin(angle) * n * spread };
}

function OutsideSubLanes({ bus }: { bus: typeof BUS_PATHS[0] }) {
  const outsidePaths = getOutsideLanePaths(bus);
  if (outsidePaths.length === 0) return null;

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      {outsidePaths.map((d, li) => (
        <path
          key={li}
          d={d}
          fill="none"
          stroke="#9ca3af"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity={0.3}
        />
      ))}
    </svg>
  );
}

function CableBusLine({ bus, isActive, occupancy }: { bus: typeof BUS_PATHS[0]; isActive: boolean; occupancy?: number }) {
  const points = getBusPathPoints(bus);
  if (points.length < 2) return null;

  const lanes = bus.laneCount;

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      {Array.from({ length: lanes }).map((_, li) => {
        const d = points
          .map((p, i) => {
            const off = laneOffset(li, lanes, false);
            return `${i === 0 ? "M" : "L"}${(p.x + off.dx).toFixed(1)} ${(p.y + off.dy).toFixed(1)}`;
          })
          .join(" ");

        return (
          <path
            key={li}
            d={d}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeLinecap="round"
            opacity={0.4}
          />
        );
      })}
    </svg>
  );
}

function DataPacketDot({ packet, waypoints, bus }: { packet: FlowPacket; waypoints: { x: number; y: number }[]; bus: typeof BUS_PATHS[0] }) {
  if (waypoints.length < 2) return null;

  const progress = Math.min(packet.progress, 1);
  const totalLen = waypoints.length - 1;
  const pos = progress * totalLen;
  const segIdx = Math.min(Math.floor(pos), totalLen - 1);
  const t = pos - segIdx;

  const from = waypoints[segIdx];
  const to = waypoints[segIdx + 1];
  if (!from || !to) return null;

  const isOutsideCase = progress < bus.caseBoundaryProgress;
  const laneIndex = packet.laneIndex ?? 0;
  const off = laneOffset(laneIndex, 3, isOutsideCase);

  const x = from.x + (to.x - from.x) * t + off.dx;
  const y = from.y + (to.y - from.y) * t + off.dy;

  const size = getDotSize(packet.dataSize);

  const routeLabel = packet.route === "compute" ? "C" : packet.route === "storage" ? "S" : "G";
  const pulseSize = size * 2.5;

  const trailSteps = 4;
  const trail: { x: number; y: number; op: number }[] = [];
  for (let i = 1; i <= trailSteps; i++) {
    const tp = Math.max(0, progress - i * 0.06);
    if (tp >= 1) continue;
    const tPos = tp * totalLen;
    const tSegIdx = Math.min(Math.floor(tPos), totalLen - 1);
    const tt = tPos - tSegIdx;
    const tFrom = waypoints[tSegIdx];
    const tTo = waypoints[tSegIdx + 1];
    if (!tFrom || !tTo) continue;
    trail.push({
      x: tFrom.x + (tTo.x - tFrom.x) * tt + off.dx,
      y: tFrom.y + (tTo.y - tFrom.y) * tt + off.dy,
      op: 0.3 - i * 0.06,
    });
  }

  return (
    <>
      {trail.map((t, i) => (
        <div
          key={`trail_${packet.id}_${i}`}
          className="absolute rounded-full z-10"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: size * 0.5,
            height: size * 0.5,
            backgroundColor: packet.color,
            opacity: t.op,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
          }}
        />
      ))}
      <div
        className="absolute rounded-full z-10 group/dot cursor-pointer"
        style={{
          left: `${x}%`,
          top: `${y}%`,
          width: size,
          height: size,
          backgroundColor: packet.color,
          boxShadow: `0 0 ${size * 0.8}px ${packet.color}`,
          transform: "translate(-50%, -50%)",
          borderRadius: "50%",
          transition: "left 0.08s linear, top 0.08s linear",
        }}
      >
        <div
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{
            width: pulseSize,
            height: pulseSize,
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: packet.color,
          }}
        />
        <span className="absolute inset-0 flex items-center justify-center text-white font-bold"
          style={{ fontSize: `${size * 0.45}px`, lineHeight: 1, textShadow: "0 0 2px rgba(0,0,0,0.8)" }}
        >
          {routeLabel}
        </span>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover/dot:block bg-zinc-900 text-white text-[8px] px-1.5 py-0.5 rounded whitespace-nowrap z-50 border border-zinc-600">
          {packet.route} | {packet.status} | {Math.round(packet.progress * 100)}%
          {packet.sourceInput && <> | &quot;{packet.sourceInput.slice(0, 10)}&quot;</>}
        </div>
      </div>
    </>
  );
}

function QueueCluster({ packets, compPos, maxCount = 8 }: { packets: FlowPacket[]; compPos: { x: number; y: number }; maxCount?: number }) {
  if (packets.length === 0) return null;
  const show = packets.slice(0, maxCount);

  return (
    <div
      className="absolute z-10 flex flex-wrap gap-0.5"
      style={{
        left: `${compPos.x + 2}%`,
        top: `${compPos.y - 2}%`,
        width: `${Math.min(show.length * 4, 20)}px`,
      }}
    >
      {show.map((pkt) => {
        const isDiskFull = pkt.status === "disk_full";
        const isSwapping = pkt.status === "swapping";
        return (
          <div
            key={pkt.id}
            className="rounded-sm"
            style={{
              width: 4,
              height: 4,
              backgroundColor: isDiskFull ? "#ef4444" : isSwapping ? "#f59e0b" : pkt.color,
              opacity: 0.7,
            }}
            title={`${pkt.route} - ${pkt.status}${pkt.sourceInput ? ` (${pkt.sourceInput.slice(0, 10)})` : ""}`}
          />
        );
      })}
      {packets.length > maxCount && (
        <div className="text-[6px] text-zinc-500 ml-0.5">+{packets.length - maxCount}</div>
      )}
    </div>
  );
}

function MonitorScreen({ content, packets, lastAppArrivals, children }: { content?: string; packets?: FlowPacket[]; lastAppArrivals?: AppArrival[]; children?: ReactNode }) {
  if (children) {
    return (
      <div className="relative w-full h-full bg-black/90 rounded-sm overflow-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full bg-black/90 rounded-sm overflow-hidden font-mono text-[#00ff41] p-2 text-[8px] leading-tight">
      {packets && packets.length > 0 && (
        <div className="text-[6px] opacity-60 self-start mb-1">
          {packets.length} pkt
        </div>
      )}

      {lastAppArrivals && lastAppArrivals.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-1">
          {lastAppArrivals.slice(-5).map((arr, i) => (
            <div
              key={`${arr.name}-${i}`}
              className="flex items-center gap-0.5 px-1 py-0.5 rounded bg-zinc-800/80 text-green-300 text-[7px] animate-pulse"
            >
              <span>{arr.icon}</span>
              <span className="truncate max-w-[40px]">{arr.name}</span>
            </div>
          ))}
        </div>
      )}

      <div className="flex-1 w-full overflow-hidden">
        {content ? (
          <pre className="whitespace-pre-wrap break-all">{content.slice(-200)}</pre>
        ) : (
          <span className="opacity-40">_</span>
        )}
      </div>
    </div>
  );
}

function getComponentEntrance(id: string): { x: number; y: number } {
  const comp = COMPONENT_LAYOUT.find((c) => c.id === id);
  if (!comp) return { x: 50, y: 50 };
  return { x: comp.x, y: comp.y + comp.h };
}

function CornerChips() {
  return (
    <>
      {BUS_PATHS.map((bus) => {
        const corners = getBusCornerPoints(bus);
        if (corners.length === 0) return null;
        const pccase = COMPONENT_LAYOUT.find((c) => c.id === "pccase");
        if (!pccase) return null;
        return corners.map((wp, i) => {
          const isInside = wp.x >= pccase.x && wp.x <= pccase.x + pccase.w && wp.y >= pccase.y && wp.y <= pccase.y + pccase.h;
          if (!isInside) return null;
          return (
            <div
              key={`corner_${bus.id}_${i}`}
              className="absolute z-10 w-1.5 h-1.5 rounded-full"
              style={{
                left: `${wp.x}%`,
                top: `${wp.y}%`,
                backgroundColor: "#555",
                transform: "translate(-50%, -50%)",
                opacity: 0.5,
              }}
            />
          );
        });
      })}
    </>
  );
}

function WireLabels() {
  const { lang, mode } = useGame();

  const labels: { x: number; y: number; text: string }[] = [
    { x: 3, y: 53, text: t("wire.label.kbd", lang, mode) },
    { x: 49, y: 28, text: t("wire.label.hdmi", lang, mode) },
  ];

  return (
    <>
      {labels.map((l, i) => (
        <div
          key={`wirelabel_${i}`}
          className="absolute z-10 px-1 rounded bg-zinc-800/80 border border-zinc-600 text-[6px] text-zinc-400 font-bold leading-tight"
          style={{
            left: `${l.x}%`,
            top: `${l.y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          {l.text}
        </div>
      ))}
    </>
  );
}

export default function SimDeskView({
  children,
  packets = [],
  activeComponent,
  onComponentClick,
  lastAppArrivals,
  monitorContent,
  monitorScreen,
  showInterior = false,
  onToggleInterior,
}: SimDeskViewProps) {
  const { lang, mode } = useGame();
  const [hoveredComponent, setHoveredComponent] = useState<string | null>(null);

  const internalComponents = COMPONENT_LAYOUT.filter(
    (c) => !["keyboard", "mouse", "monitor", "pccase"].includes(c.id)
  );

  const queuedPackets = packets.filter((p) => p.status === "comp_queued" || p.status === "disk_full" || p.status === "swapping" || p.status === "bus_queued");

  const packetsAtComponent: Record<string, FlowPacket[]> = {};
  for (const pkt of queuedPackets) {
    const key = pkt.toId || pkt.fromId;
    if (!key) continue;
    if (!packetsAtComponent[key]) packetsAtComponent[key] = [];
    packetsAtComponent[key].push(pkt);
  }

  const busOccupancy: Record<string, number> = {};
  for (const pkt of packets) {
    if (pkt.status === "traveling" && pkt.busId) {
      busOccupancy[pkt.busId] = (busOccupancy[pkt.busId] ?? 0) + 1;
    }
  }

  const activePackets = packets.filter((p) => p.status === "traveling");

  return (
    <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-amber-700/30"
      style={{
        background: [
          "linear-gradient(180deg, rgba(139,94,60,0.4) 0%, rgba(92,58,30,0.5) 100%)",
          "repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.03) 40px, rgba(0,0,0,0.03) 41px)",
          "repeating-linear-gradient(0deg, transparent, transparent 12px, rgba(0,0,0,0.02) 12px, rgba(0,0,0,0.02) 13px)",
        ].join(","),
      }}
    >
      {/* SVG glow filter defs */}
      <svg className="absolute inset-0 pointer-events-none" style={{ width: "100%", height: "100%" }}>
        <CableGlowFilter />
      </svg>

      {/* Outside-case sub-lanes (keyboard→cpu) */}
      {BUS_PATHS.filter((b) => b.id === "bus_keyboard_cpu").map((bus) => (
        <OutsideSubLanes key={`outsidelanes_${bus.id}`} bus={bus} />
      ))}

      {/* Wire labels */}
      <WireLabels />

      {COMPONENT_LAYOUT.map((comp) => {
        const sprite = SPRITE_MAP[comp.spriteKey];
        if (!sprite) return null;

        const isInternal = internalComponents.some((c) => c.id === comp.id);
        const isCase = comp.id === "pccase";
        const isActive = activeComponent === comp.id || hoveredComponent === comp.id;

        if (isInternal) return null;

        return (
          <div
            key={comp.id}
            className={`absolute ${
              isCase || comp.id === "keyboard" || comp.id === "mouse" || comp.id === "monitor" ? "" : "hidden group-hover/pccase:block"
            }`}
            style={{
              left: `${comp.x}%`,
              top: `${comp.y}%`,
              width: `${comp.w}%`,
              height: `${comp.h}%`,
            }}
          >
            <div
              className="relative w-full h-full flex items-center justify-center cursor-pointer"
              onMouseEnter={() => setHoveredComponent(comp.id)}
              onMouseLeave={() => setHoveredComponent(null)}
              onClick={() => {
                if (comp.id === "pccase" && onToggleInterior) {
                  onToggleInterior();
                } else if (onComponentClick && isInternal) {
                  onComponentClick(comp.id);
                }
              }}
            >
              {/* Active glow behind component */}
              {isActive && comp.id !== "monitor" && (
                <div
                  className="absolute inset-[-4px] rounded-xl opacity-40"
                  style={{
                    boxShadow: `0 0 20px 4px ${comp.glowColor}`,
                  }}
                />
              )}

              {comp.id !== "monitor" && comp.id !== "pccase" && comp.id !== "keyboard" && comp.id !== "mouse" && (
                <PixelSprite data={sprite} size={32} className="w-8 h-8 object-contain" />
              )}
              {comp.id === "keyboard" && (
                <PixelSprite data={sprite} size={48} className="w-full h-full max-w-[140px] max-h-[60px] object-contain" />
              )}
              {comp.id === "mouse" && (
                <PixelSprite data={sprite} size={48} className="w-full h-full max-w-[60px] max-h-[60px] object-contain" />
              )}
              {comp.id === "pccase" && (
                <div className="relative w-full h-full flex items-center justify-center group/pccase">
                  <PixelSprite data={sprite} size={128} className="w-full h-full max-w-[220px] max-h-[340px] object-contain" />
                  {hoveredComponent === "pccase" && !showInterior && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-lg">
                      <span className="text-white text-xs font-bold px-2 py-1 bg-blue-600/80 rounded">
                        Click to open
                      </span>
                    </div>
                  )}
                  {showInterior && (
                    <>
                      <div className="absolute inset-0 bg-black/70 rounded-lg" />
                      {internalComponents.map((ic) => {
                        const icSprite = SPRITE_MAP[ic.spriteKey];
                        if (!icSprite) return null;
                        return (
                          <div
                            key={ic.id}
                            className="absolute cursor-pointer hover:brightness-150 hover:scale-110 transition-all"
                            onMouseEnter={() => setHoveredComponent(ic.id)}
                            onMouseLeave={() => setHoveredComponent(null)}
                            onClick={(e) => {
                              e.stopPropagation();
                              onComponentClick?.(ic.id);
                            }}
                            style={{
                              left: `${((ic.x - comp.x) / comp.w) * 100}%`,
                              top: `${((ic.y - comp.y) / comp.h) * 100}%`,
                              width: `${ic.w}%`,
                              height: `${ic.h}%`,
                            }}
                          >
                            <PixelSprite data={icSprite} size={48} className="w-full h-full object-contain max-w-[64px] max-h-[64px]" />
                            {hoveredComponent === ic.id && (
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[6px] px-1.5 py-0.5 rounded whitespace-nowrap border border-zinc-600">
                                {t(ic.labelKey, lang, mode)}
                                <div className="text-[5px] opacity-60 text-center mt-0.5">Click</div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                </div>
              )}
              {comp.id === "monitor" && (
                <div className="w-full h-full flex flex-col">
                  <div className="flex-[5] border-2 border-gray-700 rounded overflow-hidden bg-black shadow-lg shadow-blue-500/10 relative">
                    <MonitorScreen content={monitorContent} packets={packets} lastAppArrivals={lastAppArrivals} children={monitorScreen} />
                    {/* CRT scanline overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03]">
                      <div className="w-full h-px bg-green-500 animate-crt-scanline" />
                    </div>
                    {/* CRT glow */}
                    <div className="absolute inset-0 pointer-events-none z-10 shadow-[inset_0_0_20px_rgba(0,255,65,0.08)]" />
                  </div>
                  <div className="h-2 bg-gray-800 rounded-b mx-auto w-1/2" />
                  <div className="h-1 bg-gray-900 mx-auto w-1/4 rounded-full mt-0.5" />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Inside-case cable lines (above dark overlay) */}
      <div className="absolute inset-0 pointer-events-none">
        {BUS_PATHS.filter((bus) => {
          const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                             ["keyboard", "mouse", "monitor"].includes(bus.toId);
          return showInterior ? !isExternal : isExternal;
        }).map((bus) => (
          <CableBusLine
            key={bus.id}
            bus={bus}
            isActive={activePackets.some((p) => p.fromId === bus.fromId && p.toId === bus.toId)}
            occupancy={Math.min(busOccupancy[bus.id] ?? 0, bus.laneCount)}
          />
        ))}
      </div>

      {/* Corner elbow chips */}
      <CornerChips />

      {/* Queue clusters at component entrances */}
      {Object.entries(packetsAtComponent).map(([compId, compPackets]) => {
        const pos = getComponentEntrance(compId);
        return <QueueCluster key={compId} packets={compPackets} compPos={pos} />;
      })}

      {activePackets.filter((pkt) => {
        const bus = BUS_PATHS.find((b) => b.fromId === pkt.fromId && b.toId === pkt.toId);
        if (!bus) return false;
        const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                           ["keyboard", "mouse", "monitor"].includes(bus.toId);
        return showInterior ? !isExternal : isExternal;
      }).map((pkt) => {
        const bus = BUS_PATHS.find((b) => b.fromId === pkt.fromId && b.toId === pkt.toId)!;
        return <DataPacketDot key={pkt.id} packet={pkt} waypoints={getBusPathPoints(bus)} bus={bus} />;
      })}

      {children && <div className="absolute inset-0 z-20">{children}</div>}
    </div>
  );
}