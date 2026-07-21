'use client';

import type { ConnectionStatus } from '@/lib/use-sse';

interface ConnectionDotProps {
  status: ConnectionStatus;
  showLabel?: boolean;
  forced?: boolean;
}

const STATUS_STYLES: Record<ConnectionStatus, { dot: string; label: string }> = {
  connected: { dot: 'bg-green-400 shadow-[0_0_6px_rgba(74,222,128,0.5)]', label: 'เชื่อมต่อ' },
  polling: { dot: 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)]', label: 'กำลังเชื่อมต่อ...' },
  disconnected: { dot: 'bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]', label: 'ขาดการเชื่อมต่อ' },
};

export default function ConnectionDot({ status, showLabel = true, forced = false }: ConnectionDotProps) {
  const style = STATUS_STYLES[status];

  return (
    <div className="inline-flex items-center gap-1.5" title={style.label}>
      <span className={`w-2 h-2 rounded-full ${style.dot} transition-colors`} />
      {showLabel && (
        <span className="text-[10px] text-zinc-400 dark:text-zinc-500">{style.label}</span>
      )}
      {forced && (
        <span className="text-[10px] text-amber-500 font-medium" title="ครูกำหนดค่าประสิทธิภาพ">
          ⚙
        </span>
      )}
    </div>
  );
}
