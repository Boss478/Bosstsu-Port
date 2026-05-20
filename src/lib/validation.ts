import { z } from 'zod';
import { CONFIG } from '@/lib/config';

export const titleField = z.string().trim()
  .min(1, 'กรุณาระบุชื่อ')
  .max(CONFIG.VALIDATION.TITLE_MAX);

export const slugField = z.string().trim()
  .min(1, 'กรุณาระบุ slug')
  .regex(CONFIG.VALIDATION.SLUG_REGEX, 'รูปแบบ slug ไม่ถูกต้อง');

export const descriptionField = z.string().trim()
  .min(1, 'กรุณาระบุรายละเอียด')
  .max(CONFIG.VALIDATION.DESCRIPTION_MAX);

export const tagsField = z.string().optional();

export const optionalString = z.string().optional();
