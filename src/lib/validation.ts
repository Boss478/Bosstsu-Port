import { z } from 'zod';
import { CONFIG } from '@/lib/config';

export const titleField = z
  .string()
  .trim()
  .min(1, 'กรุณาระบุชื่อ')
  .max(CONFIG.VALIDATION.TITLE_MAX);

export const slugField = z
  .string()
  .trim()
  .min(1, 'กรุณาระบุ slug')
  .regex(CONFIG.VALIDATION.SLUG_REGEX, 'รูปแบบ slug ไม่ถูกต้อง');

export const descriptionField = z
  .string()
  .trim()
  .min(1, 'กรุณาระบุรายละเอียด')
  .max(CONFIG.VALIDATION.DESCRIPTION_MAX);

export const tagsField = z.string().optional();

export const optionalString = z.string().optional();

export function parseWordArray(str?: string | null): string[] {
  if (!str || !str.trim()) return [];
  return str
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export function parseNumberArray(str?: string | null): number[] {
  if (!str || !str.trim()) return [];
  return str
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => !isNaN(n));
}
