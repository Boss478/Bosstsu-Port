'use client';

import { useMemo } from 'react';
import QRCodeLib from 'qrcode';

interface QRSessionCodeProps {
  value: string;
  size?: number;
  className?: string;
}

export default function QRSessionCode({ value, size = 180, className }: QRSessionCodeProps) {
  const rects = useMemo(() => {
    if (!value) return { rects: [], count: 0 };
    try {
      const qr = QRCodeLib.create(value, { errorCorrectionLevel: 'M' });
      const count = qr.modules.size;
      const result: { x: number; y: number }[] = [];
      for (let row = 0; row < count; row++) {
        for (let col = 0; col < count; col++) {
          if (qr.modules.get(row, col)) result.push({ x: col, y: row });
        }
      }
      return { rects: result, count };
    } catch {
      return { rects: [], count: 0 };
    }
  }, [value]);

  if (!value || rects.count === 0) return null;

  const padding = 4;
  const totalModules = rects.count + padding * 2;
  const moduleSize = size / totalModules;
  const r = Math.max(1, moduleSize * 0.3);

  return (
    <div className={`flex justify-center ${className ?? ''}`}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="currentColor"
        aria-hidden="true"
        className="text-blue-600 dark:text-blue-400"
      >
        <rect width={size} height={size} fill="transparent" />
        {rects.rects.map(({ x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={(x + padding) * moduleSize}
            y={(y + padding) * moduleSize}
            width={moduleSize}
            height={moduleSize}
            rx={r}
            ry={r}
          />
        ))}
      </svg>
    </div>
  );
}
