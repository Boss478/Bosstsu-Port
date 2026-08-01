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
    <rect x="22" y="22" width="56" height="20" rx="6" fill="#2563eb" />
    <rect x="24" y="26" width="18" height="13" rx="3" fill="#bfdbfe" />
    <rect x="50" y="26" width="20" height="12" rx="3" fill="#bfdbfe" />
    <rect x="10" y="40" width="80" height="36" rx="8" fill="#3b82f6" />
    <rect x="10" y="58" width="80" height="5" rx="2.5" fill="#93c5fd" />
    <line x1="44" y1="40" x2="44" y2="76" stroke="#1d4ed8" strokeWidth="2" />
    <rect x="40" y="54" width="5" height="3" rx="1" fill="#1e40af" />
    <circle cx="14" cy="50" r="3" fill="#fde047" />
    <rect x="84" y="50" width="4" height="6" rx="1" fill="#ef4444" />
    <circle cx="28" cy="78" r="10" fill="#1c1917" />
    <circle cx="28" cy="78" r="4" fill="#d1d5db" />
    <circle cx="72" cy="78" r="10" fill="#1c1917" />
    <circle cx="72" cy="78" r="4" fill="#d1d5db" />
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
    <path d="M10 44 A40 40 0 0 1 90 44 L90 50 A34 34 0 0 0 10 50 Z" fill="#16a34a" />
    <path
      d="M19 26 A36 36 0 0 1 32 13"
      stroke="#15803d"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M81 26 A36 36 0 0 1 68 13"
      stroke="#15803d"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M44 11 A34 34 0 0 1 56 11"
      stroke="#15803d"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path d="M14 50 A36 36 0 0 1 86 50 L86 53 A33 33 0 0 0 14 53 Z" fill="#f8fafc" />
    <path d="M16 53 A34 34 0 0 0 84 53 Z" fill="#ef4444" />
    <path d="M24 58 A28 28 0 0 0 76 58 Z" fill="#f87171" opacity="0.35" />
    <ellipse cx="34" cy="66" rx="2.2" ry="3.2" fill="#1c1917" transform="rotate(-20 34 66)" />
    <ellipse cx="50" cy="74" rx="2.2" ry="3.2" fill="#1c1917" />
    <ellipse cx="66" cy="66" rx="2.2" ry="3.2" fill="#1c1917" transform="rotate(20 66 66)" />
    <ellipse cx="42" cy="82" rx="2" ry="3" fill="#1c1917" transform="rotate(10 42 82)" />
    <ellipse cx="58" cy="82" rx="2" ry="3" fill="#1c1917" transform="rotate(-10 58 82)" />
    <ellipse cx="26" cy="58" rx="1.8" ry="2.6" fill="#1c1917" transform="rotate(-25 26 58)" />
    <ellipse cx="74" cy="58" rx="1.8" ry="2.6" fill="#1c1917" transform="rotate(25 74 58)" />
    <ellipse cx="10" cy="49" rx="4" ry="3" fill="#16a34a" />
    <ellipse cx="90" cy="49" rx="4" ry="3" fill="#16a34a" />
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
    <path d="M84 52 Q92 44 96 38 Q98 42 94 50 Q90 55 86 56 Z" fill="#2563eb" />
    <path d="M84 62 Q92 70 96 76 Q98 72 94 64 Q90 59 86 58 Z" fill="#2563eb" />
    <ellipse cx="54" cy="56" rx="28" ry="19" fill="#3b82f6" />
    <ellipse cx="48" cy="62" rx="18" ry="10" fill="#93c5fd" />
    <path
      d="M32 66 Q38 70 44 66"
      stroke="#60a5fa"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M42 69 Q48 72 54 69"
      stroke="#60a5fa"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path
      d="M52 70 Q58 73 64 70"
      stroke="#60a5fa"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      opacity="0.6"
    />
    <path d="M52 60 Q60 56 58 66 Q56 70 50 68 Z" fill="#2563eb" />
    <circle cx="34" cy="50" r="3.5" fill="#1e3a5f" />
    <circle cx="35" cy="49" r="1.2" fill="white" />
    <path
      d="M28 60 Q34 65 42 62"
      stroke="#1e3a5f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="31" cy="57" rx="3" ry="2" fill="#93c5fd" opacity="0.7" />
    <path
      d="M32 36 Q28 26 24 18"
      stroke="#60a5fa"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="23" cy="16" r="2.5" fill="#60a5fa" />
    <circle cx="31" cy="22" r="2" fill="#60a5fa" />
    <circle cx="18" cy="26" r="1.8" fill="#60a5fa" />
    <circle cx="18" cy="56" r="2" fill="#93c5fd" opacity="0.6" />
    <circle cx="14" cy="48" r="1.5" fill="#93c5fd" opacity="0.6" />
    <circle cx="20" cy="44" r="1.8" fill="#93c5fd" opacity="0.6" />
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
