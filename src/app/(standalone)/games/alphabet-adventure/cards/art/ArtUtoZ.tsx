'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Umbrella: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 10 Q14 20 14 46 L86 46 Q86 20 50 10Z" fill="#ef4444" />
    <path d="M50 10 L26 46 L14 46 Q14 20 50 10Z" fill="#dc2626" />
    <path d="M50 10 L38 46 L26 46Z" fill="#b91c1c" />
    <path d="M50 10 L50 46 L38 46Z" fill="#dc2626" />
    <path d="M50 10 L62 46 L50 46Z" fill="#dc2626" />
    <path d="M50 10 L74 46 L62 46Z" fill="#b91c1c" />
    <path d="M50 10 L86 46 L74 46 Q86 20 50 10Z" fill="#dc2626" />
    <path
      d="M14 46 Q21 53 28 46"
      stroke="#b91c1c"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M38 46 Q44 52 50 46"
      stroke="#b91c1c"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M62 46 Q68 52 74 46"
      stroke="#b91c1c"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="28" cy="28" r="2.5" fill="#fca5a5" opacity="0.8" />
    <circle cx="68" cy="32" r="2.5" fill="#fca5a5" opacity="0.8" />
    <circle cx="50" cy="22" r="2.5" fill="#fca5a5" opacity="0.8" />
    <path d="M50 2 L50 10" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
    <path d="M50 46 L50 72" stroke="#78350f" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path
      d="M50 72 Q50 84 41 84"
      stroke="#78350f"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Unicorn: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M68 52 Q82 54 86 44"
      stroke="#ec4899"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M68 56 Q84 60 88 50"
      stroke="#a855f7"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M68 60 Q84 66 86 56"
      stroke="#3b82f6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="66" rx="22" ry="15" fill="#fce7f3" />
    <ellipse cx="48" cy="70" rx="12" ry="4" fill="white" opacity="0.4" />
    <path d="M40 77 L38 91" stroke="#f9a8d4" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M58 77 L60 91" stroke="#f9a8d4" strokeWidth="6" fill="none" strokeLinecap="round" />
    <rect x="34" y="91" width="8" height="5" rx="2" fill="#ec4899" />
    <rect x="56" y="91" width="8" height="5" rx="2" fill="#ec4899" />
    <path
      d="M54 56 C58 46 56 38 50 34"
      stroke="#fce7f3"
      strokeWidth="13"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M52 24 L50 14 L58 20 Z" fill="#fce7f3" />
    <path d="M53 22 L51.5 16 L56 19.5 Z" fill="#f9a8d4" />
    <ellipse cx="46" cy="32" rx="14" ry="10" fill="#fce7f3" />
    <ellipse cx="34" cy="34" rx="7" ry="6" fill="#fce7f3" />
    <path d="M46 24 L42 4 L54 22 Z" fill="#facc15" />
    <path
      d="M47 20 Q44 15 48 13"
      stroke="#d97706"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M56 18 Q66 26 60 40"
      stroke="#ec4899"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M60 20 Q70 30 62 44"
      stroke="#a855f7"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M62 24 Q72 34 62 48"
      stroke="#3b82f6"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M38 26 Q32 24 34 18"
      stroke="#ec4899"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="42" cy="30" r="2.5" fill="#1c1917" />
    <circle cx="43" cy="29" r="0.9" fill="white" />
    <circle cx="28" cy="36" r="1.5" fill="#f472b6" />
    <path
      d="M30 40 Q34 43 38 41"
      stroke="#ec4899"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="36" rx="3" ry="2" fill="#f9a8d4" opacity="0.7" />
    <path d="M18 14 L19 17 L22 18 L19 19 L18 22 L17 19 L14 18 L17 17 Z" fill="#facc15" />
    <path d="M82 20 L83 23 L86 24 L83 25 L82 28 L81 25 L78 24 L81 23 Z" fill="#facc15" />
  </svg>
);

const Ukulele: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="45" y="4" width="10" height="32" fill="#92400e" />
    <rect x="41" y="2" width="18" height="7" rx="3" fill="#78350f" />
    <rect x="43" y="14" width="14" height="4" rx="1" fill="#78350f" />
    <rect x="43" y="24" width="14" height="4" rx="1" fill="#78350f" />
    <ellipse cx="50" cy="64" rx="22" ry="19" fill="#b45309" />
    <ellipse cx="50" cy="64" rx="17" ry="14" fill="#d97706" />
    <circle cx="50" cy="64" r="6.5" fill="#451a03" />
    <line x1="46" y1="6" x2="46" y2="60" stroke="#fde68a" strokeWidth="1.5" />
    <line x1="50" y1="6" x2="50" y2="60" stroke="#fde68a" strokeWidth="1.5" />
    <line x1="54" y1="6" x2="54" y2="60" stroke="#fde68a" strokeWidth="1.5" />
    <rect x="40" y="76" width="20" height="4" rx="2" fill="#78350f" />
    <path
      d="M36 44 Q30 50 28 58"
      stroke="#b45309"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.5"
    />
    <path
      d="M64 44 Q70 50 72 58"
      stroke="#b45309"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.5"
    />
    <circle cx="32" cy="26" r="1.8" fill="#fde68a" opacity="0.7" />
    <circle cx="68" cy="22" r="1.8" fill="#fde68a" opacity="0.7" />
    <circle cx="70" cy="72" r="2" fill="#fde68a" opacity="0.7" />
  </svg>
);

const UFO: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="56" rx="34" ry="12" fill="#cbd5e1" />
    <path d="M16 56 Q16 66 50 66 Q84 66 84 56Z" fill="#94a3b8" />
    <path d="M38 44 Q38 28 50 28 Q62 28 62 44Z" fill="#38bdf8" />
    <ellipse cx="42" cy="38" rx="5" ry="3" fill="#7dd3fc" opacity="0.6" />
    <circle cx="50" cy="40" r="7" fill="#4ade80" />
    <circle cx="47" cy="39" r="1.6" fill="#1c1917" />
    <circle cx="53" cy="39" r="1.6" fill="#1c1917" />
    <line
      x1="50"
      y1="28"
      x2="50"
      y2="22"
      stroke="#94a3b8"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <circle cx="50" cy="20" r="3" fill="#ef4444" />
    <circle cx="24" cy="56" r="3" fill="#facc15" />
    <circle cx="36" cy="62" r="3" fill="#facc15" />
    <circle cx="50" cy="64" r="3" fill="#facc15" />
    <circle cx="64" cy="62" r="3" fill="#facc15" />
    <circle cx="76" cy="56" r="3" fill="#facc15" />
    <polygon points="28,64 18,92 36,92" fill="#fde68a" opacity="0.35" />
    <polygon points="50,66 40,92 60,92" fill="#fde68a" opacity="0.25" />
    <polygon points="72,64 64,92 82,92" fill="#fde68a" opacity="0.35" />
  </svg>
);

const Violin: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="46" y="4" width="8" height="26" fill="#a16207" />
    <circle cx="50" cy="7" r="6" fill="#a16207" />
    <circle cx="50" cy="7" r="2" fill="#78350f" />
    <ellipse cx="50" cy="38" rx="14" ry="15" fill="#b45309" />
    <rect x="40" y="44" width="20" height="12" rx="6" fill="#b45309" />
    <ellipse cx="50" cy="68" rx="21" ry="20" fill="#b45309" />
    <ellipse cx="50" cy="36" rx="9" ry="10" fill="#d97706" />
    <ellipse cx="50" cy="68" rx="15" ry="14" fill="#d97706" />
    <path d="M42 30 Q40 36 42 42" stroke="#78350f" strokeWidth="2" fill="none" />
    <path d="M58 30 Q60 36 58 42" stroke="#78350f" strokeWidth="2" fill="none" />
    <line x1="47" y1="10" x2="47" y2="56" stroke="#fde68a" strokeWidth="1.2" />
    <line x1="50" y1="10" x2="50" y2="56" stroke="#fde68a" strokeWidth="1.2" />
    <line x1="53" y1="10" x2="53" y2="56" stroke="#fde68a" strokeWidth="1.2" />
    <rect x="42" y="56" width="16" height="3" rx="1.5" fill="#78350f" />
    <line x1="16" y1="86" x2="84" y2="12" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round" />
    <line
      x1="18"
      y1="88"
      x2="86"
      y2="14"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.9"
    />
  </svg>
);

const Volcano: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="6" y="86" width="88" height="8" rx="4" fill="#451a03" />
    <path d="M16 86 C24 56 38 34 46 28 L54 28 C62 34 76 56 84 86 Z" fill="#78350f" />
    <path d="M50 29 C60 36 76 56 84 86 L50 86 Z" fill="#92400e" opacity="0.8" />
    <circle cx="26" cy="70" r="3" fill="#92400e" opacity="0.5" />
    <circle cx="60" cy="62" r="3.5" fill="#92400e" opacity="0.5" />
    <circle cx="70" cy="76" r="2.5" fill="#92400e" opacity="0.5" />
    <circle cx="34" cy="78" r="2" fill="#92400e" opacity="0.5" />
    <ellipse cx="50" cy="31" rx="14" ry="7" fill="#f97316" opacity="0.3" />
    <ellipse cx="50" cy="29" rx="6" ry="3.5" fill="#7f1d1d" />
    <ellipse cx="50" cy="30" rx="5" ry="2.5" fill="#f97316" />
    <path
      d="M44 32 Q36 44 38 54 Q40 62 36 70"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="36" cy="74" r="3.5" fill="#f97316" />
    <path
      d="M56 32 Q64 42 62 52"
      stroke="#fb923c"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="62" cy="56" r="2.5" fill="#fb923c" />
    <circle cx="38" cy="48" r="2" fill="#fb923c" />
    <circle cx="37" cy="60" r="2" fill="#fb923c" />
    <circle cx="50" cy="16" r="6" fill="#d1d5db" opacity="0.8" />
    <circle cx="44" cy="10" r="5" fill="#d1d5db" opacity="0.7" />
    <circle cx="56" cy="8" r="4" fill="#d1d5db" opacity="0.6" />
    <circle cx="32" cy="14" r="2" fill="#facc15" />
    <circle cx="66" cy="12" r="1.8" fill="#facc15" />
    <circle cx="44" cy="4" r="1.5" fill="#facc15" />
  </svg>
);

const Unicycle: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="74" r="22" fill="#1c1917" />
    <circle cx="50" cy="74" r="16" fill="none" stroke="#9ca3af" strokeWidth="3" />
    <line x1="50" y1="58" x2="50" y2="90" stroke="#9ca3af" strokeWidth="2" />
    <line x1="34" y1="74" x2="66" y2="74" stroke="#9ca3af" strokeWidth="2" />
    <line x1="39" y1="63" x2="61" y2="85" stroke="#9ca3af" strokeWidth="2" />
    <line x1="61" y1="63" x2="39" y2="85" stroke="#9ca3af" strokeWidth="2" />
    <circle cx="50" cy="74" r="4.5" fill="#6b7280" />
    <path d="M50 74 L44 56" stroke="#4b5563" strokeWidth="3" />
    <path d="M50 74 L56 56" stroke="#4b5563" strokeWidth="3" />
    <line x1="50" y1="56" x2="50" y2="32" stroke="#4b5563" strokeWidth="4" />
    <ellipse cx="50" cy="28" rx="9" ry="4.5" fill="#a16207" />
    <line x1="50" y1="74" x2="40" y2="66" stroke="#6b7280" strokeWidth="3" />
    <line x1="50" y1="74" x2="60" y2="82" stroke="#6b7280" strokeWidth="3" />
    <rect x="34" y="62" width="9" height="5" rx="2" fill="#4b5563" />
    <rect x="56" y="80" width="9" height="5" rx="2" fill="#4b5563" />
  </svg>
);

const Van: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <defs>
      <linearGradient id="vaTeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#22D3EE" />
        <stop offset="45%" stopColor="#06B6D4" />
        <stop offset="100%" stopColor="#0E7490" />
      </linearGradient>
      <linearGradient id="vaCream" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#FFFBEB" />
        <stop offset="100%" stopColor="#FEF3C7" />
      </linearGradient>
      <linearGradient id="vaGlass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="vaChrome" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="25%" stopColor="#CBD5E1" />
        <stop offset="50%" stopColor="#64748B" />
        <stop offset="75%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#F8FAFC" />
      </linearGradient>
      <radialGradient id="vaLight" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="40%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#FACC15" />
      </radialGradient>
      <linearGradient id="vaSurf" x1="0%" y1="0%" x2="100%" y2="50%">
        <stop offset="0%" stopColor="#FB7185" />
        <stop offset="50%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
      <linearGradient id="vaWood" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#D97706" />
        <stop offset="50%" stopColor="#B45309" />
        <stop offset="100%" stopColor="#78350F" />
      </linearGradient>
      <radialGradient id="vaTire" cx="40%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#475569" />
        <stop offset="50%" stopColor="#1E293B" />
        <stop offset="100%" stopColor="#0F172A" />
      </radialGradient>
    </defs>

    <g transform="translate(49.1 39.6) scale(1.2) translate(-49.1 -39.6)">
      {/* Far wheels */}
      <ellipse cx="29.4" cy="53.1" rx="2.5" ry="4" fill="url(#vaTire)" />
      <ellipse cx="61.9" cy="52.5" rx="2.25" ry="3.5" fill="url(#vaTire)" />

      {/* Teal lower body */}
      <path
        d="M 24.4,39.4 C 23.75,43.1 25,48.75 27.5,51.9 C 30,54 35,54.75 41.25,54.75 C 47.5,54.75 55,54.75 65.6,54 C 70.6,53.5 74.4,51.9 75.6,48.1 C 76.25,44.4 75,40.6 74.4,39.4 C 60,39.75 48.75,40 43.1,39.75 C 40,43.1 36.9,46.5 34,46.5 C 31.25,46.5 28.1,42.5 24.4,39.4 Z"
        fill="url(#vaTeal)"
      />

      {/* Cream upper body */}
      <path
        d="M 24.4,39.4 C 26.25,33.75 28.75,28.1 31.9,25 C 35.6,23.75 41.25,23.5 45.6,24 C 55,24.4 66.25,25.6 72.5,27.25 C 74.4,28.75 75,33.75 74.4,39.4 C 60,39.75 48.75,40 43.1,39.75 C 40,43.1 36.9,46.5 34,46.5 C 31.25,46.5 28.1,42.5 24.4,39.4 Z"
        fill="url(#vaCream)"
      />

      {/* Roof glossy highlight */}
      <path
        d="M 32.5,25.25 C 41.25,24 56.25,25 71.9,27.5"
        stroke="#FFFFFF"
        strokeWidth="0.6"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Chrome beltline trim */}
      <path
        d="M 24.1,39.4 C 27.9,42.5 31.25,46.75 34,46.75 C 36.9,46.75 40.25,42.9 43.1,40 C 52.5,40.1 63.75,40.1 74.6,39.6"
        fill="none"
        stroke="url(#vaChrome)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />

      {/* Windows */}
      <path
        d="M 27.25,36.9 C 27.5,33.75 29.4,28.75 31.25,26.5 C 31.9,26 34.75,25.75 35,25.75 L 33.75,37 C 31.25,37.25 28.75,37.25 27.25,36.9 Z"
        fill="url(#vaGlass)"
        stroke="#1E293B"
        strokeWidth="0.4"
      />
      <path
        d="M 36,25.75 C 36.5,25.75 41.9,26 43.5,26.75 L 41.5,37.25 C 38.75,37.1 35.6,37 34.5,37 Z"
        fill="url(#vaGlass)"
        stroke="#1E293B"
        strokeWidth="0.4"
      />
      <line
        x1="35.5"
        y1="25.6"
        x2="34.1"
        y2="37"
        stroke="#1E293B"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <path
        d="M 45,27.25 C 48.75,27.5 51.9,27.75 53.1,28 L 52.25,37.1 L 42.75,37.25 Z"
        fill="url(#vaGlass)"
        stroke="#1E293B"
        strokeWidth="0.4"
      />
      <path
        d="M 54.4,28.1 L 61.9,28.5 L 61.25,37.1 L 53.5,37.1 Z"
        fill="url(#vaGlass)"
        stroke="#1E293B"
        strokeWidth="0.4"
      />
      <path
        d="M 63.1,28.6 C 66.9,28.9 70,29.1 71.25,29.4 L 70.4,37 C 67.5,37.1 64.4,37.1 62.5,37.1 Z"
        fill="url(#vaGlass)"
        stroke="#1E293B"
        strokeWidth="0.4"
      />

      {/* Window glare */}
      <path d="M 28.75,35.6 L 32.5,27.5 L 33.75,27.5 L 30,35.6 Z" fill="#FFFFFF" opacity="0.4" />
      <path d="M 36.25,35.6 L 41.25,27.5 L 42.5,27.5 L 37.5,35.6 Z" fill="#FFFFFF" opacity="0.4" />
      <path d="M 45.6,35.6 L 50.6,28.25 L 51.9,28.25 L 46.9,35.6 Z" fill="#FFFFFF" opacity="0.35" />
      <path d="M 55,35.6 L 60,28.75 L 61.25,28.75 L 56.25,35.6 Z" fill="#FFFFFF" opacity="0.35" />
      <path d="M 63.75,35.6 L 68.75,29.25 L 70,29.25 L 65,35.6 Z" fill="#FFFFFF" opacity="0.35" />

      {/* Headlights */}
      <circle cx="28.1" cy="42.5" r="2.25" fill="url(#vaChrome)" />
      <circle cx="28.1" cy="42.5" r="1.75" fill="url(#vaLight)" />
      <circle cx="27.6" cy="42" r="0.5" fill="#FFFFFF" opacity="0.8" />
      <circle cx="40" cy="44" r="2.75" fill="url(#vaChrome)" />
      <circle cx="40" cy="44" r="2.1" fill="url(#vaLight)" />
      <circle cx="39.4" cy="43.4" r="0.6" fill="#FFFFFF" opacity="0.85" />
      <circle cx="40.5" cy="44.75" r="0.3" fill="#FFFFFF" opacity="0.6" />

      {/* Indicators */}
      <ellipse
        cx="25.25"
        cy="43.5"
        rx="0.5"
        ry="0.9"
        fill="#F97316"
        stroke="#9A3412"
        strokeWidth="0.15"
      />
      <ellipse
        cx="42.75"
        cy="45.25"
        rx="0.6"
        ry="1"
        fill="#F97316"
        stroke="#9A3412"
        strokeWidth="0.15"
      />

      {/* Peace emblem */}
      <g transform="translate(34, 43.75)">
        <circle cx="0" cy="0" r="2.5" fill="url(#vaChrome)" />
        <circle cx="0" cy="0" r="1.9" fill="#0284C7" />
        <circle cx="0" cy="0" r="1.6" fill="none" stroke="#FFFFFF" strokeWidth="0.3" />
        <line
          x1="0"
          y1="-1.6"
          x2="0"
          y2="1.6"
          stroke="#FFFFFF"
          strokeWidth="0.3"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="-1.1"
          y2="1.1"
          stroke="#FFFFFF"
          strokeWidth="0.3"
          strokeLinecap="round"
        />
        <line
          x1="0"
          y1="0"
          x2="1.1"
          y2="1.1"
          stroke="#FFFFFF"
          strokeWidth="0.3"
          strokeLinecap="round"
        />
      </g>

      {/* Friendly smile */}
      <path
        d="M 30.25,48.5 Q 34,50.25 37.75,49.25"
        fill="none"
        stroke="#0891B2"
        strokeWidth="0.4"
        strokeLinecap="round"
      />

      {/* Front bumper */}
      <path
        d="M 21.9,46.9 C 25,51.25 32.5,54 40,53.1 C 43.1,52.75 45.6,51.25 46.9,50"
        fill="none"
        stroke="url(#vaChrome)"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <rect
        x="26.9"
        y="48.1"
        width="1"
        height="2.75"
        rx="0.5"
        fill="url(#vaChrome)"
        transform="rotate(12 26.9 48.1)"
      />
      <rect
        x="38.5"
        y="50"
        width="1"
        height="2.75"
        rx="0.5"
        fill="url(#vaChrome)"
        transform="rotate(-8 38.5 50)"
      />

      {/* Fender arches */}
      <path
        d="M 35.6,54.75 C 36.25,50 43.75,50 44.75,54"
        fill="none"
        stroke="#0891B2"
        strokeWidth="0.6"
      />
      <path
        d="M 61.25,54 C 61.9,49.4 69.4,49.4 70,53.1"
        fill="none"
        stroke="#0891B2"
        strokeWidth="0.6"
      />

      {/* Near wheels */}
      <ellipse cx="40" cy="54.4" rx="4.25" ry="5" fill="url(#vaTire)" />
      <ellipse cx="40" cy="54.4" rx="2.75" ry="3.25" fill="url(#vaChrome)" />
      <ellipse cx="40" cy="54.4" rx="1.25" ry="1.5" fill="#0891B2" />
      <circle cx="39.6" cy="53.9" r="0.4" fill="#FFFFFF" opacity="0.7" />
      <ellipse cx="65.6" cy="53.5" rx="4" ry="4.75" fill="url(#vaTire)" />
      <ellipse cx="65.6" cy="53.5" rx="2.5" ry="3" fill="url(#vaChrome)" />
      <ellipse cx="65.6" cy="53.5" rx="1.1" ry="1.4" fill="#0891B2" />
      <circle cx="65.25" cy="53.1" r="0.4" fill="#FFFFFF" opacity="0.7" />

      {/* Side details */}
      <path d="M 43.1,27.25 L 42.25,52.75" stroke="#0891B2" strokeWidth="0.25" opacity="0.5" />
      <rect x="44.4" y="41.25" width="2" height="0.75" rx="0.4" fill="url(#vaChrome)" />
      <g stroke="#0891B2" strokeWidth="0.4" strokeLinecap="round" opacity="0.7">
        <line x1="70.6" y1="42.5" x2="72.5" y2="42.5" />
        <line x1="70.4" y1="43.5" x2="72.25" y2="43.5" />
        <line x1="70.1" y1="44.5" x2="72" y2="44.5" />
      </g>
      <path
        d="M 42.75,34.4 C 44,34.4 45.25,34.75 45.6,35.25"
        stroke="url(#vaChrome)"
        strokeWidth="0.45"
        fill="none"
      />
      <ellipse cx="45.9" cy="35.4" rx="0.9" ry="1.25" fill="url(#vaChrome)" />
      <ellipse cx="45.8" cy="35.4" rx="0.5" ry="0.9" fill="#E0F2FE" />

      {/* Roof rack */}
      <line x1="40" y1="26" x2="40" y2="24.4" stroke="url(#vaChrome)" strokeWidth="0.5" />
      <line x1="53.75" y1="26.5" x2="53.75" y2="24.6" stroke="url(#vaChrome)" strokeWidth="0.5" />
      <line x1="67.5" y1="27.75" x2="67.5" y2="25.5" stroke="url(#vaChrome)" strokeWidth="0.5" />
      <path
        d="M 36.25,24.5 L 70.6,25.6"
        stroke="url(#vaWood)"
        strokeWidth="0.6"
        strokeLinecap="round"
      />
      <path
        d="M 36.9,23.75 L 71.25,24.9"
        stroke="url(#vaWood)"
        strokeWidth="0.6"
        strokeLinecap="round"
      />

      {/* Surfboard */}
      <path
        d="M 31.25,22.5 C 41.25,19.75 60,21 74.4,24.75 C 63.75,26.25 45,25.6 31.25,22.5 Z"
        fill="url(#vaSurf)"
      />
      <path
        d="M 31.25,22.5 C 41.25,21.4 60,22.4 74.4,24.75 C 65,25.25 47.5,24.4 31.25,22.5 Z"
        fill="#FDE047"
        opacity="0.85"
      />
      <path
        d="M 70,25 C 71.25,26 72.5,26.5 73.1,26.25 C 72.5,25.4 71.9,25.1 70,25 Z"
        fill="#E11D48"
      />
    </g>
  </svg>
);

const Water: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 4 Q82 50 50 92 Q18 50 50 4 Z" fill="#3b82f6" />
    <ellipse
      cx="40"
      cy="34"
      rx="7"
      ry="12"
      fill="white"
      opacity="0.7"
      transform="rotate(-18 40 34)"
    />
    <ellipse cx="50" cy="64" rx="7" ry="3.5" fill="white" opacity="0.25" />
    <path d="M50 22 Q68 46 50 76 Q32 46 50 22Z" fill="#60a5fa" opacity="0.45" />
    <path d="M22 18 Q20 12 24 10 Q28 12 26 18Z" fill="#60a5fa" />
    <path d="M74 22 Q76 16 72 14 Q68 16 70 22Z" fill="#60a5fa" />
    <path
      d="M62 70 Q70 66 76 70 Q82 74 88 70"
      stroke="#93c5fd"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const Watermelon: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M10 30 A40 40 0 0 0 90 30 Z"
      fill="#16a34a"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M16 30 A34 34 0 0 0 84 30 Z"
      fill="#f8fafc"
      stroke="#1c1917"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <path
      d="M22 30 A28 28 0 0 0 78 30 Z"
      fill="#ef4444"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <ellipse cx="34" cy="38" rx="4.5" ry="2.8" fill="white" opacity="0.5" />
    <ellipse cx="36" cy="45" rx="2.2" ry="3.2" fill="#1c1917" transform="rotate(-18 36 45)" />
    <ellipse cx="50" cy="51" rx="2.2" ry="3.2" fill="#1c1917" />
    <ellipse cx="64" cy="45" rx="2.2" ry="3.2" fill="#1c1917" transform="rotate(18 64 45)" />
    <ellipse cx="42" cy="55" rx="2" ry="3" fill="#1c1917" transform="rotate(8 42 55)" />
    <ellipse cx="58" cy="55" rx="2" ry="3" fill="#1c1917" transform="rotate(-8 58 55)" />
    <path
      d="M45 66 A35 35 0 0 0 50 67.5"
      stroke="#15803d"
      strokeWidth="2"
      fill="none"
      opacity="0.6"
    />
    <path
      d="M55 66 A35 35 0 0 1 50 67.5"
      stroke="#15803d"
      strokeWidth="2"
      fill="none"
      opacity="0.6"
    />
  </svg>
);

const Whale: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <defs>
      <linearGradient id="whBody" x1="20%" y1="10%" x2="80%" y2="90%">
        <stop offset="0%" stopColor="#60A5FA" />
        <stop offset="40%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>
      <linearGradient id="whFin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#2563EB" />
        <stop offset="100%" stopColor="#1E40AF" />
      </linearGradient>
      <linearGradient id="whBelly" x1="30%" y1="0%" x2="30%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>
      <linearGradient id="whWater" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.5" />
        <stop offset="60%" stopColor="#7DD3FC" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0.95" />
      </linearGradient>
    </defs>

    {/* Water spout (behind head) */}
    <path
      d="M 37.5,26.9 C 36.9,18.1 28.1,11.9 20.6,13.75 C 27.5,10.6 36.25,13.1 38.1,20.6 C 39.4,13.1 48.1,10.6 55,13.75 C 47.5,11.9 38.75,18.1 38.1,26.9 Z"
      fill="url(#whWater)"
    />
    <path
      d="M 37.75,26.9 C 37.4,20 31.9,15 26.25,16.25 C 30.6,14 36.9,15.6 37.9,21.9 C 38.6,15.6 44.9,14 49.25,16.25 C 43.6,15 38.1,20 37.75,26.9 Z"
      fill="#FFFFFF"
      opacity="0.75"
    />
    <circle cx="20" cy="13.75" r="1.6" fill="#E0F2FE" opacity="0.9" />
    <circle cx="19.5" cy="13.4" r="1.25" fill="#FFFFFF" />
    <circle cx="55.6" cy="13.75" r="1.6" fill="#E0F2FE" opacity="0.9" />
    <circle cx="56.1" cy="13.4" r="1.25" fill="#FFFFFF" />
    <circle cx="37.75" cy="8.75" r="2" fill="#E0F2FE" opacity="0.9" />
    <circle cx="37.5" cy="8.25" r="1.5" fill="#FFFFFF" />
    <circle cx="28.1" cy="10.6" r="1.1" fill="#BAE6FD" opacity="0.8" />
    <circle cx="47.5" cy="10.6" r="1.1" fill="#BAE6FD" opacity="0.8" />
    <circle cx="16.25" cy="15" r="0.6" fill="#38BDF8" opacity="0.7" />
    <circle cx="59.4" cy="15" r="0.6" fill="#38BDF8" opacity="0.7" />
    <circle cx="37.75" cy="5" r="0.75" fill="#7DD3FC" opacity="0.8" />

    {/* Back flipper (behind body) */}
    <path
      d="M 43.75,48.1 C 46.25,52.5 48.1,56.9 45.6,58.75 C 43.5,60 41.25,55.6 41,50.6 Z"
      fill="url(#whFin)"
    />

    {/* Tail flukes */}
    <path
      d="M 69.4,42.5 C 73.1,36.9 80.6,29.4 86.25,30.6 C 87.5,33.1 82.5,39.4 71.9,43.5 Z"
      fill="url(#whBody)"
    />
    <path
      d="M 71.25,41.9 C 75,36.9 80.6,31.25 84.4,31.9 C 82.5,33.75 78.1,38.1 71.25,41.9 Z"
      fill="#60A5FA"
      opacity="0.4"
    />
    <path
      d="M 69.4,43.1 C 74.4,45 83.1,50.6 83.75,53.75 C 81.25,55 75,49.75 70,44.75 Z"
      fill="url(#whBody)"
    />

    {/* Main body */}
    <path
      d="M 36.25,26.25 C 24.4,26.25 16.9,33.75 16.9,42.5 C 16.9,51.9 23.75,58.1 34.4,58.1 C 46.9,58.1 60,52.5 71.25,43.1 C 61.9,35 50.6,26.25 36.25,26.25 Z"
      fill="url(#whBody)"
    />

    {/* Belly patch + grooves */}
    <path
      d="M 17.5,45 C 18.1,52.5 25,57.5 34.4,57.5 C 45.6,57.5 56.9,52.5 66.9,45 C 56.9,48.1 45.6,49.4 35.6,48.1 C 26.9,46.9 20.6,44.4 17.5,45 Z"
      fill="url(#whBelly)"
    />
    <path
      d="M 25,52.75 C 26.25,49.4 28.1,47.5 29.4,47.25"
      stroke="#93C5FD"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />
    <path
      d="M 30.6,54.75 C 32.25,50.6 34.4,48.5 36.25,48.1"
      stroke="#93C5FD"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />
    <path
      d="M 36.9,55.5 C 38.75,51.25 41.25,48.75 43.75,48"
      stroke="#93C5FD"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />
    <path
      d="M 43.75,55 C 46,51.25 48.75,48.5 51.9,47.5"
      stroke="#93C5FD"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />
    <path
      d="M 50.6,53.75 C 53.1,50.6 56,47.75 58.75,46.5"
      stroke="#93C5FD"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.65"
    />

    {/* Front flipper */}
    <path
      d="M 35.6,48.1 C 31.9,53.1 32.5,59.4 36.25,61 C 38.75,61.9 41.25,57.5 40,50.6 C 38.75,48.75 36.9,47.5 35.6,48.1 Z"
      fill="url(#whBody)"
    />
    <path
      d="M 36,49.4 C 33.75,53.1 34,57.5 36.5,59.4 C 36.25,56.25 36,52.5 37.25,50 Z"
      fill="#93C5FD"
      opacity="0.45"
    />

    {/* Glossy highlights */}
    <path
      d="M 22.5,36.25 C 25,30.6 31.25,27.75 38.75,27.75 C 46.25,27.75 53.75,30.6 60,35"
      stroke="#FFFFFF"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
      opacity="0.3"
    />
    <path
      d="M 27.5,31.25 C 31.25,29.4 35.6,28.5 40,28.5"
      stroke="#FFFFFF"
      strokeWidth="0.5"
      strokeLinecap="round"
      fill="none"
      opacity="0.6"
    />

    {/* Face */}
    <ellipse cx="23.1" cy="43.75" rx="2.25" ry="1.4" fill="#FF758F" opacity="0.45" />
    <circle cx="26.9" cy="38.1" r="2.25" fill="#0F172A" />
    <circle cx="26.1" cy="37.4" r="0.9" fill="#FFFFFF" />
    <circle cx="27.9" cy="39.1" r="0.44" fill="#FFFFFF" />
    <path
      d="M 24.1,37.25 C 25.25,35.5 28.1,35.5 29.4,37"
      stroke="#1E3A8A"
      strokeWidth="0.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M 26.25,43.1 C 26.25,46.9 31.25,46.9 31.9,42.5 C 30.6,42.25 27.5,42.25 26.25,43.1 Z"
      fill="#881337"
    />
    <path
      d="M 27.5,44.75 C 28.5,43.5 30.25,43.5 31,44.4 C 30.25,46 28.25,46 27.5,44.75 Z"
      fill="#FF758F"
    />
    <path
      d="M 31.6,42.1 C 32.25,42.5 32.5,43.25 32.1,43.75"
      stroke="#1E3A8A"
      strokeWidth="0.3"
      strokeLinecap="round"
      fill="none"
    />
  </svg>
);

const Wizard: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M34 56 Q50 64 66 56 L62 88 Q50 92 38 88 Z" fill="#7c3aed" />
    <path d="M50 61 C58 56 62 56 66 56 L62 88 Q50 92 50 90 Z" fill="#6d28d9" opacity="0.8" />
    <path
      d="M36 60 Q28 68 30 78"
      stroke="#7c3aed"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M64 60 Q72 68 70 78"
      stroke="#7c3aed"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="30" cy="80" r="4" fill="#fed7aa" />
    <circle cx="70" cy="80" r="4" fill="#fed7aa" />
    <path
      d="M44 69 L45.5 70.5 L48 72 L45.5 73.5 L44 75 L42.5 73.5 L40 72 L42.5 70.5 Z"
      fill="#facc15"
    />
    <path
      d="M56 77.5 L57.3 78.7 L59 80 L57.3 81.3 L56 82.5 L54.7 81.3 L53 80 L54.7 78.7 Z"
      fill="#facc15"
    />
    <path d="M46 82 L47 83 L49 84 L47 85 L46 86 L45 85 L43 84 L45 83 Z" fill="#facc15" />
    <circle cx="50" cy="38" r="15" fill="#fed7aa" />
    <path d="M36 44 Q35 62 50 64 Q65 62 64 44 Q56 52 50 52 Q44 52 36 44 Z" fill="#f8fafc" />
    <path d="M42 44 Q49 51 50 45 Q51 51 58 44 Q50 55 42 44 Z" fill="#e2e8f0" />
    <circle cx="43" cy="36" r="2.5" fill="#1c1917" />
    <circle cx="57" cy="36" r="2.5" fill="#1c1917" />
    <circle cx="44" cy="35" r="1" fill="white" />
    <circle cx="58" cy="35" r="1" fill="white" />
    <path
      d="M41 31 Q43 29 45 31"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M59 31 Q57 29 55 31"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="41" rx="2.5" ry="3" fill="#fca5a5" />
    <ellipse cx="38" cy="42" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="62" cy="42" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <rect x="32" y="24" width="36" height="6" rx="3" fill="#4c1d95" />
    <path d="M36 26 Q42 10 44 4 Q50 2 56 4 Q58 10 64 26 Z" fill="#4c1d95" />
    <path d="M50 2 Q58 -2 62 4 Q58 8 52 5 Z" fill="#4c1d95" />
    <rect x="38" y="22" width="24" height="5" rx="2.5" fill="#fbbf24" />
    <circle cx="50" cy="24.5" r="3" fill="#7c3aed" />
    <path
      d="M42 11.5 L43.3 12.7 L45 14 L43.3 15.3 L42 16.5 L40.7 15.3 L39 14 L40.7 12.7 Z"
      fill="#facc15"
    />
    <path d="M58 14 L59 15 L61 16 L59 17 L58 18 L57 17 L55 16 L57 15 Z" fill="#facc15" />
    <line
      x1="68"
      y1="78"
      x2="84"
      y2="62"
      stroke="#b45309"
      strokeWidth="3.5"
      strokeLinecap="round"
    />
    <path
      d="M86 53.5 L88.3 55.7 L92 58 L88.3 60.3 L86 62.5 L83.7 60.3 L80 58 L83.7 55.7 Z"
      fill="#facc15"
    />
    <path d="M88 66 L89 67 L91 68 L89 69 L88 70 L87 69 L85 68 L87 67 Z" fill="white" />
    <path
      d="M78 68.2 L78.9 69.1 L80 70 L78.9 70.9 L78 71.8 L77.1 70.9 L76 70 L77.1 69.1 Z"
      fill="white"
    />
  </svg>
);

const XRay: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="10" y="10" width="80" height="80" rx="10" fill="#0f172a" />
    <rect
      x="17"
      y="17"
      width="66"
      height="66"
      rx="6"
      fill="none"
      stroke="#334155"
      strokeWidth="1.5"
    />
    <rect x="20" y="13" width="14" height="3" rx="1.5" fill="#475569" opacity="0.6" />
    <rect x="47" y="46" width="6" height="8" rx="3" fill="#cbd5e1" />
    <rect x="47" y="55" width="6" height="8" rx="3" fill="#cbd5e1" />
    <rect x="47" y="64" width="6" height="8" rx="3" fill="#cbd5e1" />
    <rect x="47" y="73" width="6" height="8" rx="3" fill="#cbd5e1" />
    <circle cx="50" cy="30" r="11" fill="#cbd5e1" />
    <circle cx="45" cy="29" r="3" fill="#0f172a" />
    <circle cx="55" cy="29" r="3" fill="#0f172a" />
    <ellipse cx="50" cy="34" rx="1.5" ry="2" fill="#0f172a" />
    <rect x="40" y="38" width="20" height="7" rx="3.5" fill="#cbd5e1" />
    <line x1="46" y1="40" x2="46" y2="43" stroke="#0f172a" strokeWidth="1.5" />
    <line x1="54" y1="40" x2="54" y2="43" stroke="#0f172a" strokeWidth="1.5" />
    <path
      d="M45 41 Q30 42 22 47"
      stroke="#cbd5e1"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M55 41 Q70 42 78 47"
      stroke="#cbd5e1"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M47 50 Q32 45 22 55"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M47 57 Q34 53 24 63"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M47 64 Q37 61 29 70"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M47 71 Q39 69 33 76"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M53 50 Q68 45 78 55"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M53 57 Q66 53 76 63"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M53 64 Q63 61 71 70"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M53 71 Q61 69 67 76"
      stroke="#cbd5e1"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="24" cy="24" r="1.8" fill="#475569" />
    <circle cx="76" cy="24" r="1.8" fill="#475569" />
    <circle cx="24" cy="76" r="1.8" fill="#475569" />
    <circle cx="76" cy="76" r="1.8" fill="#475569" />
  </svg>
);

const Xylophone: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="14" y="78" width="72" height="8" rx="4" fill="#92400e" />
    <rect x="20" y="60" width="4" height="18" fill="#78350f" />
    <rect x="76" y="60" width="4" height="18" fill="#78350f" />
    <rect x="16" y="54" width="15" height="8" rx="2" fill="#ef4444" />
    <rect x="33" y="52" width="13" height="10" rx="2" fill="#f97316" />
    <rect x="48" y="50" width="11" height="12" rx="2" fill="#facc15" />
    <rect x="61" y="48" width="9" height="14" rx="2" fill="#22c55e" />
    <rect x="72" y="46" width="8" height="16" rx="2" fill="#3b82f6" />
    <circle cx="23" cy="52" r="2.5" fill="#fca5a5" />
    <circle cx="39" cy="50" r="2.5" fill="#fed7aa" />
    <circle cx="53" cy="48" r="2.5" fill="#fef9c3" />
    <circle cx="65" cy="46" r="2.5" fill="#bbf7d0" />
    <circle cx="76" cy="44" r="2.5" fill="#bfdbfe" />
    <line x1="32" y1="16" x2="44" y2="34" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
    <circle cx="47" cy="37" r="5.5" fill="#ef4444" />
    <line x1="68" y1="16" x2="58" y2="32" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
    <circle cx="55" cy="35" r="5.5" fill="#3b82f6" />
  </svg>
);

const Yellow: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M50 6 L56 14 L66 8 L68 18 L80 12 L78 24 L92 22 L86 34 L96 42 L86 50 L94 62 L80 62 L82 76 L68 72 L66 86 L54 78 L44 88 L40 74 L26 80 L30 66 L16 66 L24 54 L10 46 L22 38 L12 28 L28 28 L26 14 L40 18 L42 8 Z"
      fill="#facc15"
    />
    <ellipse cx="50" cy="44" rx="24" ry="26" fill="#fde047" opacity="0.6" />
    <ellipse
      cx="36"
      cy="30"
      rx="9"
      ry="14"
      fill="white"
      opacity="0.55"
      transform="rotate(-20 36 30)"
    />
    <ellipse cx="62" cy="60" rx="10" ry="6" fill="#eab308" opacity="0.35" />
    <path d="M74 78 C74 84 77 90 80 92 C83 90 86 84 86 78 Q80 72 74 78 Z" fill="#facc15" />
    <path d="M28 82 C28 87 30 92 32 94 C34 92 36 87 36 82 Q32 77 28 82 Z" fill="#facc15" />
    <circle cx="14" cy="20" r="3" fill="#facc15" />
    <circle cx="88" cy="14" r="2.5" fill="#facc15" />
    <circle cx="90" cy="72" r="2" fill="#facc15" />
    <circle cx="10" cy="52" r="2.5" fill="#facc15" />
  </svg>
);

const Yoyo: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <line x1="50" y1="4" x2="50" y2="52" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="6" r="4" fill="none" stroke="#9ca3af" strokeWidth="2.5" />
    <ellipse cx="50" cy="88" rx="14" ry="4" fill="#ef4444" opacity="0.2" />
    <circle cx="50" cy="64" r="19" fill="#ef4444" />
    <path
      d="M37 53 A15 15 0 0 1 48 47"
      stroke="#fecaca"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <circle cx="50" cy="64" r="12" fill="#fca5a5" />
    <circle cx="50" cy="64" r="12" fill="none" stroke="#f472b6" strokeWidth="2" />
    <path
      d="M50 55 L52.5 57.5 L57 60 L52.5 62.5 L50 65 L47.5 62.5 L43 60 L47.5 57.5 Z"
      fill="#facc15"
    />
    <ellipse
      cx="42"
      cy="52"
      rx="6"
      ry="3.5"
      fill="white"
      opacity="0.5"
      transform="rotate(-20 42 52)"
    />
    <path
      d="M18 58 Q14 64 18 70"
      stroke="#fca5a5"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M82 58 Q86 64 82 70"
      stroke="#fca5a5"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <line
      x1="44"
      y1="42"
      x2="46"
      y2="46"
      stroke="#fca5a5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <line
      x1="56"
      y1="42"
      x2="54"
      y2="46"
      stroke="#fca5a5"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const Zebra: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M72 66 Q83 72 84 80"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="85" cy="82" r="3" fill="#1c1917" />
    <path
      d="M34 52 C32 40 30 32 28 28"
      stroke="#f8fafc"
      strokeWidth="11"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="62" rx="26" ry="16" fill="#f8fafc" />
    <path
      d="M35 50 Q36 63 35 75"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M43 50 Q44 63 43 75"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M51 51 Q52 63 51 75"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M59 51 Q60 63 59 74"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M67 52 Q68 63 67 73"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M30 36 Q36 38 40 36"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M32 42 Q38 44 42 42"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M38 74 L36 88" stroke="#1c1917" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M57 74 L55 88" stroke="#1c1917" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M45 76 L43 90" stroke="#1c1917" strokeWidth="6.5" fill="none" strokeLinecap="round" />
    <path d="M65 76 L67 90" stroke="#1c1917" strokeWidth="6.5" fill="none" strokeLinecap="round" />
    <path d="M41 82 L47 84" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M63 82 L69 84" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="32" y="88" width="7" height="3.5" rx="1.5" fill="#1c1917" />
    <rect x="51" y="88" width="7" height="3.5" rx="1.5" fill="#1c1917" />
    <rect x="39" y="90" width="8" height="4" rx="2" fill="#1c1917" />
    <rect x="63" y="90" width="8" height="4" rx="2" fill="#1c1917" />
    <path d="M29 16 L27 5 L36 11 Z" fill="#f8fafc" />
    <path d="M30 14 L29 9 L34 12 Z" fill="#f472b6" />
    <ellipse cx="26" cy="24" rx="11" ry="9" fill="#f8fafc" />
    <ellipse cx="15" cy="26" rx="5.5" ry="4.5" fill="#374151" />
    <path
      d="M33 20 Q30 23 28 26"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M34 17 Q31 20 29 23"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M32 15 Q40 19 38 29"
      stroke="#1c1917"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M36 19 Q44 23 40 33"
      stroke="#1c1917"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M38 25 Q46 29 42 39"
      stroke="#1c1917"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="23" cy="21" r="2.5" fill="#1c1917" />
    <circle cx="24" cy="20" r="0.9" fill="white" />
    <circle cx="11" cy="26" r="1.2" fill="white" />
    <path
      d="M12 29 Q15 31 18 30"
      stroke="#1c1917"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Zombie: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="48" rx="24" ry="26" fill="#84cc16" />
    <path
      d="M36 28 Q34 18 30 14"
      stroke="#166534"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M44 22 Q42 12 40 8"
      stroke="#166534"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M52 22 Q52 12 54 8"
      stroke="#166534"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M60 24 Q62 14 66 12"
      stroke="#166534"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M66 30 Q72 24 76 24"
      stroke="#166534"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M32 32 Q24 30 20 32"
      stroke="#166534"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M24 42 L32 41 L34 55 L26 56 Z" fill="#f5f5f4" />
    <path d="M38 34 L48 30" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M41 32.5 L43 30.5 M45 30.5 L47 29.5"
      stroke="#1c1917"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="40" cy="46" r="5.5" fill="#1c1917" />
    <circle cx="60" cy="46" r="5.5" fill="#1c1917" />
    <circle cx="41" cy="44" r="1.8" fill="white" />
    <circle cx="61" cy="44" r="1.8" fill="white" />
    <circle cx="50" cy="52" r="3" fill="#65a30d" />
    <circle cx="48.5" cy="52" r="0.8" fill="#166534" />
    <circle cx="51.5" cy="52" r="0.8" fill="#166534" />
    <path
      d="M38 60 Q50 66 62 60"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M42 61 L44 63 M48 63 L50 65 M54 63 L56 61 M58 61 L60 62"
      stroke="#1c1917"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="68" cy="54" r="3.5" fill="#84cc16" />
    <circle cx="68" cy="54" r="2" fill="#65a30d" />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Umbrella,
  Unicorn,
  Ukulele,
  UFO,
  Unicycle,
  Violin,
  Van,
  Volcano,
  Water,
  Watermelon,
  Whale,
  Wizard,
  'X-Ray': XRay,
  Xylophone,
  Yellow,
  Yoyo,
  Zebra,
  Zombie,
};
