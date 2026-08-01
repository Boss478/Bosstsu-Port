'use client';

import type { FC } from 'react';
import type { IllustrationProps } from '../CardIllustrations';

const Hen: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="20" cy="52" r="7" fill="#ef4444" />
    <circle cx="25" cy="60" r="6.5" fill="#f97316" />
    <circle cx="17" cy="61" r="5.5" fill="#facc15" />
    <ellipse cx="54" cy="60" rx="26" ry="19" fill="#f5f5f4" />
    <ellipse cx="53" cy="63" rx="12" ry="8" fill="#e5e7eb" />
    <circle cx="60" cy="36" r="12" fill="#f5f5f4" />
    <circle cx="54" cy="25" r="4" fill="#ef4444" />
    <circle cx="61" cy="23" r="4.5" fill="#ef4444" />
    <circle cx="68" cy="26" r="4" fill="#ef4444" />
    <polygon points="68,35 80,38 68,43" fill="#f97316" />
    <ellipse cx="64" cy="47" rx="3.5" ry="4.5" fill="#ef4444" />
    <circle cx="64" cy="33" r="2.5" fill="#1c1917" />
    <circle cx="65" cy="32" r="0.9" fill="white" />
    <path d="M48 79 L48 88" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M60 79 L60 88" stroke="#f97316" strokeWidth="3" fill="none" strokeLinecap="round" />
    <path d="M48 88 L42 90" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    <path d="M60 88 L66 90" stroke="#f97316" strokeWidth="2.5" fill="none" strokeLinecap="round" />
  </svg>
);

const Horse: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M72 54 Q86 56 89 42 Q90 33 83 33 Q84 44 78 49 Q74 52 70 52 Z" fill="#78350f" />
    <ellipse cx="50" cy="62" rx="26" ry="14" fill="#a16207" />
    <ellipse cx="50" cy="69" rx="15" ry="4.5" fill="#fbbf24" opacity="0.35" />
    <path d="M40 72 L36 88" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M58 72 L56 88" stroke="#78350f" strokeWidth="5" fill="none" strokeLinecap="round" />
    <path d="M47 73 L45 89" stroke="#78350f" strokeWidth="7" fill="none" strokeLinecap="round" />
    <path d="M64 73 L66 89" stroke="#78350f" strokeWidth="7" fill="none" strokeLinecap="round" />
    <rect x="32" y="88" width="8" height="5" rx="2" fill="#451a03" />
    <rect x="52" y="88" width="8" height="5" rx="2" fill="#451a03" />
    <rect x="41" y="89" width="9" height="5.5" rx="2.5" fill="#451a03" />
    <rect x="61" y="89" width="9" height="5.5" rx="2.5" fill="#451a03" />
    <path
      d="M54 50 C58 36 54 26 46 22"
      stroke="#a16207"
      strokeWidth="15"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M38 14 L34 1 L45 9 Z" fill="#a16207" />
    <path d="M47 13 L51 1 L55 10 Z" fill="#a16207" />
    <path d="M39 12 L37 4 L43 9 Z" fill="#78350f" />
    <path d="M50 12 C58 16 60 30 56 44 C54 48 50 48 48 44 C52 34 52 22 48 16 Z" fill="#78350f" />
    <ellipse cx="42" cy="22" rx="16" ry="10.5" fill="#a16207" />
    <ellipse cx="28" cy="24" rx="7.5" ry="7" fill="#a16207" />
    <path
      d="M36 15 Q28 13 30 6"
      stroke="#78350f"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="40" cy="20" r="2.5" fill="#1c1917" />
    <circle cx="41" cy="19" r="0.9" fill="white" />
    <circle cx="22" cy="26" r="1.5" fill="#78350f" />
    <path
      d="M25 30 Q29 33 33 31"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="34" cy="29" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
  </svg>
);

const House: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="16" y="44" width="68" height="50" rx="3" fill="#fbbf24" />
    <polygon points="10,46 50,10 90,46" fill="#ef4444" />
    <rect x="62" y="16" width="13" height="20" rx="2" fill="#b45309" />
    <rect x="59" y="12" width="19" height="6" rx="2" fill="#b45309" />
    <rect x="40" y="62" width="20" height="32" rx="2" fill="#b45309" />
    <circle cx="55" cy="78" r="2.2" fill="#fbbf24" />
    <rect x="24" y="54" width="14" height="13" rx="2" fill="#93c5fd" />
    <line x1="31" y1="54" x2="31" y2="67" stroke="#60a5fa" strokeWidth="2" />
    <line x1="24" y1="60.5" x2="38" y2="60.5" stroke="#60a5fa" strokeWidth="2" />
    <circle cx="64" cy="58" r="6" fill="#93c5fd" />
    <circle cx="64" cy="58" r="2" fill="#fbbf24" />
  </svg>
);

const Igloo: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="79" rx="42" ry="6" fill="#dbeafe" />
    <path d="M14 78 A36 36 0 0 1 86 78 Z" fill="#f8fafc" />
    <path d="M20 66 Q50 58 80 66" stroke="#bfdbfe" strokeWidth="2" fill="none" />
    <path d="M24 56 Q50 49 76 56" stroke="#bfdbfe" strokeWidth="2" fill="none" />
    <path d="M30 47 Q50 41 70 47" stroke="#bfdbfe" strokeWidth="2" fill="none" />
    <path d="M38 63 L38 57" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
    <path d="M62 63 L62 57" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
    <path d="M44 55 L44 50" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
    <path d="M56 55 L56 50" stroke="#bfdbfe" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 78 L40 64 A10 10 0 0 1 60 64 L60 78 Z" fill="#1e3a5f" />
  </svg>
);

const IceCream: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="41,52 59,52 50,86" fill="#f59e0b" />
    <path d="M44 62 L56 62" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    <path d="M45 70 L55 70" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    <path d="M47 78 L53 78" stroke="#b45309" strokeWidth="2" strokeLinecap="round" />
    <circle cx="50" cy="44" r="15" fill="#6ee7b7" />
    <circle cx="50" cy="30" r="14" fill="#f472b6" />
    <circle cx="44" cy="26" r="3.5" fill="#fbcfe8" opacity="0.7" />
    <circle cx="50" cy="15" r="5" fill="#ef4444" />
    <path d="M50 10 L52 4" stroke="#78350f" strokeWidth="2" fill="none" strokeLinecap="round" />
  </svg>
);

const Ice: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <polygon points="30,34 50,24 70,34 50,44" fill="#bae6fd" />
    <polygon points="30,34 30,60 50,70 50,44" fill="#7dd3fc" />
    <polygon points="70,34 70,60 50,70 50,44" fill="#38bdf8" />
    <polygon points="66,62 76,57 86,62 76,67" fill="#7dd3fc" />
    <polygon points="66,62 66,74 76,79 76,67" fill="#38bdf8" />
    <polygon points="86,62 86,74 76,79 76,67" fill="#0ea5e9" />
    <path d="M20 22 L21 25 L24 26 L21 27 L20 30 L19 27 L16 26 L19 25 Z" fill="#e0f2fe" />
    <path d="M84 30 L85 32 L87 33 L85 34 L84 36 L83 34 L81 33 L83 32 Z" fill="#e0f2fe" />
  </svg>
);

const Island: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <ellipse cx="50" cy="84" rx="42" ry="10" fill="#60a5fa" />
    <path
      d="M20 88 Q32 82 44 88 Q56 94 68 88 Q76 84 84 88"
      stroke="#93c5fd"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="76" rx="26" ry="8" fill="#fcd34d" />
    <path
      d="M50 76 Q49 60 50 44"
      stroke="#92400e"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="50" cy="22" rx="5" ry="11" fill="#16a34a" />
    <ellipse cx="34" cy="30" rx="11" ry="5" fill="#22c55e" />
    <ellipse cx="66" cy="30" rx="11" ry="5" fill="#22c55e" />
    <ellipse cx="36" cy="44" rx="10" ry="4.5" fill="#16a34a" />
    <ellipse cx="64" cy="44" rx="10" ry="4.5" fill="#16a34a" />
    <circle cx="47" cy="51" r="3" fill="#78350f" />
    <circle cx="54" cy="52" r="3" fill="#78350f" />
  </svg>
);

const Iron: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="24" y="64" width="52" height="8" rx="3" fill="#9ca3af" />
    <polygon points="30,64 36,48 74,48 78,64" fill="#64748b" />
    <path
      d="M38 48 Q38 34 52 34 L60 34 Q66 34 66 40 L66 48"
      stroke="#334155"
      strokeWidth="5"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="52" cy="56" r="3" fill="#334155" />
    <circle cx="53" cy="55" r="1" fill="white" />
    <rect x="42" y="52" width="8" height="8" rx="2" fill="#7dd3fc" />
    <path
      d="M70 40 Q76 36 74 28"
      stroke="#cbd5e1"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M76 42 Q82 38 80 30"
      stroke="#cbd5e1"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
  </svg>
);

const Jam: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="42" y="15" width="16" height="6" rx="2" fill="#f97316" />
    <rect x="32" y="20" width="36" height="9" rx="3" fill="#f97316" />
    <rect x="32" y="29" width="36" height="50" rx="7" fill="#e0f2fe" />
    <rect x="35" y="47" width="30" height="29" rx="4" fill="#ef4444" />
    <rect x="37" y="51" width="26" height="15" rx="2" fill="white" />
    <circle cx="58" cy="45" r="2.5" fill="#fecaca" />
    <circle cx="52" cy="43" r="2" fill="#fecaca" />
    <path d="M41 35 L41 62" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.7" />
  </svg>
);

const Juice: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M34 28 L66 28 L62 72 Q61 78 55 78 L45 78 Q39 78 38 72 Z"
      fill="#bae6fd"
      opacity="0.8"
    />
    <rect x="40" y="42" width="20" height="32" rx="3" fill="#f97316" />
    <circle cx="50" cy="45" r="3" fill="#fbbf24" opacity="0.7" />
    <circle cx="46" cy="52" r="2" fill="#fbbf24" opacity="0.6" />
    <path d="M57 12 L64 10 L66 46 L59 48 Z" fill="#ef4444" />
    <circle cx="44" cy="22" r="10" fill="#fb923c" />
    <circle cx="44" cy="22" r="6" fill="#fde68a" />
    <line x1="44" y1="16" x2="44" y2="28" stroke="#ea580c" strokeWidth="2" />
    <line x1="38" y1="22" x2="50" y2="22" stroke="#ea580c" strokeWidth="2" />
    <line x1="39.5" y1="17.5" x2="48.5" y2="26.5" stroke="#ea580c" strokeWidth="2" />
    <line x1="48.5" y1="17.5" x2="39.5" y2="26.5" stroke="#ea580c" strokeWidth="2" />
  </svg>
);

const Jar: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="33" y="30" width="34" height="42" rx="7" fill="#e0f2fe" />
    <rect x="36" y="24" width="28" height="6" rx="2" fill="#cbd5e1" />
    <rect x="31" y="17" width="38" height="8" rx="3" fill="#f59e0b" />
    <circle cx="50" cy="13" r="4" fill="#f59e0b" />
    <path d="M38 36 L38 64" stroke="white" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
    <path d="M50 44 L51 47 L54 48 L51 49 L50 52 L49 49 L46 48 L49 47 Z" fill="#facc15" />
    <path d="M28 12 L29 14 L31 15 L29 16 L28 18 L27 16 L25 15 L27 14 Z" fill="#e0f2fe" />
    <path d="M72 34 L73 36 L75 37 L73 38 L72 40 L71 38 L69 37 L71 36 Z" fill="#e0f2fe" />
  </svg>
);

const Jellyfish: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M20 50 C20 24 80 24 80 50 Q74 62 66 52 Q58 62 50 52 Q42 62 34 52 Q28 60 20 50 Z"
      fill="#f472b6"
    />
    <path
      d="M26 50 C26 30 74 30 74 50 Q68 58 62 51 Q56 58 50 51 Q44 58 38 51 Q32 58 26 50 Z"
      fill="#f9a8d4"
      opacity="0.8"
    />
    <circle cx="36" cy="36" r="2" fill="#f9a8d4" />
    <circle cx="50" cy="32" r="2.5" fill="#f9a8d4" />
    <circle cx="64" cy="36" r="2" fill="#f9a8d4" />
    <circle cx="42" cy="44" r="3" fill="#1c1917" />
    <circle cx="58" cy="44" r="3" fill="#1c1917" />
    <circle cx="43" cy="43" r="1" fill="white" />
    <circle cx="59" cy="43" r="1" fill="white" />
    <path
      d="M45 50 Q50 54 55 50"
      stroke="#db2777"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="36" cy="49" rx="3" ry="2" fill="#fbcfe8" opacity="0.7" />
    <ellipse cx="64" cy="49" rx="3" ry="2" fill="#fbcfe8" opacity="0.7" />
    <path
      d="M30 56 Q24 66 32 76 Q38 84 32 92"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M38 58 Q36 68 42 76 Q46 84 42 92"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M46 59 Q48 69 44 78 Q42 86 48 93"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M54 59 Q52 69 56 78 Q58 86 52 93"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M62 58 Q64 68 58 76 Q54 84 60 92"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M70 56 Q76 66 68 76 Q62 84 68 92"
      stroke="#f472b6"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="14" cy="40" r="2" fill="#f9a8d4" opacity="0.6" />
    <circle cx="86" cy="34" r="2.5" fill="#f9a8d4" opacity="0.6" />
    <circle cx="90" cy="46" r="1.8" fill="#f9a8d4" opacity="0.6" />
  </svg>
);

const Key: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="34" cy="40" r="14" fill="#fbbf24" />
    <circle cx="34" cy="40" r="6" fill="#fde68a" />
    <circle cx="32" cy="38" r="1.5" fill="white" />
    <rect x="44" y="36" width="32" height="8" rx="2" fill="#fbbf24" />
    <rect x="66" y="44" width="6" height="10" rx="1.5" fill="#fbbf24" />
    <rect x="73" y="46" width="6" height="8" rx="1.5" fill="#fbbf24" />
  </svg>
);

const Kangaroo: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path
      d="M56 76 Q80 74 84 86 Q86 93 76 94"
      stroke="#b45309"
      strokeWidth="8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M44 32 C58 32 66 48 64 64 C63 78 52 86 44 86 C34 86 26 76 26 62 C25 46 32 32 44 32 Z"
      fill="#b45309"
    />
    <ellipse cx="42" cy="62" rx="12" ry="13" fill="#d97706" />
    <ellipse cx="34" cy="80" rx="9" ry="11" fill="#a16207" />
    <path d="M30 90 Q16 88 12 92 Q10 95 15 97 L46 97 Q50 95 48 91 Q46 88 38 88 Z" fill="#a16207" />
    <path
      d="M40 50 Q30 54 32 66 Q33 70 37 69"
      stroke="#b45309"
      strokeWidth="5.5"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="60" cy="28" rx="12" ry="10" fill="#b45309" />
    <ellipse cx="71" cy="30" rx="5.5" ry="4.5" fill="#a16207" />
    <path d="M56 19 Q54 6 61 6 Q66 8 64 17 Z" fill="#b45309" />
    <path d="M58 16 Q57 9 61 9 Q63 10 62 15 Z" fill="#78350f" />
    <circle cx="63" cy="26" r="2.5" fill="#1c1917" />
    <circle cx="64" cy="25" r="0.9" fill="white" />
    <circle cx="75" cy="30" r="2" fill="#1c1917" />
    <path
      d="M70 35 Q65 37 62 35"
      stroke="#78350f"
      strokeWidth="1.8"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M36 62 Q44 74 52 68"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="46" cy="64" r="5.5" fill="#d97706" />
    <path d="M45 59 Q44 53 48 54 Q50 55 49 60 Z" fill="#d97706" />
    <circle cx="48" cy="64" r="1.2" fill="#1c1917" />
    <circle cx="50" cy="66" r="1" fill="#1c1917" />
  </svg>
);

const Kid: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="30" r="13" fill="#fcd9b8" />
    <path d="M37 27 A13 13 0 0 1 63 27 L63 21 Q50 11 37 21 Z" fill="#78350f" />
    <circle cx="45" cy="30" r="2.5" fill="#1c1917" />
    <circle cx="55" cy="30" r="2.5" fill="#1c1917" />
    <circle cx="45.5" cy="29" r="0.8" fill="white" />
    <circle cx="55.5" cy="29" r="0.8" fill="white" />
    <path
      d="M45 36 Q50 40 55 36"
      stroke="#1c1917"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="41" cy="34" rx="2.5" ry="1.8" fill="#fda4af" opacity="0.6" />
    <ellipse cx="59" cy="34" rx="2.5" ry="1.8" fill="#fda4af" opacity="0.6" />
    <rect x="38" y="46" width="24" height="22" rx="6" fill="#3b82f6" />
    <path
      d="M38 50 Q30 56 32 64"
      stroke="#fcd9b8"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M62 50 Q70 56 68 64"
      stroke="#fcd9b8"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M44 68 L44 82" stroke="#fcd9b8" strokeWidth="4" fill="none" strokeLinecap="round" />
    <path d="M56 68 L56 82" stroke="#fcd9b8" strokeWidth="4" fill="none" strokeLinecap="round" />
    <rect x="38" y="80" width="12" height="6" rx="2" fill="#ef4444" />
    <rect x="50" y="80" width="12" height="6" rx="2" fill="#ef4444" />
  </svg>
);

const King: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M30 54 Q20 72 16 92 L84 92 Q80 72 70 54 Z" fill="#7f1d1d" />
    <path d="M32 56 Q50 66 68 56 L64 84 Q50 90 36 84 Z" fill="#ef4444" />
    <path
      d="M36 58 Q50 64 64 58"
      stroke="#fbbf24"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <circle cx="46" cy="68" r="1.8" fill="#fbbf24" />
    <circle cx="54" cy="68" r="1.8" fill="#fbbf24" />
    <circle cx="50" cy="40" r="17" fill="#fcd9b8" />
    <circle cx="31" cy="40" r="3.5" fill="#fcd9b8" />
    <circle cx="69" cy="40" r="3.5" fill="#fcd9b8" />
    <path d="M36 44 Q36 62 50 64 Q64 62 64 44 Q56 52 50 52 Q44 52 36 44 Z" fill="#f8fafc" />
    <circle cx="43" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="57" cy="38" r="2.5" fill="#1c1917" />
    <circle cx="44" cy="37" r="1" fill="white" />
    <circle cx="58" cy="37" r="1" fill="white" />
    <ellipse cx="50" cy="43" rx="2" ry="2.5" fill="#fda4af" />
    <path
      d="M41 33 Q43 31 45 33"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M59 33 Q57 31 55 33"
      stroke="#92400e"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M45 53 Q50 56 55 53"
      stroke="#d1d5db"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="38" cy="44" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="62" cy="44" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <rect x="34" y="22" width="32" height="7" rx="2" fill="#fbbf24" />
    <path d="M34 22 L36 10 L42 16 L50 6 L58 16 L64 10 L66 22 Z" fill="#fbbf24" />
    <circle cx="40" cy="25.5" r="2" fill="#ef4444" />
    <circle cx="50" cy="25.5" r="2.5" fill="#3b82f6" />
    <circle cx="60" cy="25.5" r="2" fill="#22c55e" />
    <rect x="48" y="0" width="4" height="8" fill="#d97706" />
    <rect x="45.5" y="2" width="9" height="4" fill="#d97706" />
  </svg>
);

const Leg: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <rect x="44" y="12" width="12" height="36" rx="6" fill="#fcd9b8" />
    <rect x="44" y="48" width="12" height="28" rx="6" fill="#fcd9b8" />
    <rect x="44" y="54" width="12" height="10" rx="3" fill="#93c5fd" />
    <ellipse cx="50" cy="82" rx="13" ry="6.5" fill="#ef4444" />
    <rect x="36" y="84" width="28" height="4" rx="2" fill="#b91c1c" />
  </svg>
);

const Leaf: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <path d="M50 14 C76 22 74 58 50 84 C26 58 24 22 50 14 Z" fill="#22c55e" />
    <path
      d="M50 84 Q50 92 45 96"
      stroke="#92400e"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 22 Q52 50 50 78"
      stroke="#15803d"
      strokeWidth="2.5"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 36 Q40 40 35 48"
      stroke="#16a34a"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 46 Q60 50 65 57"
      stroke="#16a34a"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 58 Q42 62 38 68"
      stroke="#16a34a"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path
      d="M50 68 Q58 72 62 76"
      stroke="#16a34a"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <ellipse cx="40" cy="34" rx="4" ry="8" fill="#4ade80" opacity="0.5" />
  </svg>
);

const Lion: FC<IllustrationProps> = ({ size = 48 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="drop-shadow-lg"
  >
    <circle cx="50" cy="52" r="32" fill="#d97706" />
    <circle cx="50" cy="52" r="22" fill="#fbbf24" />
    <circle cx="31" cy="30" r="7" fill="#d97706" />
    <circle cx="69" cy="30" r="7" fill="#d97706" />
    <circle cx="31" cy="30" r="3.5" fill="#fde68a" />
    <circle cx="69" cy="30" r="3.5" fill="#fde68a" />
    <circle cx="42" cy="48" r="3.5" fill="#1c1917" />
    <circle cx="58" cy="48" r="3.5" fill="#1c1917" />
    <circle cx="43" cy="46.5" r="1.2" fill="white" />
    <circle cx="59" cy="46.5" r="1.2" fill="white" />
    <polygon points="50,59 45,53 55,53" fill="#78350f" />
    <path
      d="M45 62 Q50 66 55 62"
      stroke="#78350f"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
    />
    <path d="M50 59 L50 63" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
    <path d="M36 54 L26 51" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M36 58 L26 59" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M64 54 L74 51" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
    <path d="M64 58 L74 59" stroke="#92400e" strokeWidth="2" fill="none" strokeLinecap="round" />
    <ellipse cx="40" cy="58" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
    <ellipse cx="60" cy="58" rx="3" ry="2" fill="#fca5a5" opacity="0.5" />
  </svg>
);

export const WORD_ART_CHUNK: Record<string, FC<IllustrationProps>> = {
  Hen,
  Horse,
  House,
  Igloo,
  'Ice cream': IceCream,
  Ice,
  Island,
  Iron,
  Jam,
  Juice,
  Jar,
  Jellyfish,
  Key,
  Kangaroo,
  Kid,
  King,
  Leg,
  Leaf,
  Lion,
};
