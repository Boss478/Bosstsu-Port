"use client";

import { useRef, useEffect, useState } from "react";
import type { ScreenShellProps } from "../types";
import { useGame } from "../context";
import { PALETTE, PONG_PADDLE, PONG_BALL } from "../sprites";

const W = 600;
const H = 400;
const PADDLE_W = 16;
const PADDLE_H = 64;
const BALL_SIZE = 8;
const PADDLE_MARGIN = 20;
const PADDLE_SPEED = 5;
const AI_FOLLOW_SPEED = 0.6;
const INITIAL_SPEED = 4;
const WIN_SCORE = 5;

type GameState = "start" | "playing" | "gameover";

interface GameData {
  state: GameState;
  ball: { x: number; y: number; vx: number; vy: number };
  leftY: number;
  rightY: number;
  leftScore: number;
  rightScore: number;
  winner: "left" | "right" | null;
  speed: number;
}

function createBall(speed: number) {
  const angle = (Math.random() - 0.5) * Math.PI * 0.5;
  const dir = Math.random() > 0.5 ? 1 : -1;
  return {
    x: W / 2 - BALL_SIZE / 2,
    y: H / 2 - BALL_SIZE / 2,
    vx: Math.cos(angle) * speed * dir,
    vy: Math.sin(angle) * speed,
  };
}

function initialData(): GameData {
  return {
    state: "start",
    ball: createBall(INITIAL_SPEED),
    leftY: H / 2 - PADDLE_H / 2,
    rightY: H / 2 - PADDLE_H / 2,
    leftScore: 0,
    rightScore: 0,
    winner: null,
    speed: INITIAL_SPEED,
  };
}

function drawSprite(
  ctx: CanvasRenderingContext2D,
  data: typeof PONG_PADDLE,
  x: number,
  y: number,
  scale: number,
) {
  for (let sy = 0; sy < data.height; sy++) {
    for (let sx = 0; sx < data.width; sx++) {
      const pi = data.pixels[sy]?.[sx];
      if (!pi || pi === 0) continue;
      const c = PALETTE[pi];
      if (!c) continue;
      ctx.fillStyle = c;
      ctx.fillRect(x + sx * scale, y + sy * scale, scale, scale);
    }
  }
}

export default function PongScreen({ onNavigate }: ScreenShellProps) {
  const game = useGame();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dRef = useRef<GameData>(initialData());
  const keys = useRef<Set<string>>(new Set());
  const playSfxRef = useRef(game.playSfx);
  const navRef = useRef(onNavigate);

  useEffect(() => { playSfxRef.current = game.playSfx; });
  useEffect(() => { navRef.current = onNavigate; });

  const [gs, setGs] = useState<GameState>("start");
  const [score, setScore] = useState({ l: 0, r: 0 });
  const [winner, setWinner] = useState<"left" | "right" | null>(null);

  function resetGame() {
    const nd = initialData();
    nd.state = "playing";
    dRef.current = nd;
    setGs("playing");
    setScore({ l: 0, r: 0 });
    setWinner(null);
  }

  function draw() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, W, H);

    const d = dRef.current;

    ctx.strokeStyle = "#333";
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(W / 2, 0);
    ctx.lineTo(W / 2, H);
    ctx.stroke();
    ctx.setLineDash([]);

    drawSprite(ctx, PONG_PADDLE, PADDLE_MARGIN, d.leftY, 4);
    drawSprite(ctx, PONG_PADDLE, W - PADDLE_MARGIN - PADDLE_W, d.rightY, 4);
    drawSprite(ctx, PONG_BALL, d.ball.x, d.ball.y, 2);

    ctx.fillStyle = "#444";
    ctx.font = "bold 40px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(String(d.leftScore), W / 2 - 50, 12);
    ctx.fillText(String(d.rightScore), W / 2 + 50, 12);
  }

  useEffect(() => {
    let playing = true;

    function update() {
      const d = dRef.current;
      if (d.state !== "playing") return;
      const k = keys.current;

      if (k.has("w") || k.has("W")) d.leftY = Math.max(0, d.leftY - PADDLE_SPEED);
      if (k.has("s") || k.has("S")) d.leftY = Math.min(H - PADDLE_H, d.leftY + PADDLE_SPEED);

      const aiTarget = d.ball.y + BALL_SIZE / 2 - PADDLE_H / 2;
      const aiDiff = aiTarget - d.rightY;
      const aiMove = d.speed * AI_FOLLOW_SPEED;
      if (Math.abs(aiDiff) > aiMove) {
        d.rightY += Math.sign(aiDiff) * aiMove;
      }
      d.rightY = Math.max(0, Math.min(H - PADDLE_H, d.rightY));

      d.ball.x += d.ball.vx;
      d.ball.y += d.ball.vy;

      if (d.ball.y <= 0) { d.ball.y = 0; d.ball.vy = Math.abs(d.ball.vy); }
      if (d.ball.y >= H - BALL_SIZE) { d.ball.y = H - BALL_SIZE; d.ball.vy = -Math.abs(d.ball.vy); }

      if (
        d.ball.vx < 0 &&
        d.ball.x <= PADDLE_MARGIN + PADDLE_W &&
        d.ball.x > PADDLE_MARGIN &&
        d.ball.y + BALL_SIZE > d.leftY &&
        d.ball.y < d.leftY + PADDLE_H
      ) {
        d.ball.x = PADDLE_MARGIN + PADDLE_W;
        const hitPos = (d.ball.y + BALL_SIZE / 2 - (d.leftY + PADDLE_H / 2)) / (PADDLE_H / 2);
        const angle = hitPos * Math.PI * 0.4;
        d.speed *= 1.05;
        d.ball.vx = Math.cos(angle) * d.speed;
        d.ball.vy = Math.sin(angle) * d.speed;
        playSfxRef.current("click");
      }

      if (
        d.ball.vx > 0 &&
        d.ball.x + BALL_SIZE >= W - PADDLE_MARGIN - PADDLE_W &&
        d.ball.x + BALL_SIZE < W - PADDLE_MARGIN &&
        d.ball.y + BALL_SIZE > d.rightY &&
        d.ball.y < d.rightY + PADDLE_H
      ) {
        d.ball.x = W - PADDLE_MARGIN - PADDLE_W - BALL_SIZE;
        const hitPos = (d.ball.y + BALL_SIZE / 2 - (d.rightY + PADDLE_H / 2)) / (PADDLE_H / 2);
        const angle = hitPos * Math.PI * 0.4;
        d.speed *= 1.05;
        d.ball.vx = -Math.cos(angle) * d.speed;
        d.ball.vy = Math.sin(angle) * d.speed;
        playSfxRef.current("click");
      }

      if (d.ball.x < -BALL_SIZE) {
        d.rightScore++;
        playSfxRef.current("victory");
        if (d.rightScore >= WIN_SCORE) {
          d.state = "gameover";
          d.winner = "right";
          setGs("gameover");
          setScore({ l: d.leftScore, r: d.rightScore });
          setWinner("right");
          return;
        }
        d.speed = INITIAL_SPEED;
        d.ball = createBall(INITIAL_SPEED);
        setScore({ l: d.leftScore, r: d.rightScore });
      }
      if (d.ball.x > W) {
        d.leftScore++;
        playSfxRef.current("victory");
        if (d.leftScore >= WIN_SCORE) {
          d.state = "gameover";
          d.winner = "left";
          setGs("gameover");
          setScore({ l: d.leftScore, r: d.rightScore });
          setWinner("left");
          return;
        }
        d.speed = INITIAL_SPEED;
        d.ball = createBall(INITIAL_SPEED);
        setScore({ l: d.leftScore, r: d.rightScore });
      }
    }

    function loop() {
      if (!playing) return;
      update();
      draw();
      requestAnimationFrame(loop);
    }

    requestAnimationFrame(loop);
    return () => { playing = false; };
  }, []);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      keys.current.add(e.key);
      if (e.code === "Space") {
        e.preventDefault();
        const d = dRef.current;
        if (d.state === "start" || d.state === "gameover") {
          resetGame();
        }
      }
    };
    const onUp = (e: KeyboardEvent) => { keys.current.delete(e.key); };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, []);

  function handleTouch(e: React.TouchEvent<HTMLCanvasElement>) {
    const d = dRef.current;
    if (d.state !== "playing") return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    const y = e.touches[0].clientY - rect.top;
    d.leftY = Math.max(0, Math.min(H - PADDLE_H, y - PADDLE_H / 2));
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-full p-4 space-y-4">
      <div className="relative" style={{ width: W, height: H }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="border-2 border-green-500/30 rounded-lg block"
          style={{ imageRendering: "pixelated" }}
          onTouchMove={handleTouch}
          onTouchStart={handleTouch}
        />
        <div
          className="absolute inset-0 pointer-events-none rounded-lg"
          style={{
            background: "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,0,0,0.12) 2px, rgba(0,0,0,0.12) 4px)",
          }}
        />
        {gs === "start" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-lg">
            <p className="text-green-400 text-3xl font-black tracking-widest mb-4">PONG</p>
            <p className="text-green-300/80 text-sm animate-pulse">Press SPACE to start</p>
          </div>
        )}
        {gs === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-lg gap-3">
            <p className="text-yellow-400 text-xl font-black">
              {winner === "left" ? "YOU WIN!" : "AI WINS!"}
            </p>
            <p className="text-zinc-400 text-sm font-mono">
              {score.l} – {score.r}
            </p>
            <div className="flex gap-3 mt-1">
              <button
                onClick={resetGame}
                className="px-5 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-bold text-sm transition-colors"
              >
                Play Again
              </button>
              <button
                onClick={() => navRef.current("menu")}
                className="px-5 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-zinc-200 font-bold text-sm transition-colors"
              >
                Back to Menu
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
