export default function ProgressBar({ current, total }: { current: number; total: number }) {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <div className="h-2 rounded-full bg-white/30 dark:bg-slate-700/30 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300 ease-out"
        style={{
          width: `${pct}%`,
          background: 'linear-gradient(90deg, #2EC4B6, #C8A44E)',
        }}
      />
    </div>
  );
}
