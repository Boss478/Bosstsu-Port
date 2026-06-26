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
    darkBg: '#18181b',
  },
  uncommon: {
    bg: '#bbf7d0',
    accent: '#22c55e',
    emblem: 'M 100 140 Q 80 160 85 180 Q 100 190 100 190 Q 100 190 115 180 Q 120 160 100 140 Z',
    symbol: '🍀',
    darkBg: '#064e3b',
  },
  rare: {
    bg: '#bfdbfe',
    accent: '#3b82f6',
    emblem:
      'M 100 140 L 105 155 L 120 155 L 108 165 L 112 180 L 100 170 L 88 180 L 92 165 L 80 155 L 95 155 Z',
    symbol: '✦',
    darkBg: '#172554',
  },
  'ultra-rare': {
    bg: '#d8b4fe',
    accent: '#a855f7',
    emblem:
      'M 100 135 Q 110 150 125 145 Q 115 158 120 175 Q 100 165 80 175 Q 85 158 75 145 Q 90 150 100 135 Z M 100 150 L 103 158 L 112 160 L 105 165 L 107 175 L 100 168 L 93 175 L 95 165 L 88 160 L 97 158 Z',
    symbol: '⭐',
    darkBg: '#2e1065',
  },
  legendary: {
    bg: '#fde68a',
    accent: '#f59e0b',
    emblem:
      'M 85 170 L 100 140 L 115 170 L 140 170 L 120 185 L 128 210 L 100 192 L 72 210 L 80 185 L 60 170 Z',
    symbol: '👑',
    darkBg: '#451a03',
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
  return (
    <>
      {/* Cartoon outline for the ornament */}
      <path d={d} stroke="#18181b" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* The shiny colored metallic ornament on top */}
      <path d={d} stroke={color} strokeWidth="1.75" fill="none" strokeLinecap="round" />
    </>
  );
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

  const gemCx = size === 'toast' ? 15 : size === 'modal' ? 20 : 17;
  const gemCy = size === 'toast' ? 15 : size === 'modal' ? 20 : 17;
  const gemR = size === 'toast' ? 5 : size === 'modal' ? 10 : 7;

  const glowRgb = TIER_GLOW[tier];

  // Plaque dimensions based on card size
  const plateY = size === 'toast' ? 202 : 210;
  const plateH = size === 'toast' ? 22 : 26;

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

          {/* Metallic / gemstone border gradients */}
          <linearGradient id={`border-common`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="25%" stopColor="#d4d4d8" />
            <stop offset="50%" stopColor="#f4f4f5" />
            <stop offset="75%" stopColor="#a1a1aa" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>
          <linearGradient id={`border-uncommon`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="25%" stopColor="#34d399" />
            <stop offset="50%" stopColor="#a7f3d0" />
            <stop offset="75%" stopColor="#059669" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id={`border-rare`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#1d4ed8" />
            <stop offset="25%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#dbeafe" />
            <stop offset="75%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1e3a8a" />
          </linearGradient>
          <linearGradient id={`border-ultra-rare`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#6d28d9" />
            <stop offset="25%" stopColor="#a78bfa" />
            <stop offset="50%" stopColor="#f3e8ff" />
            <stop offset="75%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#4c1d95" />
          </linearGradient>
          <linearGradient id={`border-legendary`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="20%" stopColor="#f59e0b" />
            <stop offset="40%" stopColor="#fef08a" />
            <stop offset="60%" stopColor="#fcd34d" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>

          {/* Name plate gradients */}
          <linearGradient id={`plate-common`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="50%" stopColor="#fafafa" />
            <stop offset="100%" stopColor="#d4d4d8" />
          </linearGradient>
          <linearGradient id={`plate-uncommon`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="50%" stopColor="#f0fdf4" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
          <linearGradient id={`plate-rare`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dbeafe" />
            <stop offset="50%" stopColor="#eff6ff" />
            <stop offset="100%" stopColor="#bfdbfe" />
          </linearGradient>
          <linearGradient id={`plate-ultra-rare`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f3e8ff" />
            <stop offset="50%" stopColor="#faf5ff" />
            <stop offset="100%" stopColor="#e9d5ff" />
          </linearGradient>
          <linearGradient id={`plate-legendary`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>

          {/* Portrait vignette radial gradient */}
          <radialGradient id={`portrait-bg-${tier}`} cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor={frame.bg} />
            <stop offset="100%" stopColor={frame.secondary} stopOpacity="0.5" />
          </radialGradient>

          {/* 3D Gem radial gradient */}
          <radialGradient id={`gem-grad-${tier}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="35%" stopColor={frame.secondary} />
            <stop offset="75%" stopColor={frame.gem} />
            <stop offset="100%" stopColor={frame.primary} />
          </radialGradient>

          {/* Card Face background linear gradient */}
          <linearGradient id={`bg-grad-${tier}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor={frame.bg} />
          </linearGradient>

          {/* Mysterious Card Back Dark Background Gradient */}
          <linearGradient id={`back-bg-${tier}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={TIER_BACK[tier].darkBg} />
            <stop offset="100%" stopColor="#05030a" />
          </linearGradient>
        </defs>

        {showBack ? (
          <>
            {/* Beveled Card base outline and shadow */}
            <rect x="2" y="4" width="196" height="274" rx="14" fill="#0c0a0f" opacity="0.4" />
            <rect x="2" y="2" width="196" height="274" rx="14" fill="#18181b" />

            {/* Metallic colorful border */}
            <rect
              x="4"
              y="4"
              width="192"
              height="270"
              rx="12"
              stroke={`url(#border-${tier})`}
              strokeWidth="5"
              fill="none"
              filter={`url(#distress-${tier})`}
            />

            {/* Inner frame line (separating border from dark center) */}
            <rect
              x="8.5"
              y="8.5"
              width="183"
              height="261"
              rx="10"
              stroke="#18181b"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Back background with rich gradient */}
            <rect x="10" y="10" width="180" height="258" rx="8" fill={`url(#back-bg-${tier})`} />

            {/* Back thin inner border line */}
            <rect
              x="14"
              y="14"
              width="172"
              height="250"
              rx="6"
              stroke={frame.primary}
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />

            {/* Mystic concentric circles / mandala */}
            <circle
              cx="100"
              cy="140"
              r="60"
              stroke={back!.accent}
              strokeWidth="0.75"
              fill="none"
              opacity="0.15"
            />
            <circle
              cx="100"
              cy="140"
              r="50"
              stroke={back!.accent}
              strokeWidth="1"
              fill="none"
              opacity="0.25"
              strokeDasharray="3 3"
            />
            <circle
              cx="100"
              cy="140"
              r="40"
              stroke={back!.accent}
              strokeWidth="1.25"
              fill="none"
              opacity="0.3"
            />
            <circle
              cx="100"
              cy="140"
              r="28"
              stroke={back!.accent}
              strokeWidth="0.75"
              fill="none"
              opacity="0.2"
            />

            {/* Star/compass lines */}
            <path
              d="M 100 70 L 100 210 M 30 140 L 170 140 M 50 90 L 150 190 M 50 190 L 150 90"
              stroke={back!.accent}
              strokeWidth="0.75"
              fill="none"
              opacity="0.15"
            />

            {/* Back emblem */}
            <path d={back!.emblem} fill={back!.accent} opacity="0.35" />

            {/* Glowing Center Seal */}
            <circle cx="100" cy="140" r="23" fill="#18181b" />
            <circle
              cx="100"
              cy="140"
              r="22"
              fill={TIER_BACK[tier].darkBg}
              stroke={back!.accent}
              strokeWidth="1.5"
            />

            {/* Seal Symbol */}
            <text
              x="100"
              y="140"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="16"
              fontWeight="bold"
              fill={back!.accent}
              opacity="0.9"
              style={{ userSelect: 'none' }}
            >
              {back!.symbol}
            </text>

            {/* Mysterious center question mark with drop shadow and metallic fill */}
            {/* Outline of question mark */}
            <text
              x="100"
              y="136"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="80"
              fontWeight="900"
              fill="#18181b"
              style={{ userSelect: 'none' }}
            >
              ?
            </text>
            <text
              x="100"
              y="136"
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="80"
              fontWeight="900"
              fill={`url(#border-${tier})`}
              opacity="0.9"
              style={{
                userSelect: 'none',
                filter: 'drop-shadow(0px 0px 8px rgba(255,255,255,0.15))',
              }}
            >
              ?
            </text>
          </>
        ) : (
          <>
            {/* Beveled Card base outline and shadow */}
            <rect x="2" y="4" width="196" height="274" rx="14" fill="#18181b" opacity="0.3" />
            <rect x="2" y="2" width="196" height="274" rx="14" fill="#18181b" />

            {/* Colorful Metallic Border Ring */}
            <rect
              x="4"
              y="4"
              width="192"
              height="270"
              rx="12"
              stroke={`url(#border-${tier})`}
              strokeWidth="5"
              fill="none"
              filter={`url(#distress-${tier})`}
            />

            {/* Inner Border Outline separating color border from background */}
            <rect
              x="8.5"
              y="8.5"
              width="183"
              height="261"
              rx="10"
              stroke="#18181b"
              strokeWidth="2.5"
              fill="none"
            />

            {/* Card Face background vertical gradient */}
            <rect x="10" y="10" width="180" height="258" rx="8" fill={`url(#bg-grad-${tier})`} />

            {/* Inner thin frame line */}
            <rect
              x="14"
              y="14"
              width="172"
              height="250"
              rx="6"
              stroke={frame.primary}
              strokeWidth="1"
              fill="none"
              opacity="0.3"
            />

            {/* Portrait window outer outline (Chunky Bezel) */}
            <path
              d="M 12 42 L 12 185 L 188 185 L 188 42 Q 188 14 100 14 Q 12 14 12 42 Z"
              fill="none"
              stroke="#18181b"
              strokeWidth="5"
              strokeLinejoin="round"
            />

            {/* Portrait window shiny bevel ring */}
            <path
              d="M 12 42 L 12 185 L 188 185 L 188 42 Q 188 14 100 14 Q 12 14 12 42 Z"
              fill="none"
              stroke={`url(#border-${tier})`}
              strokeWidth="2.5"
              strokeLinejoin="round"
            />

            {/* Portrait window inner outline */}
            <path
              d="M 13.5 42 L 13.5 183.5 L 186.5 183.5 L 186.5 42 Q 186.5 15.5 100 15.5 Q 13.5 15.5 13.5 42 Z"
              fill={`url(#portrait-bg-${tier})`}
              stroke="#18181b"
              strokeWidth="1.25"
              strokeLinejoin="round"
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

            {/* Name plate 3D bevel bottom layer */}
            <rect x="19" y={plateY + 2} width="162" height={plateH} rx="8" fill="#09090b" />

            {/* Name plate outer outline */}
            <rect x="19" y={plateY} width="162" height={plateH} rx="8" fill="#18181b" />

            {/* Name plate face */}
            <rect
              x="21"
              y={plateY + 1}
              width="158"
              height={plateH - 2}
              rx="6"
              fill={`url(#plate-${tier})`}
            />

            {/* Plate text */}
            {namePlate && (
              <text
                x="100"
                y={size === 'toast' ? 215 : 225}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={size === 'toast' ? '8' : size === 'modal' ? '11' : '9'}
                fontWeight="900"
                fill={frame.plateText}
                letterSpacing="1"
                style={{ userSelect: 'none' }}
              >
                {namePlate}
              </text>
            )}

            {/* Tier gem 3D bezel mount (Shadow, Outer Outline, Metal Ring, 3D Gem) */}
            <circle cx={gemCx} cy={gemCy + 1.5} r={gemR + 3} fill="#09090b" opacity="0.4" />
            <circle cx={gemCx} cy={gemCy} r={gemR + 3} fill="#18181b" />
            <circle cx={gemCx} cy={gemCy} r={gemR + 1.25} fill={`url(#border-${tier})`} />
            <circle cx={gemCx} cy={gemCy} r={gemR} fill={`url(#gem-grad-${tier})`} />
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

      {/* Holographic shimmer overlay (Rare+ only, front face only, beautiful iridescent prism gradient) */}
      {holographic && !showBack && (
        <div className="absolute inset-0 overflow-hidden rounded-[13px] pointer-events-none">
          <div
            className="absolute inset-0 opacity-20 group-hover:opacity-40 transition-opacity duration-300"
            style={{
              background:
                'linear-gradient(125deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 20%, rgba(96,165,250,0.35) 35%, rgba(192,132,252,0.35) 50%, rgba(253,186,116,0.35) 65%, rgba(167,243,208,0.25) 80%, rgba(255,255,255,0) 100%)',
              backgroundSize: '250% 250%',
              animation: 'holo-shimmer 3s linear infinite',
            }}
          />
        </div>
      )}

      <style>{`
.glow-card {
  --glow-rgb: var(--glow-rgb, 161,161,170);
  box-shadow: 0 6px 16px rgba(var(--glow-rgb), 0.22), 0 0 30px 6px rgba(var(--glow-rgb), 0.1);
  transition: box-shadow 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  pointer-events: none;
  will-change: transform;
}
.glow-card > * {
  pointer-events: auto;
}
.glow-card::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 13px;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.7) 50%, rgba(255,255,255,0.35) 55%, transparent 65%);
  background-size: 250% 250%;
  background-position: 200% 0;
  transition: background-position 0.6s ease, opacity 0.6s ease;
  pointer-events: none;
  opacity: 0;
  z-index: 30;
}
.glow-card:hover::after {
  background-position: -100% 0;
  opacity: 1;
}
.glow-card:hover {
  box-shadow: 0 16px 36px rgba(var(--glow-rgb), 0.4), 0 0 45px 15px rgba(var(--glow-rgb), 0.2);
}
@keyframes holo-shimmer {
  0% { background-position: 250% 250%; }
  100% { background-position: -150% -150%; }
}
`}</style>
    </div>
  );
}
