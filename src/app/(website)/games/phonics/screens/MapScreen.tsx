"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useGame } from "../context";
import type { MascotState, MapBuilding } from "../types";
import { TILE_PX, GAME_CONFIG } from "../constants";
import { getFlatGrid, BUILDINGS, MASCOT_START } from "../map";
import { PALETTE, TILE_WATER, TILE_GRASS, TILE_SAND, TILE_PATH, BUILDING_PHONICS, BUILDING_DECO, MASCOT_IDLE, MASCOT_WALK } from "../sprites";
import type { SpriteData } from "../types";
import ModeSelectModal from "../components/ModeSelectModal";

const GRID = getFlatGrid();
const TILE_SPRITES: Record<string, SpriteData> = {
  W: TILE_WATER,
  G: TILE_GRASS,
  S: TILE_SAND,
  P: TILE_PATH,
  B: TILE_GRASS, // building tiles drawn over grass
};

function drawSprite(ctx: CanvasRenderingContext2D, sprite: SpriteData, destX: number, destY: number, scale: number) {
  for (let y = 0; y < sprite.height; y++) {
    for (let x = 0; x < sprite.width; x++) {
      const idx = sprite.pixels[y]?.[x];
      if (!idx || idx === 0) continue;
      const color = PALETTE[idx];
      if (!color || color === "transparent") continue;
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.floor(destX + x * scale),
        Math.floor(destY + y * scale),
        Math.ceil(scale),
        Math.ceil(scale)
      );
    }
  }
}

export default function MapScreen() {
  const { save, setScreen, startRound } = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const mascotRef = useRef<MascotState>({
    tileX: MASCOT_START.tileX,
    tileY: MASCOT_START.tileY,
    targetTileX: MASCOT_START.tileX,
    targetTileY: MASCOT_START.tileY,
    walking: false,
    facing: "right",
    frameIndex: 0,
  });
  const animFrameRef = useRef<number>(0);
  const walkTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTickRef = useRef(0);
  const [pendingBuilding, setPendingBuilding] = useState<MapBuilding | null>(null);

  // Responsive canvas scale
  const [canvasScale, setCanvasScale] = useState(1);
  const COLS = GRID[0]?.length ?? 20;
  const ROWS = GRID.length;
  const BASE_W = COLS * TILE_PX;
  const BASE_H = ROWS * TILE_PX;

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const cw = containerRef.current.clientWidth;
      setCanvasScale(Math.min(1, cw / BASE_W));
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [BASE_W]);

  // Main draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.imageSmoothingEnabled = false;
    ctx.clearRect(0, 0, BASE_W, BASE_H);

    // Draw tiles
    GRID.forEach((row, ry) => {
      row.forEach((cell, cx) => {
        const sprite = TILE_SPRITES[cell] ?? TILE_GRASS;
        drawSprite(ctx, sprite, cx * TILE_PX, ry * TILE_PX, TILE_PX / 16);
      });
    });

    // Draw buildings
    BUILDINGS.forEach((b) => {
      const sprite = b.id === "B1" ? BUILDING_PHONICS : BUILDING_DECO;
      const scale = TILE_PX / 16;
      // Buildings are 16w × 24h — center them over 1 tile
      drawSprite(ctx, sprite, b.x * TILE_PX, (b.y - 1) * TILE_PX, scale);
      // Label below building
      if (b.interactive) {
        ctx.fillStyle = "#C8A44E";
        ctx.font = `bold ${Math.floor(TILE_PX * 0.3)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(b.label, (b.x + 0.5) * TILE_PX, (b.y + 1.2) * TILE_PX);
      }
    });

    // Draw mascot
    const m = mascotRef.current;
    frameTickRef.current++;
    if (frameTickRef.current % 8 === 0 && m.walking) {
      m.frameIndex = (m.frameIndex + 1) % MASCOT_WALK.length;
    }
    const mascotSprite = m.walking ? MASCOT_WALK[m.frameIndex] : MASCOT_IDLE;
    const scale = TILE_PX / 16;
    const mx = m.tileX * TILE_PX - (m.facing === "left" ? TILE_PX * 0.3 : 0);
    const my = m.tileY * TILE_PX - TILE_PX * 0.5;
    // Flip for left facing
    if (m.facing === "left") {
      ctx.save();
      ctx.scale(-1, 1);
      ctx.translate(-BASE_W, 0);
      drawSprite(ctx, mascotSprite, BASE_W - mx - TILE_PX, my, scale);
      ctx.restore();
    } else {
      drawSprite(ctx, mascotSprite, mx, my, scale);
    }

    animFrameRef.current = requestAnimationFrame(draw);
  }, [BASE_W, BASE_H]);

  useEffect(() => {
    animFrameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [draw]);

  // Walk mascot to tile, then check for building
  const walkTo = useCallback((tileX: number, tileY: number) => {
    const m = mascotRef.current;
    if (walkTimerRef.current) clearTimeout(walkTimerRef.current);
    m.facing = tileX < m.tileX ? "left" : "right";
    const steps = Math.abs(tileX - m.tileX) + Math.abs(tileY - m.tileY);
    m.walking = true;
    m.targetTileX = tileX;
    m.targetTileY = tileY;

    // Animate step by step
    let step = 0;
    const totalSteps = Math.max(steps, 1);
    const dx = (tileX - m.tileX) / totalSteps;
    const dy = (tileY - m.tileY) / totalSteps;
    function doStep() {
      step++;
      m.tileX = Math.round(m.tileX + dx);
      m.tileY = Math.round(m.tileY + dy);
      if (step < totalSteps) {
        walkTimerRef.current = setTimeout(doStep, GAME_CONFIG.MASCOT_TILE_MS);
      } else {
        m.tileX = tileX;
        m.tileY = tileY;
        m.walking = false;
        // Check building
        const building = BUILDINGS.find((b) => b.x === tileX && b.y === tileY);
        if (building?.interactive) {
          setPendingBuilding(building);
        }
      }
    }
    walkTimerRef.current = setTimeout(doStep, GAME_CONFIG.MASCOT_TILE_MS);
  }, []);

  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = BASE_W / rect.width;
    const scaleY = BASE_H / rect.height;
    const cx = Math.floor((e.clientX - rect.left) * scaleX / TILE_PX);
    const cy = Math.floor((e.clientY - rect.top) * scaleY / TILE_PX);
    walkTo(cx, cy);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#A2D2FF] dark:bg-[#0A1128]">
      {/* HUD */}
      <div className="flex items-center justify-between px-4 py-2 retro-border bg-[#FDFBF7] dark:bg-[#101F42]">
        <span className="font-bold text-[#1C1C1C] dark:text-[#F7E1A0] text-sm tracking-widest" style={{ fontFamily: "var(--font-mali)" }}>
          PHONICS ISLAND
        </span>
        <div className="flex items-center gap-4">
          {save && (
            <span className="text-xs font-bold text-[#C8A44E]">🪙 {save.phonemeCoins}</span>
          )}
          <button
            id="map-settings-btn"
            className="retro-border px-2 py-1 text-xs font-bold bg-[#FDFBF7] dark:bg-[#101F42] text-[#1C1C1C] dark:text-[#F7E1A0] hover:opacity-90"
            onClick={() => setScreen("settings")}
          >
            ⚙
          </button>
        </div>
      </div>

      {/* Canvas wrapper — responsive */}
      <div ref={containerRef} className="flex-1 flex items-center justify-center p-2 overflow-hidden">
        <div
          style={{
            width: BASE_W * canvasScale,
            height: BASE_H * canvasScale,
            position: "relative",
          }}
        >
          <canvas
            ref={canvasRef}
            width={BASE_W}
            height={BASE_H}
            style={{
              imageRendering: "pixelated",
              width: "100%",
              height: "100%",
              cursor: "pointer",
            }}
            onClick={handleCanvasClick}
            id="map-canvas"
            aria-label="Phonics Island map — click to move your character"
            role="img"
          />
        </div>
      </div>

      {/* Mode Select Modal */}
      {pendingBuilding && (
        <ModeSelectModal
          building={pendingBuilding}
          onStart={(config) => {
            setPendingBuilding(null);
            startRound(config);
          }}
          onClose={() => setPendingBuilding(null)}
        />
      )}

      {/* Tip */}
      <p className="text-center text-xs text-[#1C1C1C]/40 dark:text-[#F7E1A0]/30 pb-2">
        Click on the map to walk — enter a building to play!
      </p>
    </div>
  );
}
