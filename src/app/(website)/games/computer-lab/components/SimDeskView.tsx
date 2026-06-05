"use client";

import { useState, type ReactNode } from "react";
import PixelSprite from "./PixelSprite";
import { SPRITE_MAP } from "../sprites";
import { COMPONENT_LAYOUT, BUS_PATHS, getBusPathPoints, getBusCornerPoints } from "../simulation/positions";
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

function getBusParamsAtPoint(bus: typeof BUS_PATHS[0], p: { x: number; y: number }) {
  const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                     ["keyboard", "mouse", "monitor"].includes(bus.toId);
  if (!isExternal) {
    return { laneCount: bus.laneCount, spacing: 0.4, isExternal: false };
  }
  const isOutside = p.x < 14.5 || p.x > 45.5 || p.y < 12.5 || p.y > 67.5;
  if (isOutside) {
    return { laneCount: 3, spacing: 0.65, isExternal: true };
  } else {
    return { laneCount: bus.laneCount, spacing: 0.4, isExternal: true };
  }
}

function splitSegmentAtBoundaries(
  p1: { x: number; y: number },
  p2: { x: number; y: number }
): { x: number; y: number }[] {
  const boundaries = {
    xMin: 14.5,
    xMax: 45.5,
    yMin: 12.5,
    yMax: 67.5,
  };

  const intersections: { t: number; p: { x: number; y: number } }[] = [];

  // Check vertical boundary lines (x = C)
  for (const C of [boundaries.xMin, boundaries.xMax]) {
    const dx = p2.x - p1.x;
    if (Math.abs(dx) > 1e-6) {
      const t = (C - p1.x) / dx;
      if (t > 0 && t < 1) {
        intersections.push({
          t,
          p: { x: C, y: p1.y + t * (p2.y - p1.y) },
        });
      }
    }
  }

  // Check horizontal boundary lines (y = C)
  for (const C of [boundaries.yMin, boundaries.yMax]) {
    const dy = p2.y - p1.y;
    if (Math.abs(dy) > 1e-6) {
      const t = (C - p1.y) / dy;
      if (t > 0 && t < 1) {
        intersections.push({
          t,
          p: { x: p1.x + t * (p2.x - p1.x), y: C },
        });
      }
    }
  }

  // Sort intersections by t
  intersections.sort((a, b) => a.t - b.t);

  return [p1, ...intersections.map((item) => item.p), p2];
}

function getRefinedBusPathPoints(bus: typeof BUS_PATHS[0]): { x: number; y: number }[] {
  const points = getBusPathPoints(bus);
  if (points.length < 2) return points;
  const refined: { x: number; y: number }[] = [points[0]];
  for (let i = 0; i < points.length - 1; i++) {
    const segmentPoints = splitSegmentAtBoundaries(points[i], points[i + 1]);
    refined.push(...segmentPoints.slice(1));
  }
  return refined;
}

function isSegmentOutside(p1: { x: number; y: number }, p2: { x: number; y: number }): boolean {
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;
  return midX < 14.5 || midX > 45.5 || midY < 12.5 || midY > 67.5;
}

function getPathOffsets(bus: typeof BUS_PATHS[0], laneIndex: number): { dx: number; dy: number }[] {
  const points = getRefinedBusPathPoints(bus);
  if (points.length < 2) return points.map(() => ({ dx: 0, dy: 0 }));

  const offsets: { dx: number; dy: number }[] = [];

  for (let i = 0; i < points.length; i++) {
    const p = points[i];
    const { laneCount, spacing } = getBusParamsAtPoint(bus, p);
    const targetLaneIndex = laneIndex % laneCount;
    const mid = (laneCount - 1) / 2;
    const off = (targetLaneIndex - mid) * spacing;

    let nx = 0;
    let ny = 0;

    if (i === 0) {
      const dx = points[1].x - p.x;
      const dy = points[1].y - p.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        nx = -dy / len;
        ny = dx / len;
      }
    } else if (i === points.length - 1) {
      const dx = p.x - points[i - 1].x;
      const dy = p.y - points[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len > 0) {
        nx = -dy / len;
        ny = dx / len;
      }
    } else {
      const dx1 = p.x - points[i - 1].x;
      const dy1 = p.y - points[i - 1].y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      let nx1 = 0, ny1 = 0;
      if (len1 > 0) {
        nx1 = -dy1 / len1;
        ny1 = dx1 / len1;
      }

      const dx2 = points[i + 1].x - p.x;
      const dy2 = points[i + 1].y - p.y;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      let nx2 = 0, ny2 = 0;
      if (len2 > 0) {
        nx2 = -dy2 / len2;
        ny2 = dx2 / len2;
      }

      const sx = nx1 + nx2;
      const sy = ny1 + ny2;
      const slen = Math.sqrt(sx * sx + sy * sy);
      if (slen > 0) {
        const factor = 2 / (slen * slen);
        const miterFactor = Math.min(factor, 2.0);
        nx = sx * miterFactor;
        ny = sy * miterFactor;
      }
    }

    offsets.push({ dx: nx * off, dy: ny * off });
  }

  return offsets;
}

function getCableBusPaths(bus: typeof BUS_PATHS[0]): { d: string; color: string; isCasing?: boolean }[] {
  const points = getRefinedBusPathPoints(bus);
  if (points.length < 2) return [];

  const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                     ["keyboard", "mouse", "monitor"].includes(bus.toId);

  const paths: { d: string; color: string; isCasing?: boolean }[] = [];

  // If external, render casings for outside segments only
  if (isExternal) {
    let currentCasingPath: string[] = [];
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (isSegmentOutside(p1, p2)) {
        if (currentCasingPath.length === 0) {
          currentCasingPath.push(`M${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`);
        }
        currentCasingPath.push(`L${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`);
      } else {
        if (currentCasingPath.length > 0) {
          paths.push({
            d: currentCasingPath.join(" "),
            color: "#1e293b",
            isCasing: true,
          });
          currentCasingPath = [];
        }
      }
    }
    if (currentCasingPath.length > 0) {
      paths.push({
        d: currentCasingPath.join(" "),
        color: "#1e293b",
        isCasing: true,
      });
    }
  }

  // Draw the lanes
  const maxLanes = isExternal ? 3 : bus.laneCount;

  for (let li = 0; li < maxLanes; li++) {
    const parts: string[] = [];

    for (let i = 0; i < points.length; i++) {
      const p = points[i];
      const { laneCount, spacing } = getBusParamsAtPoint(bus, p);
      const targetLaneIndex = li % laneCount;
      const mid = (laneCount - 1) / 2;
      const off = (targetLaneIndex - mid) * spacing;

      let nx = 0;
      let ny = 0;

      if (i === 0) {
        const dx = points[1].x - p.x;
        const dy = points[1].y - p.y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          nx = -dy / len;
          ny = dx / len;
        }
      } else if (i === points.length - 1) {
        const dx = p.x - points[i - 1].x;
        const dy = p.y - points[i - 1].y;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 0) {
          nx = -dy / len;
          ny = dx / len;
        }
      } else {
        const dx1 = p.x - points[i - 1].x;
        const dy1 = p.y - points[i - 1].y;
        const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
        let nx1 = 0, ny1 = 0;
        if (len1 > 0) {
          nx1 = -dy1 / len1;
          ny1 = dx1 / len1;
        }

        const dx2 = points[i + 1].x - p.x;
        const dy2 = points[i + 1].y - p.y;
        const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
        let nx2 = 0, ny2 = 0;
        if (len2 > 0) {
          nx2 = -dy2 / len2;
          ny2 = dx2 / len2;
        }

        const sx = nx1 + nx2;
        const sy = ny1 + ny2;
        const slen = Math.sqrt(sx * sx + sy * sy);
        if (slen > 0) {
          const factor = 2 / (slen * slen);
          const miterFactor = Math.min(factor, 2.0);
          nx = sx * miterFactor;
          ny = sy * miterFactor;
        }
      }

      const px = p.x + nx * off;
      const py = p.y + ny * off;
      parts.push(`${i === 0 ? "M" : "L"}${px.toFixed(2)} ${py.toFixed(2)}`);
    }

    paths.push({
      d: parts.join(" "),
      color: bus.color,
    });
  }

  return paths;
}

function CableBusLine({ bus, isActive }: { bus: typeof BUS_PATHS[0]; isActive: boolean; occupancy?: number }) {
  const paths = getCableBusPaths(bus);
  if (paths.length === 0) return null;

  const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                     ["keyboard", "mouse", "monitor"].includes(bus.toId);

  return (
    <svg className="absolute inset-0 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ width: "100%", height: "100%" }}>
      {paths.map((p, idx) => {
        if (p.isCasing) {
          return (
            <path
              key={`casing_${idx}`}
              d={p.d}
              fill="none"
              stroke={p.color}
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity={0.85}
            />
          );
        }

        return (
          <path
            key={`lane_${idx}`}
            d={p.d}
            fill="none"
            stroke={p.color}
            strokeWidth="0.15"
            strokeLinecap="round"
            opacity={isActive ? 0.95 : isExternal ? 0.65 : 0.4}
            filter={isActive ? `url(#${GLOW_FILTER_ID})` : undefined}
            className={isActive ? "animate-pulse" : undefined}
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
  const laneIndex = packet.laneIndex ?? 0;

  const getInterpolatedPos = (pVal: number) => {
    const pPos = pVal * totalLen;
    const pSegIdx = Math.min(Math.floor(pPos), totalLen - 1);
    const pt = pPos - pSegIdx;

    const pFrom = waypoints[pSegIdx];
    const pTo = waypoints[pSegIdx + 1];
    if (!pFrom || !pTo) return { x: 50, y: 50 };

    const baseX = pFrom.x + (pTo.x - pFrom.x) * pt;
    const baseY = pFrom.y + (pTo.y - pFrom.y) * pt;

    const offsets = getPathOffsets(bus, laneIndex);
    const offStart = offsets[pSegIdx];
    const offEnd = offsets[pSegIdx + 1];

    if (!offStart || !offEnd) return { x: baseX, y: baseY };

    const dx = offStart.dx + (offEnd.dx - offStart.dx) * pt;
    const dy = offStart.dy + (offEnd.dy - offStart.dy) * pt;

    return { x: baseX + dx, y: baseY + dy };
  };

  const currentPos = getInterpolatedPos(progress);
  const x = currentPos.x;
  const y = currentPos.y;

  const size = getDotSize(packet.dataSize);

  const routeLabel = packet.route === "compute" ? "C" : packet.route === "storage" ? "S" : "G";
  const pulseSize = size * 2.5;

  const trailSteps = 4;
  const trail: { x: number; y: number; op: number }[] = [];
  for (let i = 1; i <= trailSteps; i++) {
    const tp = Math.max(0, progress - i * 0.06);
    if (tp >= 1) continue;
    const tPos = getInterpolatedPos(tp);
    trail.push({
      x: tPos.x,
      y: tPos.y,
      op: 0.3 - i * 0.06,
    });
  }

  return (
    <>
      {trail.map((t, i) => (
        <div
          key={`trail_${packet.id}_${i}`}
          className="absolute rounded-full"
          style={{
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: size * 0.5,
            height: size * 0.5,
            backgroundColor: packet.color,
            opacity: t.op,
            transform: "translate(-50%, -50%)",
            borderRadius: "50%",
            zIndex: 3,
          }}
        />
      ))}
      <div
        className="absolute rounded-full group/dot cursor-pointer"
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
          zIndex: 3,
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
      className="absolute flex flex-wrap gap-0.5"
      style={{
        left: `${compPos.x + 2}%`,
        top: `${compPos.y - 2}%`,
        width: `${Math.min(show.length * 4, 20)}px`,
        zIndex: 3,
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
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                left: `${wp.x}%`,
                top: `${wp.y}%`,
                backgroundColor: "#555",
                transform: "translate(-50%, -50%)",
                opacity: 0.5,
                zIndex: 3,
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
              zIndex: (comp.id === "keyboard" || comp.id === "mouse" || comp.id === "monitor") ? 4 : undefined,
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
                      <div className="absolute inset-0 bg-zinc-950 rounded-lg" style={{ zIndex: 1 }} />
                      {internalComponents.map((ic) => {
                        const icSprite = SPRITE_MAP[ic.spriteKey];
                        if (!icSprite) return null;

                        // Find active packets currently processing on this chip
                        const processingPackets = packets.filter(
                          (p) => p.status === "processing" && p.toId === ic.id
                        );

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
                              zIndex: ic.id === "motherboard" ? 1 : 4,
                            }}
                          >
                            <PixelSprite
                              data={icSprite}
                              size={48}
                              className={`w-full h-full object-contain max-w-[64px] max-h-[64px] ${
                                ic.id === "fan" ? "animate-spin-blade" : ""
                              }`}
                            />
                            {processingPackets.length > 0 && (
                              <div
                                className="absolute inset-0 m-auto rounded-full animate-ping opacity-75"
                                style={{
                                  width: "12px",
                                  height: "12px",
                                  backgroundColor: processingPackets[0].color,
                                  boxShadow: `0 0 8px ${processingPackets[0].color}`,
                                  zIndex: 10,
                                }}
                              />
                            )}
                            {hoveredComponent === ic.id && (
                              <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[6px] px-1.5 py-0.5 rounded whitespace-nowrap border border-zinc-600" style={{ zIndex: 20 }}>
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
                     <MonitorScreen content={monitorContent} packets={packets} lastAppArrivals={lastAppArrivals}>{monitorScreen}</MonitorScreen>
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
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
        {BUS_PATHS.filter((bus) => {
          const isExternal = ["keyboard", "mouse", "monitor"].includes(bus.fromId) ||
                             ["keyboard", "mouse", "monitor"].includes(bus.toId);
          return isExternal || showInterior;
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
        return isExternal || showInterior;
      }).map((pkt) => {
        const bus = BUS_PATHS.find((b) => b.fromId === pkt.fromId && b.toId === pkt.toId)!;
        return <DataPacketDot key={pkt.id} packet={pkt} waypoints={getRefinedBusPathPoints(bus)} bus={bus} />;
      })}

      {children && <div className="absolute inset-0 z-20">{children}</div>}
    </div>
  );
}