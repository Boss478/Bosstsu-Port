export function formatNumber(n: number): string {
  return n.toLocaleString('th-TH');
}

export function percentage(part: number, total: number): string {
  if (!total) return '0%';
  return `${((part / total) * 100).toFixed(1)}%`;
}
