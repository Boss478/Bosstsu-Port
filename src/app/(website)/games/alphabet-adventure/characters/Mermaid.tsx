"use client";

export default function Mermaid({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Hair back */}
      <path d="M26 40 Q20 30 28 22 Q35 16 50 16 Q65 16 72 22 Q80 30 74 40" fill="#ec4899" />
      <path d="M22 44 Q18 50 20 60 Q22 68 26 64 Q24 56 26 48Z" fill="#db2777" />
      <path d="M78 44 Q82 50 80 60 Q78 68 74 64 Q76 56 74 48Z" fill="#db2777" />

      {/* Face */}
      <circle cx="50" cy="44" r="20" fill="#fde68a" />

      {/* Eyes */}
      <ellipse cx="42" cy="40" rx="4" ry="5" fill="white" />
      <ellipse cx="58" cy="40" rx="4" ry="5" fill="white" />
      <circle cx="43" cy="41" r="3" fill="#1c1917" />
      <circle cx="59" cy="41" r="3" fill="#1c1917" />
      <circle cx="44" cy="39" r="1.2" fill="white" />
      <circle cx="60" cy="39" r="1.2" fill="white" />

      {/* Eyelashes */}
      <path d="M38 35 L36 32" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M42 34 L41 31" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M62 34 L59 31" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M66 35 L64 32" stroke="#1c1917" strokeWidth="1.5" strokeLinecap="round" />

      {/* Blush */}
      <ellipse cx="34" cy="48" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="66" cy="48" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />

      {/* Smile */}
      <path d="M43 52 Q50 58 57 52" stroke="#be123c" strokeWidth="2" strokeLinecap="round" fill="none" />

      {/* Star tiara */}
      <text x="50" y="22" textAnchor="middle" fontSize="10">⭐</text>

      {/* Shell top */}
      <path d="M35 62 Q40 56 45 62 Q42 68 35 62Z" fill="#c084fc" />
      <path d="M55 62 Q60 56 65 62 Q58 68 55 62Z" fill="#c084fc" />
      <path d="M44 62 L56 62" stroke="#a855f7" strokeWidth="1" />

      {/* Body */}
      <path d="M38 62 L44 82 L56 82 L62 62Z" fill="#fde68a" />

      {/* Tail */}
      <path d="M44 82 L38 95 Q50 100 62 95 L56 82Z" fill="#14b8a6" />

      {/* Tail fin */}
      <ellipse cx="50" cy="96" rx="14" ry="5" fill="#0d9488" />
      <path d="M38 95 L30 98 L36 92Z" fill="#0d9488" />
      <path d="M62 95 L70 98 L64 92Z" fill="#0d9488" />

      {/* Scales */}
      <path d="M42 86 Q46 82 50 86 Q46 90 42 86Z" fill="#2dd4bf" opacity="0.5" />
      <path d="M50 86 Q54 82 58 86 Q54 90 50 86Z" fill="#2dd4bf" opacity="0.5" />
      <path d="M46 90 Q50 86 54 90 Q50 94 46 90Z" fill="#2dd4bf" opacity="0.5" />
    </svg>
  );
}
