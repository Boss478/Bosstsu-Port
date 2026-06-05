"use client";

import { type FC } from "react";

type IllustrationProps = { size?: number };

const A: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <circle cx="50" cy="55" r="35" fill="#ef4444" />
    <path d="M50 20 Q46 12 42 18" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M42 18 Q38 8 48 10 Q50 16 50 20" fill="#22c55e" />
    <ellipse cx="38" cy="42" rx="4" ry="6" fill="#dc2626" opacity="0.4" />
  </svg>
);

const B: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="48" cy="50" rx="28" ry="24" fill="#3b82f6" />
    <circle cx="38" cy="44" r="4" fill="#1e3a5f" />
    <circle cx="39" cy="43" r="1.5" fill="white" />
    <path d="M46 52 L60 46 L60 62 Z" fill="#facc15" />
    <path d="M76 36 Q70 42 64 38" stroke="#2563eb" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M72 42 Q66 48 60 44" stroke="#2563eb" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M68 48 Q62 54 56 50" stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M60 60 Q56 64 50 60" stroke="#facc15" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const C: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <circle cx="50" cy="50" r="32" fill="#f97316" />
    <polygon points="24,26 32,10 40,26" fill="#f97316" />
    <polygon points="60,26 68,10 76,26" fill="#f97316" />
    <polygon points="26,24 32,12 38,24" fill="#ea580c" />
    <polygon points="62,24 68,12 74,24" fill="#ea580c" />
    <ellipse cx="35" cy="46" rx="4" ry="6" fill="#1e3a5f" />
    <ellipse cx="65" cy="46" rx="4" ry="6" fill="#1e3a5f" />
    <circle cx="36" cy="44" r="1.5" fill="white" />
    <circle cx="66" cy="44" r="1.5" fill="white" />
    <ellipse cx="50" cy="56" rx="4" ry="2.5" fill="#f472b6" />
    <line x1="30" y1="62" x2="44" y2="56" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="70" y1="62" x2="56" y2="56" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="26" y1="52" x2="40" y2="50" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="74" y1="52" x2="60" y2="50" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M42 62 Q50 70 58 62" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const D: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="48" rx="30" ry="28" fill="#92400e" />
    <ellipse cx="32" cy="38" rx="10" ry="16" fill="#78350f" />
    <ellipse cx="68" cy="38" rx="10" ry="16" fill="#78350f" />
    <ellipse cx="50" cy="50" rx="18" ry="16" fill="#fde68a" />
    <ellipse cx="42" cy="46" rx="3" ry="5" fill="#1c1917" />
    <ellipse cx="58" cy="46" rx="3" ry="5" fill="#1c1917" />
    <circle cx="43" cy="44" r="1" fill="white" />
    <circle cx="59" cy="44" r="1" fill="white" />
    <ellipse cx="50" cy="58" rx="5" ry="3" fill="#1c1917" />
    <path d="M44 52 L50 48 L56 52Z" fill="#ef4444" />
    <path d="M48 52 Q50 54 52 52" stroke="#dc2626" strokeWidth="1" fill="none" />
  </svg>
);

const E: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="52" rx="30" ry="34" fill="#9ca3af" />
    <ellipse cx="26" cy="44" rx="14" ry="18" fill="#d1d5db" />
    <path d="M40 32 Q30 28 24 18" stroke="#6b7280" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M26 50 Q18 54 10 52" stroke="#6b7280" strokeWidth="3" fill="none" strokeLinecap="round" />
    <circle cx="44" cy="40" r="3.5" fill="#1c1917" />
    <circle cx="45" cy="39" r="1.2" fill="white" />
    <path d="M36 56 L44 52" stroke="#1c1917" strokeWidth="2" strokeLinecap="round" />
    <path d="M68 18 Q72 10 76 16 L74 30 Q70 38 64 30Z" fill="#d1d5db" />
    <rect x="75" y="14" width="4" height="18" rx="2" fill="#d1d5db" />
  </svg>
);

const F: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="60" rx="28" ry="24" fill="#22c55e" />
    <circle cx="36" cy="42" r="12" fill="#22c55e" />
    <circle cx="64" cy="42" r="12" fill="#22c55e" />
    <circle cx="36" cy="42" r="8" fill="white" />
    <circle cx="64" cy="42" r="8" fill="white" />
    <circle cx="36" cy="42" r="4" fill="#1c1917" />
    <circle cx="64" cy="42" r="4" fill="#1c1917" />
    <circle cx="37" cy="40" r="1.5" fill="white" />
    <circle cx="65" cy="40" r="1.5" fill="white" />
    <path d="M42 58 Q50 68 58 58" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <ellipse cx="36" cy="54" rx="4" ry="2.5" fill="#16a34a" opacity="0.4" />
    <ellipse cx="64" cy="54" rx="4" ry="2.5" fill="#16a34a" opacity="0.4" />
    <circle cx="44" cy="66" r="2" fill="#15803d" opacity="0.3" />
    <circle cx="56" cy="68" r="1.5" fill="#15803d" opacity="0.3" />
    <circle cx="50" cy="70" r="2" fill="#15803d" opacity="0.3" />
  </svg>
);

const G: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="58" rx="22" ry="32" fill="#facc15" />
    <ellipse cx="50" cy="24" rx="16" ry="20" fill="#facc15" />
    <circle cx="50" cy="16" r="10" fill="#facc15" />
    <rect x="42" y="2" width="16" height="10" rx="4" fill="#facc15" />
    <circle cx="44" cy="18" r="3" fill="#1c1917" />
    <circle cx="56" cy="18" r="3" fill="#1c1917" />
    <circle cx="45" cy="16" r="1" fill="white" />
    <circle cx="57" cy="16" r="1" fill="white" />
    <ellipse cx="42" cy="22" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="58" cy="22" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <path d="M45 30 Q50 36 55 30" stroke="#a16207" strokeWidth="2" fill="none" strokeLinecap="round" />
    <circle cx="44" cy="40" r="3" fill="#a16207" />
    <circle cx="56" cy="44" r="2.5" fill="#a16207" />
    <circle cx="48" cy="52" r="3.5" fill="#a16207" />
    <circle cx="52" cy="36" r="2" fill="#a16207" />
    <circle cx="42" cy="50" r="2" fill="#a16207" />
    <circle cx="58" cy="54" r="2" fill="#a16207" />
  </svg>
);

const H: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <rect x="15" y="45" width="70" height="50" rx="3" fill="#fbbf24" />
    <polygon points="10,46 50,10 90,46" fill="#ef4444" />
    <rect x="22" y="55" width="16" height="40" rx="2" fill="#b45309" />
    <rect x="62" y="55" width="16" height="40" rx="2" fill="#b45309" />
    <rect x="38" y="65" width="24" height="30" rx="2" fill="#b45309" />
    <circle cx="50" cy="80" r="3" fill="#fbbf24" />
    <rect x="40" y="72" width="20" height="3" rx="1" fill="#92400e" />
  </svg>
);

const I: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <polygon points="30,60 50,95 70,60" fill="#d97706" />
    <rect x="38" y="58" width="24" height="8" rx="2" fill="#b45309" />
    <circle cx="50" cy="36" r="26" fill="#f472b6" />
    <circle cx="50" cy="36" r="20" fill="#f9a8d4" />
    <path d="M40 32 Q50 26 60 32" stroke="#db2777" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M42 28 Q50 22 58 28" stroke="#db2777" strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.5" />
    <circle cx="50" cy="14" r="5" fill="#ef4444" />
    <path d="M50 19 L50 10" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const J: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <rect x="25" y="20" width="50" height="60" rx="6" fill="#fbbf24" />
    <rect x="30" y="24" width="40" height="20" rx="3" fill="#f59e0b" />
    <rect x="30" y="48" width="40" height="28" rx="3" fill="white" />
    <text x="50" y="66" textAnchor="middle" fontSize="14" fontWeight="900" fill="#d97706" fontFamily="sans-serif">JUICE</text>
    <rect x="60" y="12" width="8" height="28" rx="2" fill="#ef4444" />
    <line x1="62" y1="12" x2="72" y2="6" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    <ellipse cx="64" cy="16" rx="3" ry="2" fill="#ef4444" />
  </svg>
);

const K: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <polygon points="50,8 84,40 50,72 16,40" fill="#ef4444" />
    <polygon points="50,16 74,40 50,64 26,40" fill="#fca5a5" opacity="0.5" />
    <line x1="50" y1="8" x2="50" y2="72" stroke="#991b1b" strokeWidth="1.5" />
    <line x1="16" y1="40" x2="84" y2="40" stroke="#991b1b" strokeWidth="1.5" />
    <circle cx="28" cy="56" r="3" fill="#3b82f6" />
    <circle cx="36" cy="60" r="2.5" fill="#22c55e" />
    <circle cx="44" cy="58" r="2" fill="#facc15" />
    <rect x="46" y="70" width="8" height="20" rx="2" fill="#92400e" />
    <path d="M28 54 Q22 64 18 72" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M26 58 Q20 66 16 74" stroke="#3b82f6" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const L: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <circle cx="50" cy="34" r="28" fill="#f472b6" />
    <circle cx="50" cy="34" r="20" fill="white" />
    <circle cx="50" cy="34" r="16" fill="#f472b6" />
    <circle cx="50" cy="34" r="10" fill="white" />
    <circle cx="50" cy="34" r="5" fill="#f472b6" />
    <rect x="46" y="58" width="8" height="34" rx="3" fill="#d1d5db" />
  </svg>
);

const M: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="54" rx="22" ry="20" fill="#9ca3af" />
    <circle cx="32" cy="32" r="18" fill="#9ca3af" />
    <circle cx="68" cy="32" r="18" fill="#9ca3af" />
    <circle cx="32" cy="32" r="14" fill="#d1d5db" />
    <circle cx="68" cy="32" r="14" fill="#d1d5db" />
    <ellipse cx="44" cy="50" rx="3" ry="4" fill="#1c1917" />
    <ellipse cx="56" cy="50" rx="3" ry="4" fill="#1c1917" />
    <circle cx="45" cy="48" r="1" fill="white" />
    <circle cx="57" cy="48" r="1" fill="white" />
    <circle cx="50" cy="56" r="3" fill="#f472b6" />
    <line x1="28" y1="56" x2="44" y2="52" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="72" y1="56" x2="56" y2="52" stroke="#6b7280" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const N: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="60" rx="32" ry="18" fill="#92400e" />
    <ellipse cx="50" cy="56" rx="28" ry="14" fill="#78350f" />
    <path d="M22 58 Q18 46 24 38 Q30 32 38 36 Q34 28 40 22 Q46 18 52 24 Q50 14 58 12 Q66 12 64 22 Q70 16 74 24 Q78 32 70 38 Q76 42 78 52" stroke="#a16207" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="40" cy="52" rx="6" ry="8" fill="#60a5fa" />
    <ellipse cx="56" cy="50" rx="5" ry="7" fill="#60a5fa" />
    <ellipse cx="48" cy="54" rx="4.5" ry="6" fill="#60a5fa" />
    <ellipse cx="36" cy="50" rx="3" ry="5" fill="#93c5fd" />
    <ellipse cx="52" cy="48" rx="3" ry="4.5" fill="#93c5fd" />
  </svg>
);

const O: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <circle cx="50" cy="46" r="24" fill="#a855f7" />
    <circle cx="40" cy="40" r="4" fill="white" />
    <circle cx="60" cy="40" r="4" fill="white" />
    <circle cx="40" cy="40" r="2" fill="#1c1917" />
    <circle cx="60" cy="40" r="2" fill="#1c1917" />
    <path d="M42 56 Q50 62 58 56" stroke="#7c3aed" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <ellipse cx="36" cy="52" rx="3" ry="2" fill="#d8b4fe" opacity="0.5" />
    <ellipse cx="64" cy="52" rx="3" ry="2" fill="#d8b4fe" opacity="0.5" />
    <path d="M32 64 Q26 74 20 82" stroke="#a855f7" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M38 66 Q34 76 30 84" stroke="#a855f7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M44 66 Q42 76 38 84" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M68 64 Q74 74 80 82" stroke="#a855f7" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M62 66 Q66 76 70 84" stroke="#a855f7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <path d="M56 66 Q58 76 62 84" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
  </svg>
);

const P: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="54" rx="26" ry="34" fill="#1c1917" />
    <ellipse cx="50" cy="58" rx="18" ry="24" fill="white" />
    <path d="M36 60 L50 72 L64 60Z" fill="#f97316" />
    <ellipse cx="40" cy="36" rx="3" ry="4" fill="white" />
    <ellipse cx="60" cy="36" rx="3" ry="4" fill="white" />
    <circle cx="40" cy="36" r="2" fill="#1c1917" />
    <circle cx="60" cy="36" r="2" fill="#1c1917" />
    <ellipse cx="36" cy="86" rx="8" ry="4" fill="#f97316" />
    <ellipse cx="64" cy="86" rx="8" ry="4" fill="#f97316" />
    <path d="M40 40 Q36 46 38 50" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    <path d="M60 40 Q64 46 62 50" stroke="#1c1917" strokeWidth="1.5" fill="none" strokeLinecap="round" />
  </svg>
);

const Q: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <rect x="20" y="34" width="60" height="14" rx="4" fill="#fbbf24" />
    <polygon points="20,34 14,14 30,28" fill="#fbbf24" />
    <polygon points="80,34 86,14 70,28" fill="#fbbf24" />
    <polygon points="50,34 56,10 44,10" fill="#fbbf24" />
    <circle cx="24" cy="20" r="3" fill="#ef4444" />
    <circle cx="76" cy="20" r="3" fill="#ef4444" />
    <circle cx="50" cy="16" r="3" fill="#3b82f6" />
    <circle cx="36" cy="24" r="2.5" fill="#22c55e" />
    <circle cx="64" cy="24" r="2.5" fill="#22c55e" />
    <circle cx="50" cy="56" r="22" fill="#fde68a" />
    <circle cx="42" cy="54" r="3" fill="#1c1917" />
    <circle cx="58" cy="54" r="3" fill="#1c1917" />
    <path d="M44 62 Q50 66 56 62" stroke="#dc2626" strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="36" cy="58" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="64" cy="58" rx="2.5" ry="1.5" fill="#fca5a5" opacity="0.5" />
    <path d="M65 70 L72 76" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="74" cy="78" r="3" fill="#1c1917" />
  </svg>
);

const R: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <path d="M12 88 Q20 10 50 10 Q80 10 88 40 Q92 60 76 72 Q64 82 50 72" stroke="#ef4444" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M18 78 Q24 20 50 20 Q76 20 82 44 Q86 60 72 68 Q62 76 50 68" stroke="#f97316" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M24 68 Q28 30 50 30 Q72 30 76 48 Q78 60 68 64 Q60 70 50 64" stroke="#facc15" strokeWidth="4.5" fill="none" strokeLinecap="round" />
    <path d="M30 60 Q32 38 50 38 Q68 38 72 52 Q74 60 64 62 Q58 66 50 60" fill="#22c55e" />
    <path d="M36 54 Q38 44 50 44 Q62 44 66 54" stroke="#3b82f6" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M42 50 Q44 46 50 46 Q56 46 58 50" stroke="#a855f7" strokeWidth="3" fill="none" strokeLinecap="round" />
    <ellipse cx="48" cy="76" rx="6" ry="3" fill="white" />
    <ellipse cx="58" cy="74" rx="6" ry="3" fill="white" />
    <ellipse cx="44" cy="80" rx="4" ry="2" fill="white" />
  </svg>
);

const S: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <polygon points="50,6 62,36 94,38 68,58 76,90 50,72 24,90 32,58 6,38 38,36" fill="#facc15" />
    <polygon points="50,14 58,36 84,38 64,54 70,78 50,64 30,78 36,54 16,38 42,36" fill="#fde047" opacity="0.6" />
    <circle cx="50" cy="48" r="8" fill="#facc15" />
    <circle cx="50" cy="48" r="5" fill="#fef08a" />
  </svg>
);

const T: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="58" rx="30" ry="24" fill="#22c55e" />
    <ellipse cx="50" cy="54" rx="24" ry="20" fill="#16a34a" />
    <path d="M38 48 Q44 38 50 44 Q56 38 62 48" stroke="#15803d" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M36 54 Q44 46 50 52 Q56 46 64 54" stroke="#15803d" strokeWidth="2.5" fill="none" strokeLinecap="round" opacity="0.6" />
    <path d="M40 58 Q46 52 50 56 Q54 52 60 58" stroke="#15803d" strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.4" />
    <circle cx="36" cy="34" r="6" fill="#22c55e" />
    <circle cx="36" cy="34" r="3" fill="#1c1917" />
    <circle cx="37" cy="32" r="1" fill="white" />
    <path d="M30 40 L26 34" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M42 40 L46 34" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
    <rect x="26" y="76" width="8" height="14" rx="3" fill="#22c55e" />
    <rect x="66" y="76" width="8" height="14" rx="3" fill="#22c55e" />
    <rect x="46" y="78" width="8" height="12" rx="3" fill="#22c55e" />
  </svg>
);

const U: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <path d="M20 38 Q20 14 50 14 Q80 14 80 38" fill="#3b82f6" />
    <path d="M20 38 L18 40 Q16 46 24 46 L76 46 Q84 46 82 40 L80 38Z" fill="#2563eb" />
    <rect x="18" y="40" width="64" height="6" rx="2" fill="#1e3a5f" />
    <path d="M48 46 L48 80 Q48 84 44 84" stroke="#1c1917" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M40 90 Q36 84 44 84" stroke="#1c1917" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    <line x1="28" y1="50" x2="26" y2="60" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
    <line x1="36" y1="50" x2="34" y2="58" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
    <line x1="64" y1="50" x2="66" y2="58" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
    <line x1="72" y1="50" x2="74" y2="60" stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const V: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="42" cy="56" rx="16" ry="24" fill="#d97706" />
    <ellipse cx="58" cy="56" rx="16" ry="24" fill="#d97706" />
    <ellipse cx="42" cy="40" rx="10" ry="10" fill="#f59e0b" />
    <ellipse cx="58" cy="40" rx="10" ry="10" fill="#f59e0b" />
    <ellipse cx="42" cy="72" rx="12" ry="8" fill="#f59e0b" />
    <ellipse cx="58" cy="72" rx="12" ry="8" fill="#f59e0b" />
    <path d="M48 32 L46 18 L52 16 L54 30Z" fill="#d97706" />
    <path d="M52 16 L56 6 L60 8 L56 18Z" fill="#d97706" />
    <circle cx="58" cy="7" r="2.5" fill="#1c1917" />
    <line x1="26" y1="14" x2="74" y2="44" stroke="#d97706" strokeWidth="3" strokeLinecap="round" />
  </svg>
);

const W: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="58" rx="34" ry="24" fill="#3b82f6" />
    <path d="M24 62 Q34 50 44 58 Q50 62 56 58 Q66 50 76 62" stroke="#2563eb" strokeWidth="2" fill="none" />
    <ellipse cx="50" cy="44" rx="12" ry="8" fill="#60a5fa" opacity="0.4" />
    <circle cx="38" cy="50" r="4" fill="#1e3a5f" />
    <circle cx="39" cy="48" r="1.5" fill="white" />
    <path d="M44 58 Q50 64 56 58" stroke="#1e3a5f" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M14 62 L24 68 L14 72" stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M86 62 L76 68 L86 72" stroke="#2563eb" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M46 22 Q48 14 50 22 Q52 14 54 22" stroke="#93c5fd" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M42 26 Q46 18 50 26" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M58 26 Q54 18 50 26" stroke="#93c5fd" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const X: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="44" rx="18" ry="24" fill="#e5e7eb" />
    <ellipse cx="50" cy="44" rx="14" ry="20" fill="#f3f4f6" />
    <path d="M36 28 Q44 36 50 32 Q56 36 64 28" stroke="#9ca3af" strokeWidth="2" fill="none" />
    <path d="M38 34 Q44 40 50 36 Q56 40 62 34" stroke="#d1d5db" strokeWidth="1.5" fill="none" />
    <line x1="40" y1="44" x2="60" y2="44" stroke="#9ca3af" strokeWidth="2" />
    <line x1="36" y1="52" x2="64" y2="52" stroke="#d1d5db" strokeWidth="1.5" />
    <line x1="42" y1="36" x2="42" y2="56" stroke="#d1d5db" strokeWidth="1.5" />
    <line x1="58" y1="36" x2="58" y2="56" stroke="#d1d5db" strokeWidth="1.5" />
    <line x1="38" y1="60" x2="62" y2="60" stroke="#d1d5db" strokeWidth="1.5" />
    <circle cx="50" cy="36" r="4" fill="white" stroke="#9ca3af" strokeWidth="1" />
    <circle cx="38" cy="44" r="2" fill="white" stroke="#9ca3af" strokeWidth="1" />
    <circle cx="62" cy="44" r="2" fill="white" stroke="#9ca3af" strokeWidth="1" />
    <rect x="46" y="66" width="8" height="24" rx="3" fill="#d1d5db" />
    <rect x="43" y="66" width="14" height="4" rx="2" fill="#9ca3af" />
  </svg>
);

const Y: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <circle cx="50" cy="46" r="28" fill="#ef4444" />
    <circle cx="50" cy="46" r="22" fill="#fca5a5" />
    <circle cx="50" cy="46" r="16" fill="white" />
    <circle cx="50" cy="46" r="10" fill="#ef4444" />
    <circle cx="50" cy="46" r="4" fill="white" />
    <line x1="50" y1="74" x2="50" y2="86" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
    <line x1="42" y1="78" x2="58" y2="78" stroke="#d1d5db" strokeWidth="3" strokeLinecap="round" />
    <line x1="40" y1="76" x2="40" y2="84" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
    <line x1="60" y1="76" x2="60" y2="84" stroke="#d1d5db" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const Z: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-lg">
    <ellipse cx="50" cy="52" rx="34" ry="24" fill="white" />
    <path d="M26 38 Q34 30 42 34 Q50 38 58 34 Q66 30 74 38" stroke="#1c1917" strokeWidth="2.5" fill="none" />
    <path d="M24 46 Q34 38 42 42 Q50 46 58 42 Q66 38 76 46" stroke="#1c1917" strokeWidth="2.5" fill="none" />
    <path d="M22 54 Q34 46 42 50 Q50 54 58 50 Q66 46 78 54" stroke="#1c1917" strokeWidth="2.5" fill="none" />
    <path d="M24 62 Q34 54 42 58 Q50 62 58 58 Q66 54 76 62" stroke="#1c1917" strokeWidth="2.5" fill="none" />
    <ellipse cx="50" cy="32" rx="6" ry="4" fill="#1c1917" />
    <circle cx="50" cy="32" r="2" fill="white" />
    <ellipse cx="50" cy="28" rx="4" ry="3" fill="#1c1917" />
    <path d="M46 28 L54 28" stroke="#1c1917" strokeWidth="1.5" />
    <path d="M44 30 Q38 32 34 36" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M56 30 Q62 32 66 36" stroke="#1c1917" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const illustrations: Record<string, FC<IllustrationProps>> = {
  A, B, C, D, E, F, G, H, I, J, K, L, M,
  N, O, P, Q, R, S, T, U, V, W, X, Y, Z,
};

export function CardIllustration({ letter, size = 48 }: { letter: string; size?: number }) {
  const Illustration = illustrations[letter.toUpperCase()];
  if (!Illustration) return <span className="text-3xl">🔮</span>;
  return <Illustration size={size} />;
}
