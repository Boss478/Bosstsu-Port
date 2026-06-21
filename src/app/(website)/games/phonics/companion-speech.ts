import { COMPANION_BUBBLE_STYLES } from './constants';
import type { CompanionId } from './types';

function spacedText(text: string): string {
  return text.split('').join(' ');
}

function haikuFormat(text: string): string {
  const lines = text
    .replace(/[.!?]+$/, '')
    .split(/(?<=[.!?])\s+/)
    .filter(Boolean);
  return lines.join('\n');
}

export function formatWithSpeechStyle(companionId: CompanionId, text: string): string {
  const config = COMPANION_BUBBLE_STYLES[companionId] ?? COMPANION_BUBBLE_STYLES.nox;
  const { prefix, suffix, format } = config.voice;

  if (format === 'haiku') {
    return haikuFormat(text);
  }

  let result = text;
  if (format === 'spaced') {
    const cleaned = result.replace(/\s/g, '');
    result = ` ${spacedText(cleaned)} `;
  }

  return `${prefix}${result}${suffix}`;
}

export function getEntranceAnimationClass(companionId: CompanionId): string {
  const config = COMPANION_BUBBLE_STYLES[companionId] ?? COMPANION_BUBBLE_STYLES.nox;
  const map: Record<string, string> = {
    'glide-down': 'animate-glide-down',
    'scale-bounce': 'animate-scale-bounce',
    scanline: 'animate-scanline',
    'slide-left': 'animate-slide-left',
    pounce: 'animate-pounce',
    'fade-in': 'animate-companion-fade-in',
    'bounce-in': 'animate-bounce-in',
    'slide-up': 'animate-companion-slide-up',
    'warp-in': 'animate-warp-in',
    'spin-in': 'animate-spin-in',
  };
  return map[config.style.entranceAnimation] ?? 'animate-slide-up-drawer';
}

export function getIdleAnimationClass(companionId: CompanionId): string {
  const config = COMPANION_BUBBLE_STYLES[companionId] ?? COMPANION_BUBBLE_STYLES.nox;
  const map: Record<string, string> = {
    'gentle-turn': 'animate-gentle-turn',
    'bouncy-hover': 'animate-bouncy-hover',
    'robotic-twitch': 'animate-robotic-twitch',
    'tail-swish': 'animate-tail-swish',
    'paw-stretch': 'animate-paw-stretch',
    'slow-rock': 'animate-slow-rock',
    'ear-wiggle': 'animate-ear-wiggle',
    wobble: 'animate-wobble',
    'float-wobble': 'animate-float-wobble',
    still: '',
  };
  return map[config.style.idleAnimation] ?? '';
}
