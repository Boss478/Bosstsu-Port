'use client';

import { useRef, useEffect, useState, useMemo } from 'react';
import { drawSprite, blinkSprite, HEAD_CONFIG } from '../sprites';
import { COMPANIONS } from '../constants';
import {
  AVATAR_NOX_HEAD, AVATAR_MIRA_HEAD, AVATAR_CHIP_HEAD,
  AVATAR_FOX_HEAD, AVATAR_CAT_HEAD, AVATAR_BEAR_HEAD,
  AVATAR_BUNNY_HEAD, AVATAR_PENGUIN_HEAD, AVATAR_ALIEN_HEAD, AVATAR_NINJA_HEAD, AVATAR_ROBOT_HEAD,
  MASCOT_IDLE, MIRA_IDLE, CHIP_IDLE,
  FOX_IDLE, CAT_IDLE, BEAR_IDLE, BUNNY_IDLE, PENGUIN_IDLE, ALIEN_IDLE, NINJA_IDLE, ROBOT_IDLE,
} from '../sprites';
import type { CompanionId, SpriteData } from '../types';

type AnimationState = 'idle' | 'celebrate' | 'shake' | 'think';

const HEAD_SPRITES: Record<string, SpriteData> = {
  nox: AVATAR_NOX_HEAD, mira: AVATAR_MIRA_HEAD, chip: AVATAR_CHIP_HEAD,
  fox: AVATAR_FOX_HEAD, cat: AVATAR_CAT_HEAD, bear: AVATAR_BEAR_HEAD,
  bunny: AVATAR_BUNNY_HEAD, penguin: AVATAR_PENGUIN_HEAD,
  alien: AVATAR_ALIEN_HEAD, ninja: AVATAR_NINJA_HEAD,
  robot: AVATAR_ROBOT_HEAD,
};

const FULL_SPRITES: Record<string, SpriteData> = {
  nox: MASCOT_IDLE, mira: MIRA_IDLE, chip: CHIP_IDLE,
  fox: FOX_IDLE, cat: CAT_IDLE, bear: BEAR_IDLE,
  bunny: BUNNY_IDLE, penguin: PENGUIN_IDLE,
  alien: ALIEN_IDLE, ninja: NINJA_IDLE,
  robot: ROBOT_IDLE,
};

interface MascotCanvasProps {
  companionId: CompanionId;
  variant?: 'head' | 'full';
  size: number;
  animate?: boolean;
  animationState?: AnimationState;
  className?: string;
}

export default function MascotCanvas({
  companionId,
  variant = 'head',
  size,
  animate = true,
  animationState = 'idle',
  className = '',
}: MascotCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [blinking, setBlinking] = useState(false);

  const companionData = COMPANIONS[companionId] ?? COMPANIONS.nox;
  const params = companionData.animParams;

  const spriteData = (variant === 'full' ? FULL_SPRITES : HEAD_SPRITES)[companionId]
    ?? (variant === 'full' ? FULL_SPRITES : HEAD_SPRITES).nox;
  const config = variant === 'head'
    ? (HEAD_CONFIG[companionId] ?? HEAD_CONFIG.nox)
    : { x: 0, y: 0, scale: 1 };

  // Blink interval
  useEffect(() => {
    if (!animate) return;
    const interval = setInterval(() => {
      setBlinking(true);
      setTimeout(() => setBlinking(false), params.blinkDuration);
    }, params.blinkInterval);
    return () => clearInterval(interval);
  }, [animate, params.blinkInterval, params.blinkDuration]);

  // Draw to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 32, 32);
    const sprite = blinking && variant === 'head'
      ? blinkSprite(spriteData, companionId)
      : spriteData;
    drawSprite(ctx, sprite, config.x, config.y, config.scale);
  }, [companionId, variant, blinking, animate, spriteData, config]);

  const cssClass = useMemo(() => {
    if (!animate) return className;
    const anim = animationState === 'idle' ? 'animate-breathe' : `animate-${animationState}`;
    return `${anim} ${className}`;
  }, [animationState, animate, className]);

  return (
    <canvas
      ref={canvasRef}
      width={32}
      height={32}
      className={`image-rendering-pixelated ${cssClass}`}
      style={{
        width: size,
        height: size,
        '--breathe-height': `${params.breatheHeight}px`,
        '--breathe-speed': `${params.breatheSpeed}s`,
      } as React.CSSProperties}
    />
  );
}
