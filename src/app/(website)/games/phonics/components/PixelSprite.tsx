"use client";

import { useRef, useEffect, memo } from "react";
import { PALETTE } from "../sprites";
import type { SpriteData } from "../types";

interface PixelSpriteProps {
  data: SpriteData;
  size?: number;
  nightMode?: boolean;
  className?: string;
}

function PixelSpriteInner({ data, size = 32, nightMode = false, className }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale: how many canvas pixels per sprite pixel
    const scale = size / 16;
    const w = data.width * scale;
    const h = data.height * scale;

    canvas.width = Math.floor(w);
    canvas.height = Math.floor(h);

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const idx = data.pixels[y]?.[x];
        if (idx === undefined || idx === 0) continue;
        const color = PALETTE[idx];
        if (!color || color === "transparent") continue;
        ctx.fillStyle = color;
        ctx.fillRect(
          Math.floor(x * scale),
          Math.floor(y * scale),
          Math.ceil(scale),
          Math.ceil(scale)
        );
      }
    }
  }, [data, size, nightMode]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated" }}
      aria-hidden="true"
    />
  );
}

export default memo(PixelSpriteInner);
