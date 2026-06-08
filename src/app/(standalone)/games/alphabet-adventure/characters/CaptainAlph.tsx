'use client';

export default function CaptainAlph({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Hat */}
      <rect x="28" y="18" width="44" height="8" rx="2" fill="#8b5cf6" />
      <rect x="35" y="8" width="30" height="14" rx="4" fill="#7c3aed" />
      <text
        x="50"
        y="18"
        textAnchor="middle"
        fontSize="10"
        fontWeight="900"
        fill="white"
        fontFamily="sans-serif"
      >
        A
      </text>

      {/* Face */}
      <circle cx="50" cy="44" r="22" fill="#fde68a" />

      {/* Eyes */}
      <circle cx="42" cy="40" r="4" fill="#1c1917" />
      <circle cx="58" cy="40" r="4" fill="#1c1917" />
      <circle cx="43" cy="38" r="1.5" fill="white" />
      <circle cx="59" cy="38" r="1.5" fill="white" />

      {/* Smile */}
      <path
        d="M40 52 Q50 60 60 52"
        stroke="#92400e"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Blush */}
      <ellipse cx="34" cy="48" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />
      <ellipse cx="66" cy="48" rx="4" ry="2.5" fill="#fca5a5" opacity="0.5" />

      {/* Body */}
      <rect x="35" y="64" width="30" height="20" rx="6" fill="#7c3aed" />

      {/* Collar */}
      <path d="M42 64 L50 72 L58 64" stroke="#6d28d9" strokeWidth="3" fill="none" />
      <circle cx="50" cy="72" r="3" fill="#fbbf24" />

      {/* Star badge */}
      <text x="50" y="77" textAnchor="middle" fontSize="8" fill="white">
        ⭐
      </text>
    </svg>
  );
}
