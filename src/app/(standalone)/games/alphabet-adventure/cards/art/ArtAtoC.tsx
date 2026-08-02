'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Apple: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M50 30 Q48 22 42 23 Q38 24 39 29 Q40 33 50 30 Z"
      fill="#ef4444"
      stroke="#1c1917"
      strokeWidth="2.5"
    />
    <circle cx="50" cy="58" r="30" fill="#ef4444" stroke="#1c1917" strokeWidth="2.5" />
    <ellipse cx="44" cy="72" rx="18" ry="7" fill="#dc2626" opacity="0.35" />
    <path
      d="M50 28 Q48 16 42 11"
      stroke="#78350f"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M44 12 Q38 4 48 3 Q50 7 44 12"
      fill="#22c55e"
      stroke="#1c1917"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    <ellipse cx="39" cy="48" rx="5" ry="9" fill="#fca5a5" opacity="0.4" />
    <ellipse cx="36" cy="42" rx="2.5" ry="4" fill="white" opacity="0.6" />
  </svg>
);

const Ant: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="34" cy="46" r="9" fill="#dc2626" stroke="#1c1917" strokeWidth="2.5" />
    <ellipse cx="48" cy="52" rx="7" ry="6" fill="#dc2626" stroke="#1c1917" strokeWidth="2.5" />
    <ellipse cx="64" cy="60" rx="13" ry="12" fill="#dc2626" stroke="#1c1917" strokeWidth="2.5" />
    <circle cx="37" cy="42" r="3" fill="white" />
    <circle cx="38" cy="41.5" r="1.3" fill="#1c1917" />
    <circle cx="60" cy="55" r="2" fill="white" opacity="0.6" />
    <path
      d="M27 40 Q23 32 19 30"
      stroke="#dc2626"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M27 44 Q25 34 23 28"
      stroke="#dc2626"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M44 54 Q40 62 36 66"
      stroke="#dc2626"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 56 Q50 64 48 70"
      stroke="#dc2626"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M58 62 Q62 70 64 76"
      stroke="#dc2626"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M36 52 Q39 55 43 53"
      stroke="#7f1d1d"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Axe: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <defs>
      <linearGradient id="axeWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F6AD55" />
        <stop offset="40%" stopColor="#C05621" />
        <stop offset="100%" stopColor="#7B341E" />
      </linearGradient>
      <linearGradient id="axeMetal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#94A3B8" />
        <stop offset="50%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>
      <linearGradient id="axeEdge" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#CBD5E1" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
      <linearGradient id="axeLeather" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#9A3412" />
        <stop offset="100%" stopColor="#431407" />
      </linearGradient>
      <linearGradient id="axeBrass" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="50%" stopColor="#CA8A04" />
        <stop offset="100%" stopColor="#854D0E" />
      </linearGradient>
    </defs>

    {/* 1. Wooden handle */}
    <path
      d="M 29.6,80.4 C 34,73.6 40,62.4 46.4,50.4 C 52.8,38.4 59.2,25.6 62.4,19.2 C 63.6,16.8 66.4,18.4 65,20.8 C 61.8,26.8 55.2,39.6 48.8,51.6 C 42.4,63.6 36,74.8 31.6,81.6 C 30.2,83.4 28.2,82.2 29.6,80.4 Z"
      fill="url(#axeWood)"
      stroke="#1e1b18"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    {/* Wood grain */}
    <path
      d="M 36,70 C 38.4,65 42,58 44.4,53.6"
      stroke="#7b341e"
      strokeWidth="0.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M 45.6,49 C 49,42 52.4,35 55,30"
      stroke="#7b341e"
      strokeWidth="0.6"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />

    {/* 2. Leather grip wraps */}
    <g stroke="#1e1b18" strokeWidth="0.8" strokeLinejoin="round">
      <path d="M 30.8,79.2 Q 34,76.8 35.8,78.8 Q 32.8,81.2 30,80.6 Z" fill="url(#axeLeather)" />
      <path d="M 33,75.2 Q 36.2,72.8 38,74.8 Q 35,77.2 32.2,76.6 Z" fill="url(#axeLeather)" />
      <path d="M 35.4,71.2 Q 38.6,68.8 40.4,70.8 Q 37.4,73.2 34.6,72.6 Z" fill="url(#axeLeather)" />
      <path d="M 37.8,67.2 Q 41,64.8 42.8,66.8 Q 39.8,69.2 37,68.6 Z" fill="url(#axeLeather)" />
      <path d="M 40.2,63.2 Q 43.4,60.8 45.2,62.8 Q 42.2,65.2 39.4,64.6 Z" fill="url(#axeLeather)" />
    </g>

    {/* 3. Back poll (hammer side) */}
    <path
      d="M 55.2,30.4 L 46.4,34.4 C 44.8,35 43.6,32.8 44.6,31.2 L 50.8,24 C 51.6,22.8 53.4,23 54.4,24.2 Z"
      fill="url(#axeMetal)"
      stroke="#1e1b18"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* 4. Main blade body */}
    <path
      d="M 58.4,24.4 C 65.6,19 71.6,15.6 79,14 C 80.4,13.6 81.2,15 80.6,16.4 C 78.4,23.6 78.4,29.6 76.4,36 L 74.4,36.6 L 75.8,38.4 C 73,43.6 69,47.6 66,50 C 64.8,51 63.2,50 63.6,48.4 C 65,44 61,36.4 56,31.6 Z"
      fill="url(#axeMetal)"
      stroke="#1e1b18"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />

    {/* 5. Shiny cutting edge / bevel */}
    <path
      d="M 79,14 C 84.4,26 80.4,39 66,50 C 64.8,47 69.6,39 71.6,30 C 73.2,22.4 72,18 79,14 Z"
      fill="url(#axeEdge)"
      stroke="#1e1b18"
      strokeWidth="1"
      strokeLinejoin="round"
    />
    <path
      d="M 78,16.4 C 81,25.6 77.6,37 68,47"
      stroke="#FFFFFF"
      strokeWidth="1"
      strokeLinecap="round"
      fill="none"
      opacity="0.9"
    />

    {/* 6. Brass collar & rivets */}
    <path
      d="M 52.8,33.2 L 56.4,30.8 L 58,33.2 L 54.4,35.6 Z"
      fill="url(#axeBrass)"
      stroke="#1e1b18"
      strokeWidth="0.8"
      strokeLinejoin="round"
    />
    <circle cx="57.2" cy="27.6" r="1" fill="url(#axeBrass)" stroke="#1e1b18" strokeWidth="0.6" />
    <circle cx="56.8" cy="27.4" r="0.3" fill="#FFFFFF" />

    {/* 7. Sparkle glint on tip */}
    <path
      d="M 79,10.4 Q 79,14 82.6,14 Q 79,14 79,17.6 Q 79,14 75.4,14 Q 79,14 79,10.4 Z"
      fill="#FFFFFF"
      stroke="#E0F2FE"
      strokeWidth="0.3"
    />
  </svg>
);

const Alligator: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M34 62 C18 64 8 56 8 46 C10 38 18 42 22 48 C26 54 30 58 34 60 Z" fill="#22c55e" />
    <ellipse cx="52" cy="64" rx="26" ry="13" fill="#22c55e" />
    <ellipse cx="48" cy="68" rx="18" ry="7" fill="#86efac" opacity="0.6" />
    <path d="M72 72 L76 84" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M52 73 L54 86" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M36 71 L34 85" stroke="#16a34a" strokeWidth="4" fill="none" strokeLinecap="round" />
    <ellipse cx="76" cy="85" rx="4" ry="2.5" fill="#16a34a" />
    <ellipse cx="54" cy="87" rx="4" ry="2.5" fill="#16a34a" />
    <ellipse cx="34" cy="86" rx="4" ry="2.5" fill="#16a34a" />
    <circle cx="32" cy="54" r="3.5" fill="#16a34a" />
    <circle cx="42" cy="52" r="3.5" fill="#16a34a" />
    <circle cx="52" cy="53" r="3.5" fill="#16a34a" />
    <circle cx="62" cy="55" r="3.5" fill="#16a34a" />
    <circle cx="20" cy="50" r="2.5" fill="#16a34a" />
    <circle cx="14" cy="46" r="2" fill="#16a34a" />
    <path d="M72 52 C84 44 96 46 98 55 C99 59 96 61 92 62 C86 64 78 63 72 61 Z" fill="#22c55e" />
    <path d="M73 62 L92 61 L96 66 L90 67 L73 66 Z" fill="#7f1d1d" />
    <path d="M73 66 C80 68 88 67 92 66 L97 76 L93 79 C86 74 78 70 72 68 Z" fill="#22c55e" />
    <polygon points="77,62 78.5,67 81,62.5" fill="white" />
    <polygon points="83,62.5 84.5,67 87,63" fill="white" />
    <polygon points="89,63 90.5,67 92,63.3" fill="white" />
    <polygon points="82,66.5 83,62 85,66.5" fill="white" />
    <polygon points="89,66.8 90,63 91.5,66.8" fill="white" />
    <circle cx="84" cy="50" r="4" fill="white" />
    <ellipse cx="84" cy="51.5" rx="1.6" ry="2.6" fill="#1c1917" />
    <circle cx="83" cy="49.3" r="1" fill="white" />
    <circle cx="94" cy="52.5" r="1.5" fill="#166534" />
    <circle cx="77" cy="49" r="3" fill="#16a34a" />
    <circle cx="89" cy="48" r="2.5" fill="#16a34a" />
  </svg>
);

const Astronaut: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="34" y="50" width="8" height="18" rx="3" fill="#94a3b8" />
    <circle cx="50" cy="36" r="17" fill="#e2e8f0" />
    <circle cx="50" cy="38" r="11" fill="#1e3a5f" />
    <ellipse cx="46" cy="34" rx="3" ry="5" fill="white" opacity="0.5" />
    <rect x="40" y="54" width="20" height="26" rx="9" fill="#e2e8f0" />
    <rect x="40" y="58" width="20" height="4" rx="2" fill="#ef4444" />
    <rect x="40" y="66" width="20" height="4" rx="2" fill="#3b82f6" />
    <path
      d="M40 58 Q32 62 30 72"
      stroke="#cbd5e1"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M60 58 Q68 62 70 72"
      stroke="#cbd5e1"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M46 80 Q44 88 44 92"
      stroke="#cbd5e1"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M54 80 Q56 88 56 92"
      stroke="#cbd5e1"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 19 Q50 10 56 8"
      stroke="#94a3b8"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="57" cy="7" r="2.5" fill="#ef4444" />
  </svg>
);

const Ball: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 18 A32 32 0 0 1 82 50 L50 50 Z" fill="#ef4444" />
    <path d="M82 50 A32 32 0 0 1 50 82 L50 50 Z" fill="#facc15" />
    <path d="M50 82 A32 32 0 0 1 18 50 L50 50 Z" fill="#22c55e" />
    <path d="M18 50 A32 32 0 0 1 50 18 L50 50 Z" fill="#3b82f6" />
    <circle cx="50" cy="50" r="10" fill="white" />
    <ellipse cx="38" cy="36" rx="6" ry="4" fill="white" opacity="0.4" />
  </svg>
);

const Bird: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="24,52 10,44 12,60" fill="#2563eb" />
    <ellipse cx="46" cy="56" rx="20" ry="16" fill="#3b82f6" />
    <circle cx="68" cy="40" r="13" fill="#3b82f6" />
    <ellipse cx="42" cy="60" rx="10" ry="6" fill="#2563eb" />
    <ellipse cx="42" cy="64" rx="8" ry="5" fill="white" opacity="0.3" />
    <circle cx="72" cy="36" r="4" fill="white" />
    <circle cx="73" cy="35" r="2" fill="#1c1917" />
    <polygon points="79,38 91,42 79,46" fill="#facc15" />
    <path
      d="M44 72 Q42 78 40 82"
      stroke="#f97316"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M52 72 Q54 78 56 82"
      stroke="#f97316"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Banana: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M20 76 Q30 34 50 24 Q72 16 88 26 Q64 44 56 52 Q36 66 20 76 Z"
      fill="#facc15"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path d="M88 24 L94 18" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="88" cy="26" r="3" fill="#78350f" />
    <circle cx="20" cy="76" r="3" fill="#78350f" />
    <path
      d="M34 58 Q42 40 62 34"
      stroke="#f59e0b"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

const Bear: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="27" cy="33" r="9" fill="#92400e" />
    <circle cx="73" cy="33" r="9" fill="#92400e" />
    <circle cx="27" cy="33" r="4.5" fill="#b45309" />
    <circle cx="73" cy="33" r="4.5" fill="#b45309" />
    <circle cx="50" cy="54" r="26" fill="#92400e" />
    <ellipse cx="50" cy="62" rx="12" ry="9" fill="#fde68a" />
    <circle cx="39" cy="46" r="3.5" fill="#1c1917" />
    <circle cx="40" cy="45" r="1" fill="white" />
    <circle cx="61" cy="46" r="3.5" fill="#1c1917" />
    <circle cx="62" cy="45" r="1" fill="white" />
    <ellipse cx="50" cy="58" rx="4.5" ry="3.5" fill="#1c1917" />
    <path
      d="M46 64 Q50 68 54 64"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="37" cy="57" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.6" />
    <ellipse cx="63" cy="57" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.6" />
  </svg>
);

const Cat: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon
      points="30,40 26,14 48,26"
      fill="#f97316"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <polygon
      points="70,40 74,14 52,26"
      fill="#f97316"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <polygon points="32,36 30,20 43,27" fill="#fda4af" />
    <polygon points="68,36 70,20 57,27" fill="#fda4af" />
    <circle cx="50" cy="55" r="23" fill="#f97316" stroke="#1c1917" strokeWidth="2.5" />
    <path
      d="M42 36 Q44 32 42 28"
      stroke="#ea580c"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M58 36 Q56 32 58 28"
      stroke="#ea580c"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="41" cy="50" r="3.5" fill="#1c1917" />
    <circle cx="42" cy="49" r="1" fill="white" />
    <circle cx="59" cy="50" r="3.5" fill="#1c1917" />
    <circle cx="60" cy="49" r="1" fill="white" />
    <polygon points="50,55 46,60 54,60" fill="#f472b6" />
    <path
      d="M50 60 Q47 63 44 61"
      stroke="#1c1917"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 60 Q53 63 56 61"
      stroke="#1c1917"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M30 56 L20 54" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M30 60 L20 62" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M70 56 L80 54" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M70 60 L80 62" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const Cow: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="34,34 38,22 44,32" fill="#facc15" />
    <polygon points="66,34 62,22 56,32" fill="#facc15" />
    <ellipse cx="24" cy="52" rx="7" ry="10" fill="#f8fafc" />
    <ellipse cx="76" cy="52" rx="7" ry="10" fill="#f8fafc" />
    <ellipse cx="24" cy="52" rx="3.5" ry="6" fill="#fca5a5" />
    <ellipse cx="76" cy="52" rx="3.5" ry="6" fill="#fca5a5" />
    <ellipse cx="50" cy="54" rx="26" ry="22" fill="#f8fafc" />
    <path d="M50 36 Q56 32 58 38 Q56 44 50 42 Q46 40 50 36 Z" fill="#1c1917" />
    <circle cx="64" cy="40" r="3" fill="#1c1917" />
    <circle cx="34" cy="58" r="2.5" fill="#1c1917" />
    <ellipse cx="50" cy="64" rx="13" ry="9" fill="#fca5a5" />
    <circle cx="45" cy="65" r="1.5" fill="#92400e" />
    <circle cx="55" cy="65" r="1.5" fill="#92400e" />
    <circle cx="36" cy="48" r="3.5" fill="#1c1917" />
    <circle cx="37" cy="47" r="1" fill="white" />
    <circle cx="64" cy="48" r="3.5" fill="#1c1917" />
    <circle cx="65" cy="47" r="1" fill="white" />
    <path
      d="M46 70 Q50 73 54 70"
      stroke="#92400e"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Car: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="32" y="30" width="38" height="22" rx="6" fill="#ef4444" />
    <rect x="35" y="33" width="14" height="16" rx="3" fill="#93c5fd" />
    <rect x="53" y="33" width="14" height="16" rx="3" fill="#93c5fd" />
    <rect x="12" y="50" width="76" height="24" rx="8" fill="#ef4444" />
    <rect x="12" y="62" width="76" height="5" rx="2.5" fill="#facc15" />
    <rect x="14" y="53" width="3" height="6" rx="1" fill="#f87171" />
    <circle cx="86" cy="56" r="3" fill="#facc15" />
    <circle cx="30" cy="76" r="10" fill="#1c1917" />
    <circle cx="70" cy="76" r="10" fill="#1c1917" />
    <circle cx="30" cy="76" r="4" fill="#d1d5db" />
    <circle cx="70" cy="76" r="4" fill="#d1d5db" />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Apple,
  Ant,
  Axe,
  Alligator,
  Astronaut,
  Ball,
  Bird,
  Banana,
  Bear,
  Cat,
  Cow,
  Car,
};
