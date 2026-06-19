export default function TrendBadge({ value }: { value: number }) {
  if (value === 0) return null;
  const up = value > 0;
  return (
    <span className={`text-xs font-medium ml-1.5 ${up ? 'text-green-500' : 'text-red-400'}`}>
      {up ? '\u2191' : '\u2193'} {Math.abs(value)}%
    </span>
  );
}
