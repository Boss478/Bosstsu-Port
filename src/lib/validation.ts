import { z } from 'zod';

export const titleField = z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100);

export const descriptionField = z
  .string()
  .trim()
  .min(1, 'กรุณาระบุรายละเอียด')
  .max(500);

export const slugField = z
  .string()
  .trim()
  .min(1, 'กรุณาระบุ slug')
  .regex(/^[a-z0-9-]+$/, 'รูปแบบ slug ไม่ถูกต้อง');

export const tagsStrField = z.string().optional();

export const coverImageField = z.string().optional();