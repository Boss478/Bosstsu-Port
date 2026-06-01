"use client";

import { useRef, useEffect, memo } from "react";
import { PALETTE } from "../sprites";
import type { SpriteData } from "../types";

interface PixelSpriteProps {
  data: SpriteData;
  size?: 16 | 32 | 48 | 64 | 96 | 128 | 256;
  className?: string;
}

function PixelSpriteInner({ data, size = 32, className }: PixelSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const scale = size / 32;
    const w = data.width * scale;
    const h = data.height * scale;

    canvas.width = w;
    canvas.height = h;

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < data.height; y++) {
      for (let x = 0; x < data.width; x++) {
        const paletteIndex = data.pixels[y]?.[x];
        if (paletteIndex === undefined || paletteIndex === 0) continue;
        const color = PALETTE[paletteIndex];
        if (!color) continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }, [data, size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ imageRendering: "pixelated" }}
    />
  );
}

export default memo(PixelSpriteInner);
