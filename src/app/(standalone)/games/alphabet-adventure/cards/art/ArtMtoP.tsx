'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Milk: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="28" y="34" width="44" height="58" rx="3" fill="#f8fafc" />
    <polygon points="28,34 42,18 58,18 72,34" fill="#f8fafc" />
    <polygon points="28,34 42,18 50,24 72,34" fill="#e2e8f0" />
    <path d="M42 18 L50 24 L58 18" stroke="#94a3b8" strokeWidth="1.5" fill="none" />
    <path d="M50 24 L50 8 L58 12 L58 18" fill="#cbd5e1" />
    <rect x="36" y="44" width="28" height="26" rx="3" fill="#bfdbfe" />
    <circle cx="46" cy="57" r="5" fill="#60a5fa" />
    <path d="M60 30 L82 8" stroke="#ef4444" strokeWidth="5" strokeLinecap="round" />
    <path d="M56 28 L62 22" stroke="#ef4444" strokeWidth="4" strokeLinecap="round" />
    <rect x="30" y="84" width="40" height="6" rx="3" fill="#e2e8f0" />
  </svg>
);

const Mouse: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="64" rx="24" ry="18" fill="#9ca3af" />
    <ellipse cx="50" cy="56" rx="16" ry="14" fill="#9ca3af" />
    <circle cx="31" cy="36" r="14" fill="#9ca3af" />
    <circle cx="69" cy="36" r="14" fill="#9ca3af" />
    <circle cx="31" cy="36" r="8" fill="#f9a8d4" />
    <circle cx="69" cy="36" r="8" fill="#f9a8d4" />
    <circle cx="44" cy="52" r="3" fill="#1c1917" />
    <circle cx="56" cy="52" r="3" fill="#1c1917" />
    <circle cx="45" cy="50" r="1" fill="white" />
    <circle cx="57" cy="50" r="1" fill="white" />
    <circle cx="50" cy="60" r="4" fill="#f472b6" />
    <path d="M26 60 L14 62" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M26 64 L14 68" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M74 60 L86 62" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M74 64 L86 68" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    <path
      d="M28 76 Q16 84 20 92 Q24 96 28 90"
      stroke="#9ca3af"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="42" cy="82" rx="5" ry="3" fill="#d1d5db" />
    <ellipse cx="58" cy="82" rx="5" ry="3" fill="#d1d5db" />
  </svg>
);

const Monkey: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M66 80 Q78 78 78 68 Q78 58 70 56"
      stroke="#92400e"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="74" rx="20" ry="16" fill="#92400e" />
    <ellipse cx="50" cy="76" rx="13" ry="10" fill="#d97706" />
    <path d="M42 88 L40 95" stroke="#92400e" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M58 88 L60 95" stroke="#92400e" strokeWidth="6" fill="none" strokeLinecap="round" />
    <ellipse cx="41" cy="95" rx="5" ry="3.5" fill="#a16207" />
    <ellipse cx="59" cy="95" rx="5" ry="3.5" fill="#a16207" />
    <path
      d="M34 66 Q26 74 30 84"
      stroke="#92400e"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M66 66 Q74 74 70 84"
      stroke="#92400e"
      strokeWidth="6"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="30" cy="85" r="3.5" fill="#a16207" />
    <circle cx="70" cy="85" r="3.5" fill="#a16207" />
    <circle cx="22" cy="34" r="9" fill="#92400e" />
    <circle cx="78" cy="34" r="9" fill="#92400e" />
    <circle cx="22" cy="34" r="4.5" fill="#a16207" />
    <circle cx="78" cy="34" r="4.5" fill="#a16207" />
    <circle cx="50" cy="36" r="24" fill="#92400e" />
    <ellipse cx="50" cy="42" rx="16" ry="14" fill="#fde68a" />
    <path d="M46 13 Q44 6 50 3 Q56 6 54 13 Z" fill="#92400e" />
    <circle cx="41" cy="38" r="4" fill="#1c1917" />
    <circle cx="59" cy="38" r="4" fill="#1c1917" />
    <circle cx="42" cy="36" r="1.5" fill="white" />
    <circle cx="60" cy="36" r="1.5" fill="white" />
    <circle cx="46" cy="48" r="1.8" fill="#78350f" />
    <circle cx="54" cy="48" r="1.8" fill="#78350f" />
    <path
      d="M44 54 Q50 59 56 54"
      stroke="#78350f"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="35" cy="46" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="65" cy="46" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
  </svg>
);

const Nose: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M50 14 C30 14 20 38 24 56 C26 72 36 84 50 84 C64 84 74 72 76 56 C80 38 70 14 50 14 Z"
      fill="#f59e0b"
    />
    <ellipse cx="35" cy="34" rx="8" ry="5.5" fill="#fbbf24" opacity="0.8" />
    <path d="M26 62 C30 80 70 80 74 62 C70 74 30 74 26 62 Z" fill="#b45309" opacity="0.3" />
    <ellipse cx="41" cy="68" rx="5.5" ry="4.5" fill="#92400e" />
    <ellipse cx="59" cy="68" rx="5.5" ry="4.5" fill="#92400e" />
  </svg>
);

const Nest: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M16 56 Q16 88 50 88 Q84 88 84 56 Z" fill="#b45309" />
    <path d="M24 60 Q30 82 50 82 Q70 82 76 60" stroke="#78350f" strokeWidth="2.5" fill="none" />
    <path
      d="M18 62 Q24 78 40 84"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M82 62 Q76 78 60 84"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M16 54 L34 60" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M84 54 L66 60" stroke="#a16207" strokeWidth="2.5" strokeLinecap="round" />
    <path
      d="M44 34 Q40 30 46 26 Q52 24 56 30"
      stroke="#a16207"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="54" rx="7" ry="9" fill="white" />
    <ellipse cx="56" cy="52" rx="7" ry="9" fill="#93c5fd" />
    <ellipse cx="47" cy="58" rx="6" ry="8" fill="#fde68a" />
    <circle cx="56" cy="48" r="1.5" fill="white" />
  </svg>
);

const Necklace: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M18 38 Q50 78 82 38"
      stroke="#fbbf24"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M14 34 Q18 30 24 32"
      stroke="#fbbf24"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M86 34 Q82 30 76 32"
      stroke="#fbbf24"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="28" cy="48" r="5" fill="#ef4444" />
    <circle cx="34" cy="53" r="5" fill="#3b82f6" />
    <circle cx="44" cy="57" r="5" fill="#22c55e" />
    <circle cx="56" cy="57" r="5" fill="#a855f7" />
    <circle cx="66" cy="53" r="5" fill="#f97316" />
    <circle cx="72" cy="48" r="5" fill="#facc15" />
    <circle cx="50" cy="65" r="8" fill="#ef4444" />
    <circle cx="47" cy="62" r="2.5" fill="#fca5a5" />
  </svg>
);

const Ninja: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M24 38 Q12 34 8 28"
      stroke="#1c1917"
      strokeWidth="4.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M24 40 Q12 44 10 50"
      stroke="#1c1917"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="50" cy="42" r="24" fill="#fcd34d" />
    <rect x="26" y="30" width="48" height="12" rx="6" fill="#1c1917" />
    <circle cx="26" cy="36" r="5" fill="#1c1917" />
    <ellipse cx="41" cy="47" rx="4.5" ry="3.5" fill="white" />
    <ellipse cx="59" cy="47" rx="4.5" ry="3.5" fill="white" />
    <circle cx="42" cy="47" r="1.5" fill="#1c1917" />
    <circle cx="60" cy="47" r="1.5" fill="#1c1917" />
    <circle cx="42.5" cy="46" r="0.6" fill="white" />
    <circle cx="60.5" cy="46" r="0.6" fill="white" />
    <path d="M28 50 Q50 56 72 50 L72 66 Q50 74 28 66 Z" fill="#1c1917" />
    <path d="M30 62 Q50 70 70 62 L72 80 Q50 88 28 80 Z" fill="#1f2937" />
    <rect x="30" y="74" width="40" height="6" rx="3" fill="#ef4444" />
    <circle cx="32" cy="77" r="3.5" fill="#dc2626" />
    <path d="M80 20 L84 26 L90 28 L84 30 L80 36 L76 30 L70 28 L76 26 Z" fill="#9ca3af" />
    <circle cx="80" cy="28" r="2.5" fill="#1c1917" />
  </svg>
);

const Orange: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="56" r="30" fill="#fb923c" />
    <circle cx="50" cy="56" r="24" fill="#f97316" />
    <ellipse cx="38" cy="46" rx="8" ry="5" fill="white" opacity="0.25" />
    <circle cx="36" cy="60" r="1.5" fill="#c2410c" opacity="0.5" />
    <circle cx="50" cy="72" r="1.5" fill="#c2410c" opacity="0.5" />
    <circle cx="64" cy="58" r="1.5" fill="#c2410c" opacity="0.5" />
    <circle cx="44" cy="66" r="1.5" fill="#c2410c" opacity="0.5" />
    <circle cx="60" cy="46" r="1.5" fill="#c2410c" opacity="0.5" />
    <polygon points="50,20 45,27 50,34 55,27" fill="#22c55e" />
    <rect x="48" y="20" width="4" height="8" rx="2" fill="#16a34a" />
    <path d="M50 26 Q62 16 72 20 Q64 28 52 30 Z" fill="#22c55e" />
    <path
      d="M54 28 Q62 22 68 21"
      stroke="#15803d"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Octopus: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="44" r="26" fill="#f472b6" />
    <circle cx="40" cy="40" r="4.5" fill="#1c1917" />
    <circle cx="60" cy="40" r="4.5" fill="#1c1917" />
    <circle cx="41" cy="38" r="1.5" fill="white" />
    <circle cx="61" cy="38" r="1.5" fill="white" />
    <path
      d="M44 52 Q50 57 56 52"
      stroke="#db2777"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="34" cy="48" rx="3.5" ry="2.5" fill="#fda4af" opacity="0.7" />
    <ellipse cx="66" cy="48" rx="3.5" ry="2.5" fill="#fda4af" opacity="0.7" />
    <path
      d="M34 62 Q24 74 28 88"
      stroke="#f472b6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M42 66 Q38 78 40 90"
      stroke="#f472b6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 68 Q50 80 50 90"
      stroke="#f472b6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M58 66 Q62 78 60 90"
      stroke="#f472b6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M66 62 Q76 74 72 88"
      stroke="#f472b6"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Owl: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="32,32 27,12 43,24" fill="#92400e" />
    <polygon points="68,32 73,12 57,24" fill="#92400e" />
    <ellipse cx="50" cy="58" rx="29" ry="30" fill="#92400e" />
    <ellipse cx="50" cy="68" rx="18" ry="18" fill="#fde68a" />
    <ellipse cx="23" cy="56" rx="9" ry="17" fill="#78350f" />
    <ellipse cx="77" cy="56" rx="9" ry="17" fill="#78350f" />
    <circle cx="39" cy="46" r="12" fill="white" />
    <circle cx="61" cy="46" r="12" fill="white" />
    <circle cx="39" cy="46" r="6" fill="#f59e0b" />
    <circle cx="61" cy="46" r="6" fill="#f59e0b" />
    <circle cx="39" cy="46" r="3" fill="#1c1917" />
    <circle cx="61" cy="46" r="3" fill="#1c1917" />
    <circle cx="40" cy="44" r="1.2" fill="white" />
    <circle cx="62" cy="44" r="1.2" fill="white" />
    <polygon points="50,52 44,60 56,60" fill="#f97316" />
    <path
      d="M44 68 Q50 72 56 68"
      stroke="#d97706"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M44 74 Q50 78 56 74"
      stroke="#d97706"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M38 86 L38 92" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
    <path d="M62 86 L62 92" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const Onion: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 20 Q74 32 75 56 Q76 80 50 90 Q24 80 25 56 Q26 32 50 20 Z" fill="#d8b4fe" />
    <path d="M50 26 Q70 36 70 56 Q70 77 50 86 Q30 77 30 56 Q30 36 50 26 Z" fill="#e9d5ff" />
    <path
      d="M50 28 Q68 38 68 56 Q68 75 50 84"
      stroke="#c084fc"
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
    <path
      d="M50 28 Q32 38 32 56 Q32 75 50 84"
      stroke="#c084fc"
      strokeWidth="2"
      fill="none"
      opacity="0.5"
    />
    <path d="M50 30 L50 84" stroke="#c084fc" strokeWidth="2" fill="none" opacity="0.7" />
    <ellipse
      cx="40"
      cy="46"
      rx="6"
      ry="10"
      fill="white"
      opacity="0.5"
      transform="rotate(-18 40 46)"
    />
    <path
      d="M50 22 Q44 10 36 4"
      stroke="#22c55e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 22 Q56 8 66 6"
      stroke="#22c55e"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 22 Q50 10 50 2"
      stroke="#22c55e"
      strokeWidth="3.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M44 89 L42 95" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
    <path d="M50 90 L50 96" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
    <path d="M56 89 L58 95" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Ostrich: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="18" cy="68" r="10" fill="#f5f5f4" />
    <circle cx="16" cy="78" r="9" fill="#f5f5f4" />
    <circle cx="24" cy="80" r="8" fill="#f5f5f4" />
    <ellipse cx="44" cy="72" rx="26" ry="18" fill="#a8a29e" />
    <ellipse cx="46" cy="76" rx="14" ry="8" fill="#d6d3d1" opacity="0.6" />
    <path d="M50 60 Q62 62 60 76 Q58 82 48 80 Q44 70 50 60 Z" fill="#78716c" />
    <path d="M52 66 L58 66" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
    <path d="M52 72 L57 72" stroke="#a8a29e" strokeWidth="2" strokeLinecap="round" />
    <path
      d="M52 58 C58 44 56 30 50 22"
      stroke="#d6d3d1"
      strokeWidth="10"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="48" cy="18" r="11" fill="#d6d3d1" />
    <polygon points="58,14 70,17 58,21" fill="#f97316" />
    <circle cx="53" cy="14" r="2.5" fill="#1c1917" />
    <circle cx="54" cy="13" r="0.9" fill="white" />
    <path
      d="M54 11 L56 9 M52 11 L52 9"
      stroke="#1c1917"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="45" cy="20" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <path
      d="M40 86 L40 92 Q40 95 44 96"
      stroke="#f59e0b"
      strokeWidth="4.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M54 86 L54 92 Q54 95 58 96"
      stroke="#f59e0b"
      strokeWidth="4.5"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M40 96 L47 97" stroke="#f59e0b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M54 96 L61 97" stroke="#f59e0b" strokeWidth="3.5" fill="none" strokeLinecap="round" />
  </svg>
);

const Pig: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="62" rx="28" ry="22" fill="#f9a8d4" />
    <circle cx="50" cy="42" r="20" fill="#f9a8d4" />
    <polygon points="36,28 30,12 45,22" fill="#f9a8d4" />
    <polygon points="64,28 70,12 55,22" fill="#f9a8d4" />
    <polygon points="37,26 33,16 43,22" fill="#f472b6" />
    <polygon points="63,26 67,16 57,22" fill="#f472b6" />
    <ellipse cx="50" cy="48" rx="10" ry="8" fill="#f472b6" />
    <circle cx="46" cy="48" r="1.5" fill="#be185d" />
    <circle cx="54" cy="48" r="1.5" fill="#be185d" />
    <circle cx="42" cy="37" r="3" fill="#1c1917" />
    <circle cx="58" cy="37" r="3" fill="#1c1917" />
    <circle cx="43" cy="35" r="1" fill="white" />
    <circle cx="59" cy="35" r="1" fill="white" />
    <ellipse cx="33" cy="46" rx="3" ry="2" fill="#f472b6" opacity="0.6" />
    <ellipse cx="67" cy="46" rx="3" ry="2" fill="#f472b6" opacity="0.6" />
    <path
      d="M78 66 Q86 60 84 52 Q82 46 76 50 Q72 54 76 58"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <rect x="38" y="80" width="8" height="12" rx="3" fill="#f9a8d4" />
    <rect x="54" y="80" width="8" height="12" rx="3" fill="#f9a8d4" />
    <rect x="38" y="90" width="8" height="4" rx="2" fill="#f472b6" />
    <rect x="54" y="90" width="8" height="4" rx="2" fill="#f472b6" />
  </svg>
);

const Panda: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="29" cy="26" r="10" fill="#1c1917" />
    <circle cx="71" cy="26" r="10" fill="#1c1917" />
    <circle cx="50" cy="46" r="27" fill="white" />
    <ellipse cx="40" cy="45" rx="9" ry="11" fill="#1c1917" />
    <ellipse cx="60" cy="45" rx="9" ry="11" fill="#1c1917" />
    <circle cx="40" cy="45" r="3" fill="white" />
    <circle cx="60" cy="45" r="3" fill="white" />
    <circle cx="40" cy="45" r="1.5" fill="#1c1917" />
    <circle cx="60" cy="45" r="1.5" fill="#1c1917" />
    <ellipse cx="50" cy="56" rx="4.5" ry="3.5" fill="#1c1917" />
    <path
      d="M45 61 Q50 65 55 61"
      stroke="#1c1917"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="35" cy="62" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="65" cy="62" rx="4" ry="2.5" fill="#fca5a5" opacity="0.6" />
    <ellipse cx="50" cy="82" rx="24" ry="14" fill="white" />
    <ellipse cx="28" cy="80" rx="8" ry="10" fill="#1c1917" />
    <ellipse cx="72" cy="80" rx="8" ry="10" fill="#1c1917" />
  </svg>
);

const Penguin: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="56" rx="26" ry="32" fill="#1c1917" />
    <ellipse cx="50" cy="62" rx="17" ry="23" fill="white" />
    <ellipse cx="24" cy="52" rx="7" ry="16" fill="#1c1917" />
    <ellipse cx="76" cy="52" rx="7" ry="16" fill="#1c1917" />
    <ellipse cx="50" cy="34" rx="15" ry="13" fill="white" />
    <circle cx="43" cy="32" r="3" fill="#1c1917" />
    <circle cx="57" cy="32" r="3" fill="#1c1917" />
    <circle cx="44" cy="30" r="1" fill="white" />
    <circle cx="58" cy="30" r="1" fill="white" />
    <polygon points="50,48 40,43 40,53" fill="#ef4444" />
    <polygon points="50,48 60,43 60,53" fill="#ef4444" />
    <circle cx="50" cy="48" r="3" fill="#ef4444" />
    <path
      d="M50 37 C46 37 44 40 44 43 C44 45 47 46 50 46 C53 46 56 45 56 43 C56 40 54 37 50 37 Z"
      fill="#f97316"
    />
    <path
      d="M46 43 Q50 46 54 43"
      stroke="#c2410c"
      strokeWidth="1.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="39" cy="40" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.6" />
    <ellipse cx="61" cy="40" rx="2.5" ry="1.5" fill="#fda4af" opacity="0.6" />
    <path
      d="M43 52 Q50 57 57 52"
      stroke="#d1d5db"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="40" cy="88" rx="8" ry="4" fill="#f97316" />
    <ellipse cx="60" cy="88" rx="8" ry="4" fill="#f97316" />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Milk,
  Mouse,
  Monkey,
  Nose,
  Nest,
  Necklace,
  Ninja,
  Orange,
  Octopus,
  Owl,
  Onion,
  Ostrich,
  Pig,
  Panda,
  Penguin,
};
