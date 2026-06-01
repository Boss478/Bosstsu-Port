"use client";

import { useState, useRef, useEffect } from "react";
import PixelSprite from "./PixelSprite";
import { SPRITE_MAP } from "../sprites";

interface LabToolsProps {
  checklistItems?: string[];
  arrowTarget?: { x: number; y: number } | null;
}

type ActiveTool = "magnifier" | "checklist" | "guide" | null;

export default function LabTools({ checklistItems = [], arrowTarget }: LabToolsProps) {
  const [activeTool, setActiveTool] = useState<ActiveTool>(null);
  const [magnifierPos, setMagnifierPos] = useState({ x: 0, y: 0 });
  const magnifierRef = useRef<HTMLDivElement>(null);
  const guideRef = useRef<HTMLDivElement>(null);

  const toggle = (tool: ActiveTool) => {
    setActiveTool((prev) => (prev === tool ? null : tool));
  };

  useEffect(() => {
    if (activeTool !== "magnifier") return;

    const handleMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const rect = target.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const offsetY = e.clientY - rect.top;
      setMagnifierPos({ x: e.clientX, y: e.clientY });

      const cloned = target.cloneNode(true) as HTMLElement;
      cloned.style.cssText = `
        transform: scale(2);
        transform-origin: ${offsetX}px ${offsetY}px;
        width: ${rect.width}px;
        height: ${rect.height}px;
        position: absolute;
        top: 0;
        left: 0;
        pointer-events: none;
      `;
      const container = magnifierRef.current;
      if (container) {
        container.innerHTML = "";
        container.appendChild(cloned);
      }
    };

    document.addEventListener("mousemove", handleMove);
    return () => document.removeEventListener("mousemove", handleMove);
  }, [activeTool]);

  useEffect(() => {
    if (activeTool !== "guide" || !arrowTarget) return;

    const el = guideRef.current;
    if (!el) return;

    const animate = () => {
      if (!el) return;
      const pulse = Math.sin(Date.now() / 300) * 0.3 + 0.7;
      el.style.transform = `translate(-50%, -50%) scale(${pulse})`;
      requestAnimationFrame(animate);
    };

    const raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [activeTool, arrowTarget]);

  const toolButtons: { id: ActiveTool; icon: keyof typeof SPRITE_MAP; label: string }[] = [
    { id: "magnifier", icon: "magnifier_icon", label: "Magnifier" },
    { id: "checklist", icon: "checklist_icon", label: "Checklist" },
    { id: "guide", icon: "guide_arrow_icon", label: "Guide" },
  ];

  return (
    <>
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-zinc-900/90 border border-zinc-700 rounded-lg px-3 py-2 shadow-lg">
        {toolButtons.map((btn) => (
          <button
            key={btn.id}
            onClick={() => toggle(btn.id)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs font-bold transition-all ${
              activeTool === btn.id
                ? "bg-blue-600 text-white shadow-md"
                : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white"
            }`}
          >
            <PixelSprite data={SPRITE_MAP[btn.icon]} size={16} />
            <span className="hidden sm:inline">{btn.label}</span>
          </button>
        ))}
      </div>

      {activeTool === "magnifier" && (
        <div
          ref={magnifierRef}
          className="fixed z-50 pointer-events-none overflow-hidden border-2 border-blue-400 rounded-lg shadow-2xl"
          style={{
            left: magnifierPos.x + 20,
            top: magnifierPos.y - 80,
            width: 150,
            height: 150,
            borderRadius: 75,
            background: "#111",
          }}
        />
      )}

      {activeTool === "checklist" && checklistItems.length > 0 && (
        <div className="fixed right-4 top-20 z-40 w-56 bg-zinc-900/95 border border-zinc-700 rounded-lg p-3 shadow-2xl">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-zinc-700">
            <PixelSprite data={SPRITE_MAP.checklist_icon} size={16} />
            <span className="text-white text-xs font-bold uppercase tracking-wider">
              Requirements
            </span>
          </div>
          <ul className="space-y-1.5">
            {checklistItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-zinc-300 text-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-1 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeTool === "guide" && arrowTarget && (
        <div
          ref={guideRef}
          className="fixed z-40 pointer-events-none"
          style={{
            left: arrowTarget.x,
            top: arrowTarget.y,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-5 h-5 bg-red-500 rotate-45 shadow-lg shadow-red-500/50" />
            </div>
            <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-red-400 text-[10px] font-bold whitespace-nowrap">
              ▼
            </div>
          </div>
        </div>
      )}
    </>
  );
}
