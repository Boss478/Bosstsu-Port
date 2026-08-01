'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Quartz: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M26 42 L34 60 L32 90 L12 90 L18 64 Z" fill="#7c3aed" />
    <path d="M26 42 L34 60 L32 90 L26 90 Z" fill="#a855f7" opacity="0.5" />
    <path d="M74 44 L88 62 L88 90 L68 90 L66 66 Z" fill="#7c3aed" />
    <path d="M74 44 L66 66 L68 90 L74 90 Z" fill="#a855f7" opacity="0.5" />
    <path d="M50 6 L62 28 L66 78 L34 78 L38 28 Z" fill="#a855f7" />
    <path d="M50 6 L62 28 L66 78 L50 78 Z" fill="#c084fc" opacity="0.6" />
    <path d="M50 6 L50 78" stroke="#9333ea" strokeWidth="1.5" />
    <path d="M38 28 L50 42" stroke="#9333ea" strokeWidth="1.5" opacity="0.6" />
    <path d="M44 24 L40 16" stroke="white" strokeWidth="3" strokeLinecap="round" />
    <path d="M48 34 L44 28" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M56 22 L60 14" stroke="white" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 24 L21 27 L24 28 L21 29 L20 32 L19 29 L16 28 L19 27 Z" fill="white" />
    <path d="M82 22 L83 25 L86 26 L83 27 L82 30 L81 27 L78 26 L81 25 Z" fill="white" />
    <ellipse cx="50" cy="93" rx="40" ry="5" fill="#a855f7" opacity="0.25" />
  </svg>
);

const Queen: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M30 54 Q20 72 16 92 L84 92 Q80 72 70 54 Z" fill="#7e22ce" />
    <path d="M32 56 Q50 66 68 56 L64 84 Q50 90 36 84 Z" fill="#8b5cf6" />
    <path
      d="M36 58 Q50 64 64 58"
      stroke="#fbbf24"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="46" cy="68" r="1.8" fill="#fbbf24" />
    <circle cx="54" cy="68" r="1.8" fill="#fbbf24" />
    <path
      d="M42 56 Q50 60 58 56"
      stroke="#fbbf24"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="50" cy="60" r="2.5" fill="#ef4444" />
    <circle cx="50" cy="40" r="17" fill="#fcd9b8" />
    <circle cx="31" cy="40" r="3.5" fill="#fcd9b8" />
    <circle cx="69" cy="40" r="3.5" fill="#fcd9b8" />
    <path d="M33 44 Q32 22 50 22 Q68 22 67 44 Q60 34 50 36 Q40 34 33 44 Z" fill="#92400e" />
    <circle cx="43" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="57" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="44" cy="37" r="1" fill="white" />
    <circle cx="58" cy="37" r="1" fill="white" />
    <path
      d="M44 35 L46 33 M42 35 L42 33"
      stroke="#1c1917"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M56 35 L54 33 M58 35 L58 33"
      stroke="#1c1917"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="43" rx="2" ry="2.5" fill="#fda4af" />
    <path
      d="M45 49 Q50 53 55 49"
      stroke="#dc2626"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="44" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="62" cy="44" rx="3" ry="2" fill="#fca5a5" opacity="0.6" />
    <rect x="36" y="22" width="28" height="6" rx="2" fill="#fbbf24" />
    <path d="M36 22 L38 12 L43 18 L50 8 L57 18 L62 12 L64 22 Z" fill="#fbbf24" />
    <circle cx="41" cy="25" r="2" fill="#ef4444" />
    <circle cx="50" cy="25" r="2.5" fill="#3b82f6" />
    <circle cx="59" cy="25" r="2" fill="#22c55e" />
    <circle cx="43" cy="15" r="1.8" fill="#ef4444" />
    <circle cx="50" cy="10" r="2" fill="#3b82f6" />
    <circle cx="57" cy="15" r="1.8" fill="#22c55e" />
  </svg>
);

const Rabbit: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="72" rx="18" ry="16" fill="#e5e7eb" />
    <circle cx="50" cy="48" r="14" fill="#e5e7eb" />
    <ellipse cx="36" cy="26" rx="5.5" ry="16" fill="#e5e7eb" />
    <ellipse cx="64" cy="26" rx="5.5" ry="16" fill="#e5e7eb" />
    <ellipse cx="36" cy="26" rx="2.5" ry="11" fill="#f472b6" />
    <ellipse cx="64" cy="26" rx="2.5" ry="11" fill="#f472b6" />
    <circle cx="44" cy="46" r="2.5" fill="#1c1917" />
    <circle cx="56" cy="46" r="2.5" fill="#1c1917" />
    <circle cx="45" cy="45" r="0.8" fill="white" />
    <circle cx="57" cy="45" r="0.8" fill="white" />
    <circle cx="50" cy="53" r="2.5" fill="#f472b6" />
    <ellipse cx="41" cy="52" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
    <ellipse cx="59" cy="52" rx="3" ry="2" fill="#f9a8d4" opacity="0.5" />
    <path d="M46 56 L54 56" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M50 56 L50 60" stroke="#9ca3af" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const Rocket: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="40,34 50,12 60,34" fill="#ef4444" />
    <rect x="38" y="34" width="24" height="34" rx="4" fill="#e2e8f0" />
    <circle cx="50" cy="48" r="7" fill="#3b82f6" />
    <circle cx="50" cy="48" r="4" fill="#93c5fd" />
    <polygon points="38,56 24,74 38,68" fill="#ef4444" />
    <polygon points="62,56 76,74 62,68" fill="#ef4444" />
    <path d="M44 68 L50 88 L56 68 Z" fill="#f97316" />
    <path d="M47 68 L50 82 L53 68 Z" fill="#facc15" />
    <path d="M38 38 L62 38" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="59" r="2" fill="#94a3b8" />
  </svg>
);

const Robot: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <line x1="50" y1="12" x2="50" y2="20" stroke="#9ca3af" strokeWidth="3" strokeLinecap="round" />
    <circle cx="50" cy="10" r="4" fill="#ef4444" />
    <rect x="32" y="20" width="36" height="30" rx="5" fill="#9ca3af" />
    <rect x="27" y="27" width="6" height="12" rx="2" fill="#6b7280" />
    <rect x="67" y="27" width="6" height="12" rx="2" fill="#6b7280" />
    <circle cx="42" cy="35" r="5" fill="#1c1917" />
    <circle cx="58" cy="35" r="5" fill="#1c1917" />
    <circle cx="43" cy="33" r="1.8" fill="#93c5fd" />
    <circle cx="59" cy="33" r="1.8" fill="#93c5fd" />
    <rect x="43" y="43" width="14" height="3" rx="1.5" fill="#1c1917" />
    <rect x="36" y="56" width="28" height="26" rx="5" fill="#6b7280" />
    <circle cx="44" cy="64" r="3" fill="#3b82f6" />
    <circle cx="56" cy="64" r="3" fill="#22c55e" />
    <circle cx="50" cy="74" r="3" fill="#facc15" />
    <path
      d="M36 62 Q26 58 20 66"
      stroke="#6b7280"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M64 62 Q74 58 80 66"
      stroke="#6b7280"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="40" y="82" width="8" height="12" rx="2" fill="#4b5563" />
    <rect x="52" y="82" width="8" height="12" rx="2" fill="#4b5563" />
  </svg>
);

const Snake: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="26" r="12" fill="#22c55e" />
    <circle cx="45" cy="24" r="2.8" fill="#1c1917" />
    <circle cx="55" cy="24" r="2.8" fill="#1c1917" />
    <circle cx="46" cy="23" r="1" fill="white" />
    <circle cx="56" cy="23" r="1" fill="white" />
    <path
      d="M47 31 Q50 34 53 31"
      stroke="#15803d"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M57 27 L64 27" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M64 27 L67 24 M64 27 L67 30" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M50 34 C60 34 76 44 76 58 C76 72 62 82 48 80 C36 78 30 66 34 56 C38 46 50 44 58 48 C64 51 62 60 55 60 C50 60 49 55 53 53"
      stroke="#22c55e"
      strokeWidth="11"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="70" cy="60" r="3" fill="#16a34a" />
    <circle cx="40" cy="70" r="3" fill="#16a34a" />
    <circle cx="56" cy="52" r="3" fill="#16a34a" />
  </svg>
);

const Strawberry: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="47" y="4" width="6" height="12" rx="3" fill="#92400e" />
    <polygon points="32,36 38,20 44,32 50,16 56,32 62,20 68,36" fill="#22c55e" />
    <path d="M50 80 C28 68 22 48 32 36 C40 26 60 26 68 36 C78 48 72 68 50 80 Z" fill="#ef4444" />
    <ellipse cx="38" cy="62" rx="4" ry="7" fill="#dc2626" opacity="0.4" />
    <ellipse cx="42" cy="34" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="52" cy="44" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="62" cy="44" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="38" cy="50" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="50" cy="56" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="58" cy="60" rx="2" ry="3" fill="#fde68a" />
    <ellipse cx="46" cy="66" rx="2" ry="3" fill="#fde68a" />
  </svg>
);

const Star: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="50,6 61,36 93,38 68,58 76,90 50,72 24,90 32,58 7,38 39,36" fill="#fbbf24" />
    <polygon
      points="50,16 58,38 80,40 63,54 68,76 50,64 32,76 37,54 20,40 42,38"
      fill="#fde047"
      opacity="0.6"
    />
    <circle cx="44" cy="46" r="3" fill="#92400e" />
    <circle cx="56" cy="46" r="3" fill="#92400e" />
    <circle cx="45" cy="44" r="1" fill="white" />
    <circle cx="57" cy="44" r="1" fill="white" />
    <path
      d="M44 54 Q50 60 56 54"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M24 18 L32 26 M32 18 L24 26"
      stroke="#fbbf24"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M68 70 L76 78 M76 70 L68 78"
      stroke="#fde047"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
  </svg>
);

const Sun: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="50" r="30" fill="#fde047" opacity="0.35" />
    <path
      d="M50 26 Q54 16 50 6"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M67 33 Q74 24 80 16"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M74 50 Q84 46 94 50"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M67 67 Q74 76 80 84"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 74 Q54 84 50 94"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M33 67 Q26 76 20 84"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M26 50 Q16 46 6 50"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M33 33 Q26 24 20 16"
      stroke="#f97316"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="50" cy="50" r="24" fill="#facc15" />
    <circle cx="50" cy="50" r="19" fill="#fde047" />
    <path d="M36 62 A16 16 0 0 0 64 62 Z" fill="#f59e0b" opacity="0.15" />
    <circle cx="42" cy="46" r="3" fill="#92400e" />
    <circle cx="58" cy="46" r="3" fill="#92400e" />
    <circle cx="43" cy="45" r="1" fill="white" />
    <circle cx="59" cy="45" r="1" fill="white" />
    <path
      d="M42 42 L44 40 M40 42 L40 40"
      stroke="#92400e"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M58 42 L56 40 M60 42 L60 40"
      stroke="#92400e"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M43 58 Q50 65 57 58"
      stroke="#92400e"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="36" cy="54" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.7" />
    <ellipse cx="64" cy="54" rx="3.5" ry="2" fill="#f9a8d4" opacity="0.7" />
    <path
      d="M22 30 L23 33 L26 34 L23 35 L22 38 L21 35 L18 34 L21 33 Z"
      fill="white"
      opacity="0.8"
    />
    <path
      d="M78 28 L79 31 L82 32 L79 33 L78 36 L77 33 L74 32 L77 31 Z"
      fill="white"
      opacity="0.8"
    />
  </svg>
);

const Tree: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="44" y="58" width="12" height="32" rx="3" fill="#92400e" />
    <circle cx="34" cy="42" r="17" fill="#22c55e" />
    <circle cx="66" cy="42" r="17" fill="#22c55e" />
    <circle cx="50" cy="28" r="19" fill="#22c55e" />
    <circle cx="50" cy="40" r="11" fill="#16a34a" />
    <circle cx="40" cy="32" r="2.5" fill="#ef4444" />
    <circle cx="62" cy="34" r="2.5" fill="#ef4444" />
    <circle cx="34" cy="52" r="2.5" fill="#ef4444" />
    <circle cx="66" cy="52" r="2.5" fill="#ef4444" />
    <circle cx="60" cy="50" r="2.5" fill="#ef4444" />
    <path
      d="M32 58 Q24 66 20 74"
      stroke="#92400e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M68 58 Q76 66 80 74"
      stroke="#92400e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Turtle: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="52" cy="56" rx="30" ry="22" fill="#16a34a" />
    <ellipse cx="52" cy="56" rx="21" ry="14" fill="#22c55e" />
    <circle cx="44" cy="52" r="3" fill="#15803d" />
    <circle cx="60" cy="52" r="3" fill="#15803d" />
    <circle cx="52" cy="60" r="3" fill="#15803d" />
    <circle cx="52" cy="46" r="3" fill="#15803d" />
    <circle cx="20" cy="46" r="9" fill="#22c55e" />
    <circle cx="17" cy="43" r="2" fill="#1c1917" />
    <circle cx="18" cy="42" r="0.8" fill="white" />
    <path
      d="M20 52 Q24 56 28 52"
      stroke="#15803d"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="36" cy="78" rx="6" ry="4" fill="#22c55e" />
    <ellipse cx="52" cy="80" rx="6" ry="4" fill="#22c55e" />
    <ellipse cx="68" cy="78" rx="6" ry="4" fill="#22c55e" />
    <polygon points="80,58 90,62 80,66" fill="#22c55e" />
  </svg>
);

const Tiger: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="50" r="27" fill="#f97316" />
    <circle cx="34" cy="26" r="9" fill="#f97316" />
    <circle cx="66" cy="26" r="9" fill="#f97316" />
    <circle cx="34" cy="26" r="4.5" fill="#fde68a" />
    <circle cx="66" cy="26" r="4.5" fill="#fde68a" />
    <path
      d="M44 27 L50 33 L56 27"
      stroke="#92400e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M46 23 L46 32" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
    <path d="M54 23 L54 32" stroke="#92400e" strokeWidth="3.5" strokeLinecap="round" />
    <path
      d="M26 36 Q20 44 18 52"
      stroke="#92400e"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M74 36 Q80 44 82 52"
      stroke="#92400e"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M27 38 L37 42 M27 44 L37 46"
      stroke="#92400e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <path
      d="M73 38 L63 42 M73 44 L63 46"
      stroke="#92400e"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    <ellipse cx="42" cy="48" rx="5.5" ry="6" fill="white" />
    <ellipse cx="58" cy="48" rx="5.5" ry="6" fill="white" />
    <circle cx="42" cy="48" r="2.5" fill="#1c1917" />
    <circle cx="58" cy="48" r="2.5" fill="#1c1917" />
    <circle cx="43" cy="46" r="1" fill="white" />
    <circle cx="59" cy="46" r="1" fill="white" />
    <ellipse cx="50" cy="57" rx="9" ry="6.5" fill="#fde68a" />
    <path d="M46 55 Q50 51 54 55 Q54 58 50 58 Q46 58 46 55 Z" fill="#f472b6" />
    <path d="M50 58 L50 61" stroke="#92400e" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M50 61 Q46 65 43 62"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 61 Q54 65 57 62"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="40" cy="55" r="1.2" fill="#92400e" />
    <circle cx="40" cy="59" r="1.2" fill="#92400e" />
    <circle cx="60" cy="55" r="1.2" fill="#92400e" />
    <circle cx="60" cy="59" r="1.2" fill="#92400e" />
    <path
      d="M31 55 L39 54 M31 61 L39 60"
      stroke="#92400e"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
    <path
      d="M69 55 L61 54 M69 61 L61 60"
      stroke="#92400e"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.7"
    />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Quartz,
  Queen,
  Rabbit,
  Rocket,
  Robot,
  Snake,
  Strawberry,
  Star,
  Sun,
  Tree,
  Turtle,
  Tiger,
};
