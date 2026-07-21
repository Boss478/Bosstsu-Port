'use client';

import { useRef, useEffect, useState } from 'react';
import { ALL_MASCOT_MAP } from './mascot-data';
import { drawSprite, blinkSprite, ACC_SPRITES } from './mascot-sprites';

interface MascotAvatarProps {
  mascotId: string;
  size?: number;
  variant?: 'head' | 'full';
  animate?: boolean;
}

export default function MascotAvatar({
  mascotId,
  size = 64,
  variant = 'head',
  animate = false,
}: MascotAvatarProps) {
  const mascot = ALL_MASCOT_MAP.get(mascotId);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blinking, setBlinking] = useState(false);

  const actualSize = Math.floor(size / 32) * 32 || 32;
  const params = mascot?.animParams;

  useEffect(() => {
    if (!animate || !params) return;
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), params.blinkDuration);
    }, params.blinkInterval);
    return () => clearInterval(interval);
  }, [animate, params?.blinkInterval, params?.blinkDuration]);

  useEffect(() => {
    const mascot = ALL_MASCOT_MAP.get(mascotId);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 32, 32);

    if (!mascot) return;

    if (mascot.spriteData) {
      const sprite = mascot.spriteData[variant];
      const displaySprite = blinking && variant === 'head'
        ? blinkSprite(sprite, mascotId)
        : sprite;
      drawSprite(ctx, displaySprite, 0, 0, 1);
      const accId = mascot.spriteAccessory;
      if (accId) {
        const accSprite = ACC_SPRITES[accId];
        if (accSprite) {
          drawSprite(ctx, accSprite, 0, 0, 1);
        }
      }
    } else {
      const rows = mascot.data.length;
      if (rows === 0) return;
      const scale = 32 / 32;
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
    }
  }, [mascotId, variant, blinking]);

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
      width={32}
      height={32}
      className="image-rendering-pixelated"
      style={{
        width: actualSize,
        height: actualSize,
        '--breathe-height': params ? `${params.breatheHeight}px` : undefined,
        '--breathe-speed': params ? `${params.breatheSpeed}s` : undefined,
      } as React.CSSProperties}
    />
  );
}
