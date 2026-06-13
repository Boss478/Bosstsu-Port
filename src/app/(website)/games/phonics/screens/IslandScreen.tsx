'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useGame } from '../context';
import {
  drawSprite,
  drawMascotIdle,
  BUILDING_PHONICS,
  AVATAR_NOX,
  AVATAR_MIRA,
  AVATAR_CHIP,
  SUN_16,
  SUN_16B,
  CLOUDS,
  BIRD_V,
  FISH,
  BOAT,
  DOCK,
  SPLASH,
} from '../sprites';
import ModeSelectModal from '../components/ModeSelectModal';
import type { MapBuilding, GameCategory } from '../types';

const BASE_W = 800;
const BASE_H = 600;
const ISLAND_SIZE = 64;
const ISLAND_RENDER = ISLAND_SIZE * 2.5;
const ISLAND_HALF = ISLAND_RENDER / 2;
const WAVE_MS = 300;
const SUN_MS = 800;
const MASCOT_MS = 1500;
const MASCOT_PX = 96;
const MASCOT_SCALE = MASCOT_PX / 16;

interface IslandDef {
  id: string;
  label: string;
  cx: number;
  cy: number;
  category: GameCategory;
  accent: string;
}

const ISLANDS: IslandDef[] = [
  { id: 'cove', label: 'Phonics Cove', cx: 180, cy: 200, category: 'phonics', accent: '#2EC4B6' },
  { id: 'volcano', label: 'Spelling Volcano', cx: 620, cy: 180, category: 'spelling', accent: '#FF5733' },
  { id: 'peak', label: 'Definitions Peak', cx: 400, cy: 440, category: 'definitions', accent: '#9B59B6' },
];

const PATH_DOTS: [number, number][] = [
  [180, 200], [420, 180], [620, 180],
  [620, 180], [520, 320], [400, 440],
  [400, 440], [280, 330], [180, 200],
];

const MASCOT_MSGS: Record<string, string[]> = {
  nox: [
    'Welcome back, scholar!',
    'Knowledge is the greatest treasure.',
    'You have {coins} coins \u2014 wisely earned.',
    'Tap an island to begin your studies.',
    'Every letter mastered builds a stronger mind.',
    'Consistency matters more than speed.',
    'You have completed {completedRounds} rounds.',
    'Review is the mother of learning.',
    'A focused mind learns twice as fast.',
    'Your current streak: {streak}.',
    'Precision over speed \u2014 quality over quantity.',
  ],
  mira: [
    "Hey, you're back! Ready for fun?",
    "Let's zap some letters!",
    "You've got {coins} magical coins!",
    'Pick an island, any island!',
    'I believe in you! You can do this!',
    'Learning is an adventure!',
    'Wow, {completedRounds} rounds done!',
    "You're getting better every day!",
    'Keep going, superstar!',
    'A {streak}-round streak? Amazing!',
    "Let me show you some magic tricks!",
    'Each word you master makes you stronger!',
  ],
  chip: [
    'Returning user detected. Initializing session.',
    'Analysis: {coins} coins accumulated.',
    'Select an island to begin training module.',
    'Phonics module: letter-sound correspondence.',
    'Progress: {completedRounds} rounds completed.',
    'Performance metric: {streak}-round streak active.',
    'Optimal learning strategy: consistent daily practice.',
    'Data suggests you excel at pattern recognition.',
    'System ready. Awaiting input.',
    'Vocabulary database expanding with each session.',
    'Learning rate: optimal.',
    'New content available in Definitions Peak.',
  ],
};

function blockIsland(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  blocks: [number, number, number, number, string][],
  scale: number,
) {
  for (const [bx, by, bw, bh, color] of blocks) {
    ctx.fillStyle = color;
    ctx.fillRect((cx + bx) * scale, (cy + by) * scale, bw * scale, bh * scale);
  }
}

function drawCoveIsland(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, dark: boolean) {
  const g = dark ? '#1A433A' : '#80ED99';
  const G = dark ? '#0F2A22' : '#2E7D32';
  const s = dark ? '#3D3B3C' : '#F7E1A0';
  blockIsland(ctx, cx, cy, [
    [-30, -10, 60, 40, g],
    [-35, -5, 70, 30, g],
    [-25, -15, 50, 50, g],
    [-30, -10, 20, 50, s],
    [10, -10, 20, 50, s],
    [-35, 15, 70, 10, s],
    [-5, 5, 10, 10, G],
    [20, 0, 10, 10, G],
    [-15, 0, 10, 10, G],
    [-25, -5, 10, 10, G],
    [15, -5, 10, 10, G],
  ], scale);
  drawSprite(ctx, BUILDING_PHONICS, (cx - 16) * scale, (cy - 24) * scale, 2 * scale);
}

function drawVolcanoIsland(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, dark: boolean) {
  const rock = dark ? '#2C2C2C' : '#888888';
  const darkRock = dark ? '#1A1A1A' : '#5C4033';
  blockIsland(ctx, cx, cy, [
    [-20, -25, 40, 50, rock],
    [-30, -10, 60, 40, rock],
    [-15, -30, 30, 55, darkRock],
    [-25, 5, 50, 20, darkRock],
    [-10, -28, 20, 8, '#FF5733'],
    [-8, -26, 16, 6, '#FFBA08'],
    [-12, 15, 24, 10, rock],
    [10, -15, 15, 35, rock],
    [-25, -15, 15, 30, rock],
  ], scale);
}

function drawPeakIsland(ctx: CanvasRenderingContext2D, cx: number, cy: number, scale: number, dark: boolean) {
  const snow = dark ? '#BDC3C7' : '#FFFFFF';
  const shadow = dark ? '#7F8C8D' : '#BDC3C7';
  const g = dark ? '#1A433A' : '#80ED99';
  blockIsland(ctx, cx, cy, [
    [-30, 5, 60, 20, g],
    [-25, -5, 50, 30, g],
    [-20, -20, 40, 40, g],
    [-15, -30, 30, 50, snow],
    [-10, -35, 20, 55, snow],
    [-5, -30, 10, 50, shadow],
    [-20, -15, 40, 10, g],
    [15, 5, 15, 15, g],
    [-30, 5, 15, 15, g],
    [-5, -20, 10, 10, shadow],
  ], scale);
}

function drawWaveLine(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number,
  scale: number, phase: number, dark: boolean,
) {
  const base = dark ? '#101F42' : '#4EA8DE';
  const hl = dark ? '#1A3A5C' : '#A2D2FF';
  ctx.fillStyle = base;
  ctx.fillRect(x * scale, (y + phase * 2) * scale, w * scale, 2 * scale);
  ctx.fillStyle = hl;
  ctx.fillRect(x * scale, (y + phase * 2) * scale, w * scale, scale);
}

export default function IslandScreen({
  showBoatReturn,
  onBoatDone,
}: {
  showBoatReturn: boolean;
  onBoatDone: () => void;
}) {
  const { companion, setCompanion, save, setScreen, startRound } = useGame();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);
  const waveRef = useRef(0);
  const mascotTickRef = useRef(0);
  const sunTickRef = useRef(0);
  const msgShown = useRef(false);
  const boatActiveRef = useRef(false);
  const cloudOffsets = useRef([100, 200, 300, 400]);
  const birdOffsets = useRef([100, 300, 500]);
  const fishOffsets = useRef([200, 400, 600]);
  const [pendingBuilding, setPendingBuilding] = useState<MapBuilding | null>(null);
  const [msgIdx, setMsgIdx] = useState(0);

  useEffect(() => {
    if (!msgShown.current) {
      msgShown.current = true;
    }
  }, []);

  useEffect(() => {
    if (showBoatReturn) {
      boatActiveRef.current = true;
    }
  }, [showBoatReturn]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    function resize() {
      const wrapper = wrapperRef.current;
      if (!wrapper || !canvas) return;
      const rect = wrapper.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      const s = Math.min(rect.width / BASE_W, rect.height / BASE_H);
      canvas.width = Math.round(BASE_W * s * dpr);
      canvas.height = Math.round(BASE_H * s * dpr);
      canvas.style.width = `${Math.round(BASE_W * s)}px`;
      canvas.style.height = `${Math.round(BASE_H * s)}px`;
      canvas.dataset.scale = String(s);
      canvas.dataset.dpr = String(dpr);
    }

    resize();
    window.addEventListener('resize', resize);

    const waveTimer = setInterval(() => { waveRef.current = (waveRef.current + 1) % 2; }, WAVE_MS);
    const sunTimer = setInterval(() => { sunTickRef.current = (sunTickRef.current + 1) % 2; }, SUN_MS);
    const mascotTimer = setInterval(() => { mascotTickRef.current = (mascotTickRef.current + 1) % 4; }, MASCOT_MS);
    let boatStarted = false;
    let splashTimer: ReturnType<typeof setTimeout> | null = null;

    function draw() {
      if (!canvas || !ctx) return;
      const s = parseFloat(canvas.dataset.scale || '1');
      const dpr = parseFloat(canvas.dataset.dpr || '1');
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      const dark = document.documentElement.classList.contains('dark');
      const wavePhase = waveRef.current;
      const sunFrame = sunTickRef.current;
      const mFrame = mascotTickRef.current;

      // Sky gradient
      const grad = ctx.createLinearGradient(0, 0, 0, BASE_H * s);
      if (dark) {
        grad.addColorStop(0, '#0A1128');
        grad.addColorStop(0.5, '#101F42');
        grad.addColorStop(1, '#0A1128');
      } else {
        grad.addColorStop(0, '#FFD6A8');
        grad.addColorStop(0.4, '#A2D2FF');
        grad.addColorStop(1, '#4EA8DE');
      }
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, BASE_W * s, BASE_H * s);

      // Stars (dark mode)
      if (dark) {
        ctx.fillStyle = '#FFFFFF';
        const stars = [
          [50, 40], [120, 80], [200, 30], [350, 60], [500, 50],
          [600, 90], [700, 40], [760, 70], [150, 130], [420, 100],
        ];
        for (const [sx, sy] of stars) {
          ctx.fillRect(sx * s, sy * s, 2 * s, 2 * s);
        }
      }

      // Sun
      drawSprite(ctx, sunFrame === 0 ? SUN_16 : SUN_16B, 720 * s, 60 * s, 3 * s);

      // Clouds (drift right to left)
      const offsets = cloudOffsets.current;
      offsets[0] -= 0.3 * s; if (offsets[0] < -CLOUDS[0].width * 2 * s) offsets[0] = BASE_W * s;
      offsets[1] -= 0.5 * s; if (offsets[1] < -CLOUDS[1].width * 2 * s) offsets[1] = BASE_W * s;
      offsets[2] -= 0.4 * s; if (offsets[2] < -CLOUDS[2].width * 2 * s) offsets[2] = BASE_W * s;
      offsets[3] -= 0.6 * s; if (offsets[3] < -CLOUDS[3].width * 2 * s) offsets[3] = BASE_W * s;
      for (let i = 0; i < 4; i++) {
        drawSprite(ctx, CLOUDS[i % CLOUDS.length], offsets[i], (50 + i * 40) * s, 2 * s);
      }

      // Birds
      const birdFrame = frameRef.current % 2;
      const birds = birdOffsets.current;
      for (let i = 0; i < 3; i++) {
        birds[i] += (0.8 + i * 0.2) * s;
        if (birds[i] > BASE_W * s + 20) birds[i] = -30 * s;
        drawSprite(ctx, BIRD_V[birdFrame], birds[i], (120 + i * 30) * s, 2 * s);
      }

      // Ocean
      const oceanY = 380;
      ctx.fillStyle = dark ? '#101F42' : '#4EA8DE';
      ctx.fillRect(0, oceanY * s, BASE_W * s, (BASE_H - oceanY) * s);
      for (let wy = oceanY + 5; wy < BASE_H; wy += 15) {
        drawWaveLine(ctx, 0, wy, BASE_W, s, wavePhase, dark);
      }
      for (let wy = oceanY + 12; wy < BASE_H; wy += 15) {
        drawWaveLine(ctx, 0, wy, BASE_W, s, 1 - wavePhase, dark);
      }

      // Dotted paths
      ctx.fillStyle = dark ? '#F7E1A0' : '#FFFFFF';
      for (let i = 0; i + 1 < PATH_DOTS.length; i++) {
        const [x1, y1] = PATH_DOTS[i];
        const [x2, y2] = PATH_DOTS[i + 1];
        const steps = 6;
        for (let k = 1; k < steps; k++) {
          const t = k / steps;
          ctx.beginPath();
          ctx.arc((x1 + (x2 - x1) * t) * s, (y1 + (y2 - y1) * t) * s, 2 * s, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Fish
      const fishFrame = frameRef.current % 2;
      const fish = fishOffsets.current;
      for (let i = 0; i < 3; i++) {
        fish[i] += 0.3 * s;
        if (fish[i] > BASE_W * s + 20) fish[i] = -20 * s;
        drawSprite(ctx, FISH[fishFrame], fish[i], (420 + i * 40) * s, 2 * s);
      }

      // Islands
      const islandDrawers: [number, number, (c: CanvasRenderingContext2D, cx: number, cy: number, sc: number, d: boolean) => void][] = [
        [ISLANDS[0].cx, ISLANDS[0].cy, drawCoveIsland],
        [ISLANDS[1].cx, ISLANDS[1].cy, drawVolcanoIsland],
        [ISLANDS[2].cx, ISLANDS[2].cy, drawPeakIsland],
      ];
      for (const [ix, iy, fn] of islandDrawers) {
        fn(ctx, ix, iy, s, dark);
        const dockX = (ix - 16) * s;
        const dockY = (iy + ISLAND_RENDER / 2 / s) * s + 2 * s;
        drawSprite(ctx, DOCK, dockX, dockY, 2 * s);

        const island = ISLANDS.find(i => i.cx === ix && i.cy === iy);
        if (island) {
          ctx.font = `bold ${Math.floor(14 * s)}px monospace`;
          ctx.textAlign = 'center';
          ctx.fillStyle = dark ? '#D4AF37' : '#1C1C1C';
          ctx.fillText(island.label, ix * s, (iy + ISLAND_RENDER / 2 / s + 22) * s);
        }
      }

      // Mascot
      drawMascotIdle(ctx, mFrame, 700 * s, 480 * s, MASCOT_SCALE * s);

      // Boat animation
      if (boatActiveRef.current) {
        if (!boatStarted) {
          boatStarted = true;
        }
        const t = Math.min(1, (frameRef.current % 300) / 200);
        const boatX = (820 - 640 * t) * s;
        const boatY = (240 + 50 * Math.sin(t * Math.PI)) * s;
        drawSprite(ctx, BOAT, boatX, boatY, 2 * s);

        if (t >= 1 && !splashTimer) {
          const spX = (ISLANDS[0].cx - 16) * s;
          const spY = (ISLANDS[0].cy + ISLAND_RENDER / 2 / s) * s + 2 * s;
          drawSprite(ctx, SPLASH, spX, spY, 2 * s);
          splashTimer = setTimeout(() => {
            boatActiveRef.current = false;
            onBoatDone();
            setMsgIdx(0);
          }, 2000);
        }
      }

      ctx.restore();
      frameRef.current++;
      requestAnimationFrame(draw);
    }

    const raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      clearInterval(waveTimer);
      clearInterval(sunTimer);
      clearInterval(mascotTimer);
      if (splashTimer) clearTimeout(splashTimer);
    };
  }, [onBoatDone]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (pendingBuilding) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const s = parseFloat(canvas.dataset.scale || '1');
    const clickX = (e.clientX - rect.left) / s;
    const clickY = (e.clientY - rect.top) / s;

    for (const island of ISLANDS) {
      const dx = clickX - island.cx;
      const dy = clickY - island.cy;
      if (dx * dx + dy * dy < ISLAND_HALF * ISLAND_HALF) {
        setTimeout(() => {
          setPendingBuilding({
            id: island.id,
            x: island.cx,
            y: island.cy,
            interactive: true,
            label: island.label,
            category: island.category,
          });
        }, 300);
        return;
      }
    }
  }, [pendingBuilding]);

  const messages = MASCOT_MSGS[companion] ?? MASCOT_MSGS.nox;
  const currentMsg = (messages[msgIdx % messages.length] ?? '')
    .replace('{coins}', String(save?.phonemeCoins ?? 0))
    .replace('{completedRounds}', String(save?.totalRoundsPlayed ?? 0))
    .replace('{streak}', String(save?.currentStreak ?? 0));

  const cycleMessage = useCallback(() => {
    setMsgIdx(i => (i + 1) % messages.length);
  }, [messages.length]);

  const cycleCompanion = useCallback(() => {
    const order: ('nox' | 'mira' | 'chip')[] = ['nox', 'mira', 'chip'];
    const idx = order.indexOf(companion);
    setCompanion(order[(idx + 1) % order.length]);
  }, [companion, setCompanion]);

  const avatarSprite = companion === 'mira' ? AVATAR_MIRA : companion === 'chip' ? AVATAR_CHIP : AVATAR_NOX;

  const handleStartGame = useCallback((config: Parameters<typeof startRound>[0]) => {
    setPendingBuilding(null);
    setScreen('game');
    startRound(config);
  }, [setScreen, startRound]);

  return (
    <div
      id="island-map-wrapper"
      ref={wrapperRef}
      className="relative w-full h-full min-h-[400px] overflow-hidden"
      tabIndex={0}
      role="application"
      aria-label="Island stage selector"
    >
      <canvas
        ref={canvasRef}
        className="block mx-auto cursor-pointer"
        onClick={handleCanvasClick}
        role="img"
        aria-label="Interactive island map with Phonics Cove, Spelling Volcano, and Definitions Peak"
      />

      <div className="absolute top-0 left-0 right-0 retro-border bg-[#FDFBF7] dark:bg-[#101F42] flex items-center justify-between px-4 py-2 z-10">
        <span className="font-bold text-sm tracking-widest text-[#1C1C1C] dark:text-[#F7E1A0]">
          ISLANDS
        </span>
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-[#C8A44E]">
            {'\uD83E\uDE99'} {save?.phonemeCoins ?? 0}
          </span>
          <button
            onClick={cycleCompanion}
            className="w-8 h-8 retro-border bg-[#FDFBF7] dark:bg-[#0A1128] flex items-center justify-center hover:opacity-80 active:scale-95 transition-transform"
            aria-label={`Current companion: ${companion}. Click to switch.`}
            title={`Companion: ${companion}`}
          >
            <canvas
              ref={(el) => {
                if (el) {
                  const c = el.getContext('2d');
                  if (c) {
                    c.clearRect(0, 0, 16, 16);
                    drawSprite(c, avatarSprite, 0, 0, 1);
                  }
                }
              }}
              width={16}
              height={16}
              className="w-6 h-6 image-rendering-pixelated"
            />
          </button>
        </div>
      </div>

      <div
        className="absolute bottom-24 right-4 z-10 max-w-[240px] cursor-pointer"
        onClick={cycleMessage}
        role="button"
        tabIndex={0}
        aria-label="Companion message"
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') cycleMessage(); }}
      >
        <div className="retro-border bg-[#FDFBF7] dark:bg-[#101F42] p-3 text-xs leading-relaxed text-[#1C1C1C] dark:text-[#F7E1A0]">
          {currentMsg}
        </div>
      </div>

      {pendingBuilding && (
        <ModeSelectModal
          building={pendingBuilding}
          onStart={handleStartGame}
          onClose={() => setPendingBuilding(null)}
        />
      )}
    </div>
  );
}
