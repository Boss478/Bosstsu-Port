function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function clampDay(day: number, year: number, month: number): number {
  return Math.min(day, daysInMonth(year, month));
}

export function getPeriodRange(payDay: number, monthKey: string): { start: Date; end: Date } {
  const [y, m] = monthKey.split('-').map(Number);
  const mi = m - 1;
  const startDay = clampDay(payDay, y, mi);
  const start = new Date(y, mi, startDay, 0, 0, 0, 0);

  const nextMonth = m === 12 ? 1 : m + 1;
  const nextYear = m === 12 ? y + 1 : y;
  const nextStartDay = clampDay(payDay, nextYear, nextMonth - 1);
  const end = new Date(nextYear, nextMonth - 1, nextStartDay - 1, 23, 59, 59, 999);

  return { start, end };
}

export function getCurrentPeriodKey(payDay: number, now?: Date): string {
  const d = now || new Date();
  const year = d.getFullYear();
  const month = d.getMonth();
  const today = d.getDate();
  const effectivePayDay = clampDay(payDay, year, month);

  if (today < effectivePayDay) {
    const prev = new Date(year, month - 1, 1);
    return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
  }

  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function getPreviousPeriodKey(_payDay: number, monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const prev = new Date(y, m - 2, 1);
  return `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`;
}

export function getNextPeriodKey(_payDay: number, monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  const next = new Date(y, m, 1);
  return `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`;
}

export function formatPeriodLabel(payDay: number, monthKey: string): string {
  const { start, end } = getPeriodRange(payDay, monthKey);
  const fmt: Intl.DateTimeFormatOptions = { month: 'long', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', fmt);
  const endStr = end.toLocaleDateString('en-US', { ...fmt, year: 'numeric' });
  return `${startStr} — ${endStr}`;
}

export function isCurrentPeriod(payDay: number, monthKey: string): boolean {
  const current = getCurrentPeriodKey(payDay);
  return current === monthKey;
}

export function isCalendarMode(payDay: number | null): payDay is null {
  return payDay === null;
}

export const PAY_DAY_KEY = 'boss478-pay-day';
