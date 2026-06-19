'use client';

import { useRef, useEffect } from 'react';
import { ALL_MASCOT_MAP } from './mascot-data';

interface MascotAvatarProps {
  mascotId: string;
  size?: number;
}

export default function MascotAvatar({ mascotId, size = 64 }: MascotAvatarProps) {
    const mascot = ALL_MASCOT_MAP.get(mascotId);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const actualSize = Math.floor(size / 32) * 32 || 32;

  useEffect(() => {
  const mascot = ALL_MASCOT_MAP.get(mascotId);
    const canvas = canvasRef.current;
    if (!mascot || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scale = actualSize / 32;
    const rows = mascot.data.length;
    if (rows === 0) return;

    canvas.width = actualSize;
    canvas.height = actualSize;

    ctx.imageSmoothingEnabled = false;

    for (let y = 0; y < rows; y++) {
      const row = mascot.data[y];
      if (!row) continue;
      for (let x = 0; x < row.length; x++) {
        const idx = parseInt(row[x]!, 10);
        const color = mascot.palette[idx];
        if (!color || color === 'transparent') continue;
        ctx.fillStyle = color;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }, [mascotId, actualSize]);

  if (!mascot) {
    return (
      <div
        style={{ width: actualSize, height: actualSize }}
        className="bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center"
      >
        <i aria-hidden="true" className="fi fi-sr-user text-zinc-400 dark:text-zinc-500" style={{ fontSize: size * 0.4 }} />
      </div>
    );
  }

  return (
    <canvas
      ref={canvasRef}
      style={{ width: actualSize, height: actualSize, imageRendering: 'pixelated' }}
    />
  );
}
