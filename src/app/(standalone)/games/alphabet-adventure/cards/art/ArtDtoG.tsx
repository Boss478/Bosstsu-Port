'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Dog: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="32" cy="76" rx="9" ry="11" fill="#b45309" />
    <ellipse cx="68" cy="76" rx="9" ry="11" fill="#b45309" />
    <path
      d="M75 62 Q90 64 88 50 Q87 43 81 45"
      stroke="#d97706"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="70" rx="26" ry="20" fill="#d97706" />
    <ellipse cx="50" cy="78" rx="13" ry="9" fill="#fde68a" />
    <rect x="36" y="80" width="8" height="11" rx="4" fill="#92400e" />
    <rect x="56" y="80" width="8" height="11" rx="4" fill="#92400e" />
    <rect x="36" y="49" width="28" height="6" rx="3" fill="#ef4444" />
    <circle cx="50" cy="60" r="3.5" fill="#facc15" />
    <path d="M35 26 Q18 28 22 44 Q29 50 37 40" fill="#92400e" />
    <path d="M65 26 Q82 28 78 44 Q71 50 63 40" fill="#92400e" />
    <circle cx="50" cy="36" r="17" fill="#d97706" />
    <ellipse cx="50" cy="44" rx="11" ry="7.5" fill="#fde68a" />
    <circle cx="43" cy="34" r="3" fill="#1c1917" />
    <circle cx="57" cy="34" r="3" fill="#1c1917" />
    <circle cx="44" cy="33" r="1" fill="white" />
    <circle cx="58" cy="33" r="1" fill="white" />
    <ellipse cx="50" cy="41.5" rx="3.2" ry="2.4" fill="#1c1917" />
    <path d="M50 44 L50 47.5" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M46.5 47.5 Q50 53.5 53.5 47.5 Z" fill="#ef4444" />
  </svg>
);

const Duck: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="58" rx="28" ry="22" fill="#facc15" />
    <circle cx="32" cy="42" r="14" fill="#facc15" />
    <path d="M20 44 Q14 48 16 54 L26 52Z" fill="#f97316" />
    <path d="M26 52 L34 48" stroke="#ea580c" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="28" cy="38" r="3" fill="#1c1917" />
    <circle cx="29" cy="37" r="1" fill="white" />
    <ellipse cx="50" cy="60" rx="20" ry="16" fill="#fde047" />
    <path d="M56 50 Q62 46 66 50 Q62 54 56 52Z" fill="#fbbf24" />
    <rect x="42" y="76" width="7" height="10" rx="3" fill="#f97316" />
    <rect x="52" y="76" width="7" height="10" rx="3" fill="#f97316" />
    <ellipse cx="24" cy="78" rx="10" ry="4" fill="#60a5fa" opacity="0.5" />
    <ellipse cx="74" cy="80" rx="12" ry="5" fill="#60a5fa" opacity="0.5" />
    <path
      d="M18 84 Q24 80 30 84"
      stroke="#3b82f6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M66 86 Q72 82 78 86"
      stroke="#3b82f6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Dolphin: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <defs>
      <linearGradient id="doBody" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38BDF8" />
        <stop offset="50%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#0369A1" />
      </linearGradient>
      <linearGradient id="doFin" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0284C7" />
        <stop offset="100%" stopColor="#075985" />
      </linearGradient>
      <linearGradient id="doBelly" x1="20%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#E0F2FE" />
      </linearGradient>
      <linearGradient id="doRed" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FF6B6B" />
        <stop offset="100%" stopColor="#EE5253" />
      </linearGradient>
      <linearGradient id="doYellow" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FECA57" />
        <stop offset="100%" stopColor="#FF9F43" />
      </linearGradient>
      <linearGradient id="doBlue" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#48DBFB" />
        <stop offset="100%" stopColor="#0ABDE3" />
      </linearGradient>
    </defs>

    {/* Back flipper (far side) */}
    <path
      d="M 41.25,42.5 C 38.75,47.5 33.75,51.25 31.25,50 C 30,49.4 32.5,45 36.9,41.25 Z"
      fill="url(#doFin)"
    />

    {/* Tail flukes */}
    <path
      d="M 76.25,47.5 C 80.6,49.4 86.25,53.75 88.75,56.9 C 85.6,56.9 80.6,52.5 75,49.4 Z"
      fill="url(#doBody)"
    />
    <path
      d="M 75.6,48.75 C 77.5,53.1 80,60 80.6,63.1 C 78.75,61.25 75.6,55.6 74.4,50 Z"
      fill="url(#doBody)"
    />
    <path
      d="M 76.25,48.1 C 80,50 84.4,53.75 86.25,56.25 C 84.4,56 80.6,52.75 76.25,49.4 Z"
      fill="#7DD3FC"
      opacity="0.4"
    />

    {/* Dorsal fin */}
    <path
      d="M 45,21.5 C 46.25,13.75 52.5,10 56.9,10.6 C 54.4,14.4 52.5,18.75 53.1,23.5 Z"
      fill="url(#doBody)"
    />
    <path
      d="M 46.9,20 C 48.1,14.75 52.5,11.9 55.25,11.5 C 53.75,14.4 52.25,18.1 52.5,21.5 Z"
      fill="#7DD3FC"
      opacity="0.4"
    />

    {/* Main body */}
    <path
      d="M 21.25,35.6 C 26.25,22.5 42.5,18.75 57.5,25 C 67.5,29.4 75,40 76.25,48.75 C 68.75,43.75 61.25,40 52.5,41.25 C 41.25,43.1 31.25,47.5 23.75,40.6 C 21.9,39 20.6,37.25 21.25,35.6 Z"
      fill="url(#doBody)"
    />

    {/* Snout / beak */}
    <path
      d="M 21.5,35.4 C 17.5,35.6 13.75,36.9 12.5,38.75 C 11.9,39.75 13.1,41 15.6,41 C 18.75,41 21.9,40 24.4,39 Z"
      fill="url(#doBody)"
    />

    {/* Belly */}
    <path
      d="M 15,40.4 C 18.1,40.6 21.9,39.75 24.4,39 C 30,45.6 38.75,42.5 50,41 C 60,39.75 68.75,43.75 74.75,48.5 C 68.1,45 60,42.25 51.25,43.1 C 40,44.4 30,48.75 22.25,41.5 C 18.75,41.5 16.25,41 15,40.4 Z"
      fill="url(#doBelly)"
    />

    {/* Front flipper */}
    <path
      d="M 39.4,41.9 C 37.5,47.5 35,55 36.9,58.1 C 38.1,59 40.6,56.25 43.1,50 C 44.4,46.9 43.75,43.75 42.5,41.9 Z"
      fill="url(#doBody)"
    />
    <path
      d="M 39.75,43.1 C 38.5,47.75 36.5,54.4 37.75,56.9 C 38.75,55.6 41,50.6 42.25,45.6 Z"
      fill="#7DD3FC"
      opacity="0.45"
    />

    {/* Curved highlights */}
    <path
      d="M 26.25,29.4 C 33.75,23.1 45,21.9 55,25.6"
      stroke="#FFFFFF"
      strokeWidth="0.9"
      strokeLinecap="round"
      fill="none"
      opacity="0.4"
    />
    <path
      d="M 28.75,26.9 C 34.4,22.75 41.9,21.9 48.75,24"
      stroke="#FFFFFF"
      strokeWidth="0.45"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />

    {/* Face */}
    <ellipse
      cx="25.6"
      cy="38.75"
      rx="1.75"
      ry="1.1"
      fill="#FF758F"
      opacity="0.45"
      transform="rotate(-10 25.6 38.75)"
    />
    <circle cx="26.25" cy="33.75" r="1.9" fill="#0F172A" />
    <circle cx="25.6" cy="33.1" r="0.75" fill="#FFFFFF" />
    <circle cx="27.1" cy="34.5" r="0.4" fill="#FFFFFF" />
    <path
      d="M 24,32.9 C 25,31.25 27.5,31.25 28.5,32.5"
      stroke="#0369A1"
      strokeWidth="0.4"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M 14,39.6 C 17.5,40.5 20.6,40.25 23.1,38.5"
      stroke="#0369A1"
      strokeWidth="0.45"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M 22.5,38.1 C 23,38.5 23.4,39.1 23,39.6"
      stroke="#0369A1"
      strokeWidth="0.45"
      strokeLinecap="round"
      fill="none"
    />

    {/* Beach ball balanced on the nose */}
    <g transform="translate(13.75, 32.9) rotate(-15)">
      <circle cx="0" cy="0" r="5.25" fill="#FFFFFF" />
      <path d="M 0,-5.25 A 5.25 5.25 0 0 1 4.5,2.6 L 0,0 Z" fill="url(#doRed)" />
      <path d="M -4.5,2.6 A 5.25 5.25 0 0 1 -4.5,-2.6 L 0,0 Z" fill="url(#doBlue)" />
      <path d="M 0,5.25 A 5.25 5.25 0 0 1 -4.5,-2.6 L 0,0 Z" fill="url(#doYellow)" />
      <circle cx="0" cy="0" r="5.25" fill="none" stroke="#FFFFFF" strokeWidth="0.3" />
      <circle cx="0" cy="-5.25" r="0.9" fill="#FFFFFF" />
      <circle cx="0" cy="0" r="1" fill="#FFFFFF" />
      <path
        d="M -3.1,-3.1 A 4.4 4.4 0 0 1 1.25,-4.75 A 4.75 4.75 0 0 0 -2.5,-1.25 Z"
        fill="#FFFFFF"
        opacity="0.6"
      />
    </g>

    {/* Motion arcs around ball */}
    <path
      d="M 16.9,18.1 A 6.9 6.9 0 0 1 20,22.5"
      stroke="#38BDF8"
      strokeWidth="0.4"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
    <path
      d="M 4.4,22.5 A 6.9 6.9 0 0 1 6.25,18.1"
      stroke="#38BDF8"
      strokeWidth="0.4"
      strokeLinecap="round"
      fill="none"
      opacity="0.7"
    />
  </svg>
);

const Dragon: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M62 66 Q74 72 76 62 Q78 54 72 50"
      stroke="#22c55e"
      strokeWidth="7"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M74 58 L82 54 L74 50 Z" fill="#16a34a" />
    <path d="M56 44 L60 36 L64 44 Z" fill="#16a34a" />
    <path d="M46 42 L50 34 L54 42 Z" fill="#16a34a" />
    <path d="M36 44 L40 36 L44 44 Z" fill="#16a34a" />
    <ellipse cx="46" cy="62" rx="22" ry="18" fill="#22c55e" />
    <ellipse cx="40" cy="66" rx="12" ry="10" fill="#86efac" opacity="0.6" />
    <path d="M42 76 L40 90" stroke="#22c55e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M54 76 L56 90" stroke="#22c55e" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M34 74 L32 88" stroke="#22c55e" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M58 74 L60 88" stroke="#22c55e" strokeWidth="7" fill="none" strokeLinecap="round" />
    <ellipse cx="32" cy="90" rx="5" ry="3.5" fill="#16a34a" />
    <ellipse cx="60" cy="90" rx="5" ry="3.5" fill="#16a34a" />
    <ellipse cx="40" cy="92" rx="4" ry="3" fill="#16a34a" opacity="0.8" />
    <ellipse cx="56" cy="92" rx="4" ry="3" fill="#16a34a" opacity="0.8" />
    <path d="M58 44 C66 30 78 26 82 34 C84 38 80 44 74 46 C70 48 64 48 60 48 Z" fill="#16a34a" />
    <path d="M60 46 C66 38 74 34 76 38 C74 42 68 44 62 45 Z" fill="#4ade80" opacity="0.6" />
    <circle cx="28" cy="34" r="16" fill="#22c55e" />
    <ellipse cx="16" cy="38" rx="8" ry="6" fill="#22c55e" />
    <path d="M22 20 L18 8 L27 16 Z" fill="#facc15" />
    <path d="M30 18 L30 6 L36 15 Z" fill="#facc15" />
    <circle cx="24" cy="32" r="4" fill="white" />
    <circle cx="25" cy="33" r="2" fill="#1c1917" />
    <circle cx="24" cy="31" r="0.8" fill="white" />
    <circle cx="10" cy="37" r="1.3" fill="#166534" />
    <path d="M8 45 Q3 40 7 35 Q9 39 12 40 Q10 43 8 45 Z" fill="#f97316" />
    <path d="M8 44 Q5 41 7 38 Q8 40 10 41 Q9 42 8 44 Z" fill="#facc15" />
    <path
      d="M12 43 Q16 46 20 44"
      stroke="#15803d"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="31" cy="41" rx="3.5" ry="2" fill="#fca5a5" opacity="0.5" />
  </svg>
);

const Ear: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M50 14 C24 14 18 36 20 56 C22 76 36 86 54 86 C72 86 80 70 78 52 C76 38 62 36 56 42 C48 48 50 58 56 62 C60 65 56 72 50 72 C40 72 38 58 39 44 C40 28 48 20 58 20 C66 20 70 26 72 34 C72 26 64 14 50 14 Z"
      fill="#f59e0b"
      stroke="#1c1917"
      strokeWidth="2.5"
      strokeLinejoin="round"
    />
    <path
      d="M43 40 C39 50 42 62 50 66"
      stroke="#fbbf24"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M47 46 C44 52 46 58 50 60"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

const Eye: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M14 50 Q50 18 86 50 Q50 82 14 50Z" fill="white" stroke="#1c1917" strokeWidth="3" />
    <circle cx="50" cy="50" r="18" fill="#3b82f6" />
    <circle cx="50" cy="50" r="11" fill="#1e3a5f" />
    <circle cx="50" cy="50" r="5" fill="#1c1917" />
    <circle cx="54" cy="44" r="4" fill="white" />
    <circle cx="46" cy="56" r="1.5" fill="white" opacity="0.8" />
    <path
      d="M18 44 Q28 40 40 38"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M82 56 Q72 60 60 62"
      stroke="#1c1917"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M14 42 Q24 38 36 38"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M86 58 Q76 62 64 62"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Egg: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 8 Q76 26 76 58 Q76 84 50 90 Q24 84 24 58 Q24 26 50 8 Z" fill="#fde68a" />
    <ellipse
      cx="38"
      cy="32"
      rx="7"
      ry="12"
      fill="white"
      opacity="0.7"
      transform="rotate(-15 38 32)"
    />
    <ellipse cx="50" cy="78" rx="14" ry="7" fill="#d97706" opacity="0.25" />
    <circle cx="38" cy="52" r="2.5" fill="#d97706" opacity="0.5" />
    <circle cx="56" cy="58" r="2" fill="#d97706" opacity="0.5" />
    <circle cx="44" cy="66" r="2.2" fill="#d97706" opacity="0.5" />
    <circle cx="60" cy="44" r="1.8" fill="#d97706" opacity="0.5" />
    <path
      d="M64 22 L60 28 L64 32 L61 38"
      stroke="#d97706"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
  </svg>
);

const Elephant: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M76 56 Q88 60 90 70 Q91 76 87 78"
      stroke="#9ca3af"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="54" cy="64" rx="28" ry="22" fill="#9ca3af" />
    <ellipse cx="54" cy="72" rx="16" ry="6" fill="#c4c4c4" opacity="0.5" />
    <path d="M50 36 C60 30 68 44 64 58 C60 72 48 74 42 64 C38 56 40 44 50 36 Z" fill="#6b7280" />
    <circle cx="38" cy="46" r="22" fill="#9ca3af" />
    <ellipse cx="62" cy="52" rx="4" ry="9" fill="#a3a3a3" />
    <path
      d="M26 52 Q12 58 12 72 Q12 84 24 86 C28 87 32 84 30 80"
      stroke="#9ca3af"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M13 62 Q18 64 23 62"
      stroke="#6b7280"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M12 72 Q18 74 23 72"
      stroke="#6b7280"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M26 62 Q16 64 12 56"
      stroke="#f8fafc"
      strokeWidth="4.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M28 60 Q20 60 18 52"
      stroke="#f8fafc"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path d="M42 82 L40 94" stroke="#9ca3af" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M64 82 L66 94" stroke="#9ca3af" strokeWidth="9" fill="none" strokeLinecap="round" />
    <ellipse cx="40" cy="95" rx="7" ry="3.5" fill="#6b7280" />
    <ellipse cx="66" cy="95" rx="7" ry="3.5" fill="#6b7280" />
    <circle cx="32" cy="42" r="3.5" fill="#1c1917" />
    <circle cx="33" cy="41" r="1.2" fill="white" />
  </svg>
);

const Elf: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M34 28 Q36 6 50 4 Q64 6 66 28 Z" fill="#22c55e" />
    <path d="M50 4 Q58 -2 64 4 Q60 10 52 8 Z" fill="#22c55e" />
    <circle cx="52" cy="9" r="2.5" fill="#facc15" />
    <rect x="32" y="26" width="36" height="6" rx="3" fill="#16a34a" />
    <path d="M34 44 Q26 40 22 32 Q28 42 34 46 Z" fill="#fcd34d" />
    <path d="M66 44 Q74 40 78 32 Q72 42 66 46 Z" fill="#fcd34d" />
    <path d="M31 41 Q27 39 25 36 Q28 40 31 42 Z" fill="#f9a8d4" />
    <path d="M69 41 Q73 39 75 36 Q72 40 69 42 Z" fill="#f9a8d4" />
    <circle cx="50" cy="40" r="16" fill="#fcd34d" />
    <circle cx="43" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="57" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="44" cy="37" r="1" fill="white" />
    <circle cx="58" cy="37" r="1" fill="white" />
    <circle cx="50" cy="44" r="2.5" fill="#fda4af" />
    <path
      d="M45 49 Q50 53 55 49"
      stroke="#dc2626"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="40" cy="43" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="60" cy="43" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <path
      d="M36 60 Q28 66 30 76"
      stroke="#22c55e"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M64 60 Q72 66 70 76"
      stroke="#22c55e"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="30" cy="78" r="3.5" fill="#fcd34d" />
    <circle cx="70" cy="78" r="3.5" fill="#fcd34d" />
    <path d="M36 56 Q50 64 64 56 L62 84 Q50 90 38 84 Z" fill="#22c55e" />
    <rect x="38" y="70" width="24" height="5" rx="2.5" fill="#78350f" />
    <rect x="47" y="69" width="6" height="7" rx="1.5" fill="#facc15" />
    <rect x="43" y="84" width="5" height="8" rx="2" fill="#ef4444" />
    <rect x="52" y="84" width="5" height="8" rx="2" fill="#ef4444" />
    <rect x="40" y="91" width="8" height="5" rx="2.5" fill="#78350f" />
    <rect x="52" y="91" width="8" height="5" rx="2.5" fill="#78350f" />
  </svg>
);

const Fish: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M72 46 Q90 34 94 40 Q94 52 94 64 Q90 70 72 58 Z" fill="#2563eb" />
    <path d="M44 68 Q47 78 56 76 Q53 66 49 66 Z" fill="#2563eb" />
    <path d="M45 36 Q48 25 57 27 Q54 38 50 38 Z" fill="#2563eb" />
    <path d="M28 52 C28 36 56 28 72 46 C76 50 76 54 72 58 C56 76 28 68 28 52 Z" fill="#3b82f6" />
    <ellipse cx="44" cy="58" rx="14" ry="7" fill="#60a5fa" opacity="0.5" />
    <circle cx="38" cy="48" r="4.5" fill="#1c1917" />
    <circle cx="39" cy="46" r="1.5" fill="white" />
    <path
      d="M32 56 Q36 60 42 58"
      stroke="#1e3a5f"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="30" cy="58" rx="3.5" ry="2.5" fill="#93c5fd" opacity="0.6" />
    <circle cx="16" cy="42" r="2.5" fill="#93c5fd" opacity="0.7" />
    <circle cx="12" cy="32" r="2" fill="#93c5fd" opacity="0.5" />
    <circle cx="18" cy="24" r="1.8" fill="#93c5fd" opacity="0.5" />
  </svg>
);

const Fox: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M30 38 L22 12 L44 24 Q40 32 36 37 Z" fill="#f97316" />
    <path d="M28 32 L24 18 L36 25 Z" fill="#7c2d12" />
    <path d="M70 38 L78 12 L56 24 Q60 32 64 37 Z" fill="#f97316" />
    <path d="M72 32 L76 18 L64 25 Z" fill="#7c2d12" />
    <circle cx="50" cy="50" r="26" fill="#f97316" />
    <path d="M50 24 Q44 14 50 6 Q56 14 50 24 Z" fill="#f97316" />
    <ellipse cx="50" cy="58" rx="16" ry="12" fill="#fde68a" />
    <circle cx="40" cy="44" r="4.5" fill="#1c1917" />
    <circle cx="60" cy="44" r="4.5" fill="#1c1917" />
    <circle cx="41" cy="42.5" r="1.5" fill="white" />
    <circle cx="61" cy="42.5" r="1.5" fill="white" />
    <ellipse cx="50" cy="56" rx="4" ry="3" fill="#1c1917" />
    <path
      d="M44 62 Q50 67 56 62"
      stroke="#dc2626"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M34 56 L24 54" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />
    <path d="M34 60 L24 62" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />
    <path d="M66 56 L76 54" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />
    <path d="M66 60 L76 62" stroke="#c2410c" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Flower: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="28" rx="10" ry="16" fill="#f472b6" />
    <ellipse cx="50" cy="72" rx="10" ry="16" fill="#f472b6" />
    <ellipse cx="28" cy="50" rx="16" ry="10" fill="#f472b6" />
    <ellipse cx="72" cy="50" rx="16" ry="10" fill="#f472b6" />
    <ellipse cx="34" cy="34" rx="10" ry="15" fill="#f472b6" transform="rotate(-45 34 34)" />
    <ellipse cx="66" cy="66" rx="10" ry="15" fill="#f472b6" transform="rotate(-45 66 66)" />
    <ellipse cx="66" cy="34" rx="15" ry="10" fill="#f472b6" transform="rotate(45 66 34)" />
    <ellipse cx="34" cy="66" rx="15" ry="10" fill="#f472b6" transform="rotate(45 34 66)" />
    <circle cx="50" cy="50" r="10" fill="#facc15" />
    <circle cx="50" cy="50" r="5" fill="#f59e0b" />
    <path
      d="M50 78 Q48 88 52 94"
      stroke="#16a34a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 82 Q40 84 36 90"
      stroke="#22c55e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 84 Q58 86 62 92"
      stroke="#22c55e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Fire: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 8 Q70 34 72 56 Q72 76 50 92 Q28 76 28 56 Q30 34 50 8Z" fill="#f97316" />
    <path d="M50 8 Q62 30 62 48 Q62 68 50 76 Q38 68 38 48 Q38 30 50 8Z" fill="#facc15" />
    <path d="M50 44 Q56 56 54 64 Q50 70 46 62 Q44 52 50 44Z" fill="#ef4444" />
    <path
      d="M50 30 Q54 42 52 48"
      stroke="#fde047"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M64 28 Q66 36 64 42"
      stroke="#fdba74"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M40 34 Q38 42 40 48"
      stroke="#fdba74"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="74" cy="20" r="3" fill="#facc15" />
    <circle cx="28" cy="24" r="2.5" fill="#f97316" />
    <circle cx="78" cy="40" r="2" fill="#ef4444" />
    <circle cx="24" cy="44" r="2" fill="#ef4444" />
    <rect x="40" y="88" width="20" height="8" rx="3" fill="#b45309" />
  </svg>
);

const Flamingo: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="58" cy="70" rx="20" ry="16" fill="#f472b6" />
    <path
      d="M52 58 Q50 34 52 18"
      stroke="#f472b6"
      strokeWidth="9"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="52" cy="16" r="10" fill="#f472b6" />
    <path d="M52 22 Q58 26 60 32 L54 30Z" fill="#f9a8d4" />
    <path d="M58 26 L72 24 L66 32Z" fill="#1c1917" />
    <circle cx="48" cy="14" r="2.5" fill="#1c1917" />
    <circle cx="49" cy="13" r="1" fill="white" />
    <path d="M60 62 Q70 58 78 62 Q70 66 62 64Z" fill="#ec4899" />
    <path
      d="M40 76 Q30 88 24 90"
      stroke="#fb7185"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M46 78 Q38 90 34 92"
      stroke="#fb7185"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M52 78 Q46 88 44 92"
      stroke="#fb7185"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="58" cy="78" r="3" fill="#ec4899" opacity="0.6" />
    <circle cx="50" cy="74" r="2" fill="#ec4899" opacity="0.4" />
  </svg>
);

const Girl: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="21" cy="30" r="9" fill="#92400e" />
    <circle cx="79" cy="30" r="9" fill="#92400e" />
    <circle cx="50" cy="42" r="21" fill="#92400e" />
    <circle cx="50" cy="45" r="14.5" fill="#fcd34d" />
    <path
      d="M35.5 40 Q35.5 26 50 26 Q64.5 26 64.5 40 Q57 33 50 35 Q43 33 35.5 40 Z"
      fill="#92400e"
    />
    <circle cx="44" cy="45" r="2.8" fill="#1c1917" />
    <circle cx="56" cy="45" r="2.8" fill="#1c1917" />
    <circle cx="45" cy="44" r="1" fill="white" />
    <circle cx="57" cy="44" r="1" fill="white" />
    <ellipse cx="40" cy="51" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="60" cy="51" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <path
      d="M46 52 Q50 56 54 52"
      stroke="#dc2626"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="46" y="58" width="8" height="6" fill="#fcd34d" />
    <path
      d="M37 65 Q28 74 30 83"
      stroke="#fcd34d"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M63 65 Q72 74 70 83"
      stroke="#fcd34d"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M36 64 L30 86 Q50 92 70 86 L64 64 Q57 68 50 66 Q43 68 36 64 Z" fill="#ef4444" />
    <circle cx="50" cy="70" r="1.8" fill="#facc15" />
    <circle cx="50" cy="76" r="1.8" fill="#facc15" />
    <rect x="43" y="84" width="5" height="9" rx="2.5" fill="#fcd34d" />
    <rect x="52" y="84" width="5" height="9" rx="2.5" fill="#fcd34d" />
    <ellipse cx="44" cy="94" rx="5.5" ry="3" fill="#dc2626" />
    <ellipse cx="56" cy="94" rx="5.5" ry="3" fill="#dc2626" />
  </svg>
);

const Grapes: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M50 18 Q52 10 50 4"
      stroke="#166534"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 12 Q58 6 64 10"
      stroke="#16a34a"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="64" cy="8" rx="8" ry="4" fill="#22c55e" />
    <circle cx="40" cy="34" r="9" fill="#a855f7" />
    <circle cx="56" cy="32" r="9" fill="#a855f7" />
    <circle cx="48" cy="46" r="9" fill="#a855f7" />
    <circle cx="64" cy="46" r="9" fill="#a855f7" />
    <circle cx="38" cy="56" r="9" fill="#a855f7" />
    <circle cx="54" cy="58" r="9" fill="#a855f7" />
    <circle cx="46" cy="70" r="9" fill="#a855f7" />
    <circle cx="61" cy="70" r="8" fill="#a855f7" />
    <circle cx="42" cy="32" r="3" fill="#c084fc" opacity="0.7" />
    <circle cx="58" cy="30" r="3" fill="#c084fc" opacity="0.7" />
    <circle cx="50" cy="44" r="3" fill="#c084fc" opacity="0.7" />
  </svg>
);

const Guitar: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="66" r="24" fill="#d97706" />
    <circle cx="50" cy="66" r="17" fill="#f59e0b" />
    <circle cx="50" cy="66" r="9" fill="#1c1917" />
    <circle cx="50" cy="66" r="3.5" fill="#d97706" />
    <rect x="47" y="8" width="6" height="42" rx="3" fill="#92400e" />
    <rect x="41" y="6" width="18" height="10" rx="3" fill="#b45309" />
    <rect x="45" y="9" width="10" height="4" rx="1.5" fill="#fbbf24" />
    <line x1="48" y1="16" x2="48" y2="56" stroke="#fef3c7" strokeWidth="1" />
    <line x1="50" y1="16" x2="50" y2="56" stroke="#fef3c7" strokeWidth="1" />
    <line x1="52" y1="16" x2="52" y2="56" stroke="#fef3c7" strokeWidth="1" />
    <path d="M48 46 L50 44 L52 46" stroke="#fbbf24" strokeWidth="1.5" fill="none" />
    <line x1="38" y1="14" x2="30" y2="8" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="62" y1="14" x2="70" y2="8" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

const Giraffe: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M70 74 Q80 78 82 86"
      stroke="#d97706"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="83" cy="88" r="3" fill="#b45309" />
    <ellipse cx="52" cy="70" rx="24" ry="17" fill="#f59e0b" />
    <ellipse cx="50" cy="76" rx="14" ry="5" fill="#fbbf24" opacity="0.5" />
    <path d="M46 82 L44 94" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M62 82 L60 94" stroke="#f59e0b" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M40 84 L38 95" stroke="#d97706" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M66 84 L68 95" stroke="#d97706" strokeWidth="7" fill="none" strokeLinecap="round" />
    <rect x="41" y="94" width="7" height="4" rx="2" fill="#b45309" opacity="0.8" />
    <rect x="57" y="94" width="7" height="4" rx="2" fill="#b45309" opacity="0.8" />
    <rect x="34" y="95" width="8" height="4" rx="2" fill="#b45309" />
    <rect x="64" y="95" width="8" height="4" rx="2" fill="#b45309" />
    <path
      d="M58 56 C60 40 54 28 46 24"
      stroke="#f59e0b"
      strokeWidth="12"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="44" cy="64" r="3" fill="#b45309" />
    <circle cx="58" cy="62" r="3.5" fill="#b45309" />
    <circle cx="48" cy="76" r="2.5" fill="#b45309" />
    <circle cx="64" cy="72" r="3" fill="#b45309" />
    <circle cx="40" cy="72" r="2.5" fill="#b45309" />
    <path d="M42 14 Q38 6 44 5 Q48 8 46 13 Z" fill="#d97706" />
    <ellipse cx="42" cy="20" rx="13" ry="10" fill="#f59e0b" />
    <ellipse cx="30" cy="22" rx="6" ry="5" fill="#f59e0b" />
    <path d="M40 12 L38 3" stroke="#b45309" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="38" cy="2" r="2.5" fill="#b45309" />
    <path d="M46 10 L47 2" stroke="#b45309" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <circle cx="47" cy="1" r="2.5" fill="#b45309" />
    <path d="M48 13 Q54 6 58 10 Q56 15 50 15 Z" fill="#f59e0b" />
    <path
      d="M50 22 Q56 30 58 44"
      stroke="#b45309"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.7"
    />
    <circle cx="52" cy="34" r="2.5" fill="#b45309" />
    <circle cx="56" cy="44" r="2.5" fill="#b45309" />
    <circle cx="58" cy="52" r="2.5" fill="#b45309" />
    <circle cx="37" cy="19" r="3" fill="#1c1917" />
    <circle cx="38" cy="18" r="1" fill="white" />
    <circle cx="26" cy="23" r="1.2" fill="#92400e" />
    <path
      d="M28 27 Q31 30 35 28"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="33" cy="25" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.5" />
  </svg>
);

const Ghost: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M34 14 Q50 6 66 14 Q74 20 74 40 L74 74 L66 64 L58 74 L50 64 L42 74 L34 64 L26 74 L26 40 Q26 20 34 14Z"
      fill="white"
    />
    <ellipse cx="42" cy="38" rx="5" ry="6" fill="#1c1917" />
    <ellipse cx="58" cy="38" rx="5" ry="6" fill="#1c1917" />
    <circle cx="43" cy="36" r="1.5" fill="white" />
    <circle cx="59" cy="36" r="1.5" fill="white" />
    <path
      d="M42 50 Q50 58 58 50"
      stroke="#1c1917"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M38 44 Q42 40 46 44"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M54 44 Q58 40 62 44"
      stroke="#1c1917"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="32" cy="28" rx="4" ry="5" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="68" cy="28" rx="4" ry="5" fill="#fca5a5" opacity="0.6" />
    <circle cx="30" cy="60" r="2.5" fill="#d1d5db" />
    <circle cx="70" cy="62" r="2" fill="#d1d5db" />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Dog,
  Duck,
  Dolphin,
  Dragon,
  Ear,
  Eye,
  Egg,
  Elephant,
  Elf,
  Fish,
  Fox,
  Flower,
  Fire,
  Flamingo,
  Girl,
  Grapes,
  Guitar,
  Giraffe,
  Ghost,
};
