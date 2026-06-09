'use client';

import type { CardTier } from './cards';

interface CardFrameProps {
  tier: CardTier;
  children?: React.ReactNode;
  namePlate?: string;
  size?: 'album' | 'modal' | 'toast';
  showBack?: boolean;
  holographic?: boolean;
}

const TIER_FRAME = {
  common: {
    primary: '#a1a1aa',
    secondary: '#e4e4e7',
    bg: '#fafafa',
    namePlate: '#d4d4d8',
    gem: '#71717a',
    plateText: '#52525b',
    ornament: 'M 15 30 L 15 18 L 27 18',
  },
  uncommon: {
    primary: '#22c55e',
    secondary: '#86efac',
    bg: '#f0fdf4',
    namePlate: '#bbf7d0',
    gem: '#16a34a',
    plateText: '#166534',
    ornament: 'M 15 28 Q 22 15 28 22 Q 32 28 22 30',
  },
  rare: {
    primary: '#3b82f6',
    secondary: '#93c5fd',
    bg: '#eff6ff',
    namePlate: '#bfdbfe',
    gem: '#2563eb',
    plateText: '#1e3a5f',
    ornament: 'M 15 25 L 20 15 L 25 25 M 20 15 L 20 22',
  },
  'ultra-rare': {
    primary: '#a855f7',
    secondary: '#d8b4fe',
    bg: '#faf5ff',
    namePlate: '#e9d5ff',
    gem: '#7c3aed',
    plateText: '#4c1d95',
    ornament: 'M 18 15 L 20 20 L 25 22 L 20 24 L 18 29 L 16 24 L 11 22 L 16 20 Z',
  },
  legendary: {
    primary: '#f59e0b',
    secondary: '#fde68a',
    bg: '#fffbeb',
    namePlate: '#fde68a',
    gem: '#d97706',
    plateText: '#78350f',
    ornament: 'M 15 28 Q 20 12 28 15 Q 32 17 30 22 M 20 18 Q 22 22 25 20',
  },
};

const TIER_BACK = {
  common: {
    bg: '#d4d4d8',
    accent: '#a1a1aa',
    emblem:
      'M 80 180 L 100 140 L 120 180 Z M 80 180 L 60 160 L 100 140 M 120 180 L 140 160 L 100 140',
    symbol: '⚔',
  },
  uncommon: {
    bg: '#bbf7d0',
    accent: '#22c55e',
    emblem: 'M 100 140 Q 80 160 85 180 Q 100 190 100 190 Q 100 190 115 180 Q 120 160 100 140 Z',
    symbol: '🍀',
  },
  rare: {
    bg: '#bfdbfe',
    accent: '#3b82f6',
    emblem:
      'M 100 140 L 105 155 L 120 155 L 108 165 L 112 180 L 100 170 L 88 180 L 92 165 L 80 155 L 95 155 Z',
    symbol: '✦',
  },
  'ultra-rare': {
    bg: '#d8b4fe',
    accent: '#a855f7',
    emblem:
      'M 100 135 Q 110 150 125 145 Q 115 158 120 175 Q 100 165 80 175 Q 85 158 75 145 Q 90 150 100 135 Z M 100 150 L 103 158 L 112 160 L 105 165 L 107 175 L 100 168 L 93 175 L 95 165 L 88 160 L 97 158 Z',
    symbol: '⭐',
  },
  legendary: {
    bg: '#fde68a',
    accent: '#f59e0b',
    emblem:
      'M 85 170 L 100 140 L 115 170 L 140 170 L 120 185 L 128 210 L 100 192 L 72 210 L 80 185 L 60 170 Z',
    symbol: '👑',
  },
};

const TIER_GLOW: Record<CardTier, string> = {
  common: '161,161,170',
  uncommon: '34,197,94',
  rare: '59,130,246',
  'ultra-rare': '168,85,247',
  legendary: '245,158,11',
};

function CornerOrnament({ d, color }: { d: string; color: string }) {
  return <path d={d} stroke={color} strokeWidth="1.5" fill="none" strokeLinecap="round" />;
}

export function CardFrame({
  tier,
  children,
  namePlate,
  size = 'album',
  showBack,
  holographic = false,
}: CardFrameProps) {
  const frame = TIER_FRAME[tier];
  const back = showBack ? TIER_BACK[tier] : null;

  const gemCx = size === 'toast' ? '15' : size === 'modal' ? '20' : '17';
  const gemCy = size === 'toast' ? '15' : size === 'modal' ? '20' : '17';

  const glowRgb = TIER_GLOW[tier];

  return (
    <div
      className={`relative w-full h-full ${showBack ? '' : 'group glow-card'}`}
      style={
        !showBack
          ? ({
              '--glow-rgb': glowRgb,
            } as React.CSSProperties)
          : undefined
      }
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 200 280"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block' }}
      >
        <defs>
          <filter id={`distress-${tier}`} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="1" result="noise" />
            <feDisplacementMap
              in="SourceGraphic"
              in2="noise"
              scale="3"
              xChannelSelector="R"
              yChannelSelector="G"
            />
          </filter>
          <linearGradient id={`border-${tier}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={frame.primary} />
            <stop offset="50%" stopColor={frame.secondary} />
            <stop offset="100%" stopColor={frame.primary} />
          </linearGradient>
          <linearGradient id={`plate-${tier}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={frame.namePlate} />
            <stop offset="100%" stopColor={frame.secondary} stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Card background */}
        <rect x="2" y="2" width="196" height="276" rx="14" fill={frame.bg} />

        {showBack ? (
          <>
            {/* Back background */}
            <rect x="8" y="8" width="184" height="264" rx="10" fill={back!.bg} opacity="0.5" />

            {/* Back emblem */}
            <path d={back!.emblem} fill={back!.accent} opacity="0.3" />

            {/* Question mark */}
            <text
              x="100"
              y="150"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="60"
              fontWeight="900"
              fill={back!.accent}
              opacity="0.2"
              style={{ userSelect: 'none' }}
            >
              ?
            </text>
          </>
        ) : (
          <>
            {/* Outer border with distress filter */}
            <rect
              x="3"
              y="3"
              width="194"
              height="274"
              rx="13"
              stroke={`url(#border-${tier})`}
              strokeWidth="4"
              fill="none"
              filter={`url(#distress-${tier})`}
            />

            {/* Inner border line (clean, no filter) */}
            <rect
              x="9"
              y="9"
              width="182"
              height="262"
              rx="10"
              stroke={frame.primary}
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />

            {/* Portrait window arch */}
            <path
              d="M 12 42 L 12 185 L 188 185 L 188 42 Q 188 14 100 14 Q 12 14 12 42 Z"
              fill="none"
              stroke={frame.primary}
              strokeWidth="1.5"
              opacity="0.4"
            />

            {/* Corner ornaments */}
            <g transform="translate(12, 14)">
              <CornerOrnament d={frame.ornament} color={frame.primary} />
            </g>
            <g transform="translate(188, 14) scale(-1, 1)">
              <CornerOrnament d={frame.ornament} color={frame.primary} />
            </g>
            <g transform="translate(188, 266) scale(-1, -1)">
              <CornerOrnament d={frame.ornament} color={frame.primary} />
            </g>
            <g transform="translate(12, 266) scale(1, -1)">
              <CornerOrnament d={frame.ornament} color={frame.primary} />
            </g>

            {/* Name plate */}
            <rect
              x="20"
              y={size === 'toast' ? 202 : 210}
              width={size === 'toast' ? 160 : 160}
              height={size === 'toast' ? 22 : 26}
              rx="6"
              fill={`url(#plate-${tier})`}
              stroke={frame.primary}
              strokeWidth="1"
            />

            {/* Plate text */}
            {namePlate && (
              <text
                x="100"
                y={size === 'toast' ? 215 : 225}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size === 'toast' ? '8' : size === 'modal' ? '11' : '9'}
                fontWeight="800"
                fill={frame.plateText}
                letterSpacing="1"
                style={{ userSelect: 'none' }}
              >
                {namePlate}
              </text>
            )}

            {/* Tier gem */}
            <circle
              cx={gemCx}
              cy={gemCy}
              r={size === 'toast' ? '5' : size === 'modal' ? '10' : '7'}
              fill={frame.gem}
              stroke={frame.secondary}
              strokeWidth="1"
            />
          </>
        )}
      </svg>

      {/* Content layer */}
      {!showBack && children && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-start"
          style={{
            paddingTop: size === 'toast' ? '36px' : size === 'modal' ? '48px' : '40px',
            paddingLeft: '12px',
            paddingRight: '12px',
          }}
        >
          <div className="flex flex-col items-center gap-0 w-full">{children}</div>
        </div>
      )}

      {/* Holographic shimmer overlay (Rare+ only, front face only) */}
      {holographic && !showBack && (
        <div className="absolute inset-0 overflow-hidden rounded-[13px] pointer-events-none">
          <div
            className="absolute inset-0 opacity-20 group-hover:opacity-35 transition-opacity duration-300"
            style={{
              background:
                'linear-gradient(135deg, transparent 0%, rgba(255,255,255,0.6) 40%, rgba(255,255,255,0.8) 50%, rgba(255,255,255,0.6) 60%, transparent 100%)',
              backgroundSize: '200% 200%',
              animation: 'holo-shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <style>{`
.glow-card {
  --glow-rgb: var(--glow-rgb, 161,161,170);
  box-shadow: 0 0 8px 2px rgba(var(--glow-rgb), 0.35), 0 0 25px 8px rgba(var(--glow-rgb), 0.12);
  transition: box-shadow 0.3s ease;
  pointer-events: none;
  will-change: transform;
}
.glow-card > * {
  pointer-events: auto;
}
.group:hover .glow-card {
  box-shadow: 0 0 8px 2px transparent, 0 0 25px 8px transparent;
}
@keyframes holo-shimmer {
  0% { background-position: 200% 200%; }
  100% { background-position: -100% -100%; }
}
`}</style>
    </div>
  );
}
