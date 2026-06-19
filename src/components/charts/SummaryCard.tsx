'use client';

import GlassCard from '@/components/GlassCard';
import TrendBadge from './TrendBadge';

export default function SummaryCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend?: number;
}) {
  return (
    <GlassCard variant="compact">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center">
        {value}
        {trend !== undefined && <TrendBadge value={trend} />}
      </p>
    </GlassCard>
  );
}
