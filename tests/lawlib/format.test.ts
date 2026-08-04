// ===========================================================================
// LawLib — formatThaiBEDate contract: BE 'YYYY-MM-DD' → 'D MMMM YYYY'
// with Thai month names and NO year shift (the input year is ALREADY
// Buddhist-era — a +543 shift here would be a double conversion bug).
// ===========================================================================

import { describe, it, expect } from 'vitest';
import { formatThaiBEDate } from '@/lib/lawlib/format';

describe('formatThaiBEDate', () => {
  it('formats a BE date with the Thai month name', () => {
    expect(formatThaiBEDate('2542-08-19')).toBe('19 สิงหาคม 2542');
  });

  it('keeps the BE year verbatim — NO +543 shift (2550 stays 2550)', () => {
    expect(formatThaiBEDate('2550-08-15')).toBe('15 สิงหาคม 2550');
  });

  it('renders day and year without leading zeros', () => {
    expect(formatThaiBEDate('2540-01-05')).toBe('5 มกราคม 2540');
  });

  it('covers the full Thai month-name set', () => {
    const months = [
      'มกราคม',
      'กุมภาพันธ์',
      'มีนาคม',
      'เมษายน',
      'พฤษภาคม',
      'มิถุนายน',
      'กรกฎาคม',
      'สิงหาคม',
      'กันยายน',
      'ตุลาคม',
      'พฤศจิกายน',
      'ธันวาคม',
    ];
    for (let i = 1; i <= 12; i++) {
      const mm = String(i).padStart(2, '0');
      expect(formatThaiBEDate(`2542-${mm}-01`)).toBe(`1 ${months[i - 1]} 2542`);
    }
  });

  it('returns input verbatim for unparseable strings', () => {
    expect(formatThaiBEDate('')).toBe('');
    expect(formatThaiBEDate('2567')).toBe('2567');
    expect(formatThaiBEDate('ไม่ทราบ')).toBe('ไม่ทราบ');
    expect(formatThaiBEDate('19 สิงหาคม 2542')).toBe('19 สิงหาคม 2542');
  });

  it('returns input verbatim for out-of-range months/days', () => {
    expect(formatThaiBEDate('2542-13-01')).toBe('2542-13-01');
    expect(formatThaiBEDate('2542-00-10')).toBe('2542-00-10');
    expect(formatThaiBEDate('2542-02-32')).toBe('2542-02-32');
    expect(formatThaiBEDate('2542-02-00')).toBe('2542-02-00');
  });
});
