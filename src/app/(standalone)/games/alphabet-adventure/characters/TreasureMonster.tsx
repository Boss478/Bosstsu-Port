'use client';

export default function TreasureMonster({ size = 80 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="drop-shadow-lg"
    >
      {/* Crown */}
      <path d="M30 28 L35 18 L42 25 L50 15 L58 25 L65 18 L70 28Z" fill="#fbbf24" />
      <path d="M30 28 L70 28 L70 32 L30 32Z" fill="#f59e0b" />
      <circle cx="35" cy="26" r="2" fill="#ef4444" />
      <circle cx="50" cy="23" r="2" fill="#3b82f6" />
      <circle cx="65" cy="26" r="2" fill="#22c55e" />

      {/* Body */}
      <ellipse cx="50" cy="62" rx="32" ry="30" fill="#22c55e" />
      <ellipse cx="50" cy="62" rx="32" ry="30" fill="url(#monster-gradient)" opacity="0.3" />

      {/* Gradient */}
      <defs>
        <radialGradient id="monster-gradient" cx="40%" cy="35%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
      </defs>

      {/* Belly */}
      <ellipse cx="50" cy="65" rx="18" ry="15" fill="#86efac" opacity="0.4" />

      {/* Hands */}
      <circle cx="28" cy="70" r="7" fill="#22c55e" />
      <circle cx="72" cy="70" r="7" fill="#22c55e" />

      {/* Feet */}
      <ellipse cx="38" cy="88" rx="10" ry="6" fill="#15803d" />
      <ellipse cx="62" cy="88" rx="10" ry="6" fill="#15803d" />

      {/* Left eye (big) */}
      <ellipse cx="40" cy="52" rx="10" ry="12" fill="white" />
      <circle cx="40" cy="52" r="6" fill="#1c1917" />
      <circle cx="42" cy="49" r="2.5" fill="white" />

      {/* Right eye (small) */}
      <ellipse cx="60" cy="56" rx="7" ry="8" fill="white" />
      <circle cx="60" cy="56" r="4" fill="#1c1917" />
      <circle cx="61" cy="54" r="1.5" fill="white" />

      {/* Grin */}
      <path
        d="M38 68 Q50 80 62 68"
        stroke="#064e3b"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
      />

      {/* Tooth */}
      <rect x="46" y="68" width="4" height="5" rx="1" fill="white" />
      <rect x="51" y="68" width="4" height="5" rx="1" fill="white" />

      {/* Coin */}
      <circle cx="20" cy="78" r="6" fill="#fbbf24" />
      <circle cx="20" cy="78" r="4.5" fill="#f59e0b" />
      <text x="20" y="81" textAnchor="middle" fontSize="6" fontWeight="900" fill="#92400e">
        $
      </text>

      {/* Gold sparkles */}
      <text x="78" y="52" textAnchor="middle" fontSize="7" fill="#fbbf24">
        ✦
      </text>
      <text x="30" y="24" textAnchor="middle" fontSize="5" fill="#fbbf24">
        ✦
      </text>
    </svg>
  );
}
