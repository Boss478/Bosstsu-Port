'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import { parseTagString } from '@/lib/format';
import { titleField, descriptionField, tagsField, optionalString } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError, sanitizeHtml, revalidateContentPaths, createTogglePublished, createDeleteItem } from '@/lib/admin-crud';

const TYPE_OPTIONS = [
  'Article', 'Presentation', 'Video', 'Lesson Plan',
  'Sheet', 'Worksheet', 'Scratch', 'Interactive'
] as const;

const learningSchema = z.object({
  title: titleField,
  description: descriptionField,
  subject: z.string().trim().min(1, 'กรุณาเลือกวิชา'),
  type: z.string().trim().min(1, 'กรุณาเลือกประเภท'),
  tagsStr: tagsField,
  link: optionalString,
  content: optionalString,
  embedCode: optionalString,
  youtubeId: optionalString,
  canvaEmbed: optionalString,
}).strict();

const ADMIN = ROUTES.ADMIN.RESOURCES;
const PUBLIC = ROUTES.PUBLIC.RESOURCES;

export const togglePublished = createTogglePublished(Learning, ADMIN, PUBLIC);
export const deleteLearningResource = createDeleteItem(Learning, ADMIN, PUBLIC);

export async function createLearningResource(formData: FormData) {
  return withAuth(async () => {
    const type = formData.get('type') as string;
    if (!TYPE_OPTIONS.includes(type as typeof TYPE_OPTIONS[number])) {
      return { error: 'ประเภทไม่ถูกต้อง' };
    }

    const parsed = learningSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      type,
      tagsStr: formData.get('tags') || '',
      link: formData.get('link') || '',
      content: formData.get('content') || '',
      embedCode: formData.get('embedCode') || '',
      youtubeId: formData.get('youtubeId') || '',
      canvaEmbed: formData.get('canvaEmbed') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const fileUrl = formData.get('fileUrl') as string;

    try {
      await dbConnect();
      await Learning.create({
        title, description, subject, type,
        link: link || undefined,
        tags: parseTagString(tagsStr),
        published,
        thumbnail: thumbnailUrl || undefined,
        fileUrl: fileUrl || undefined,
        content: sanitizeHtml(content),
        embedCode: sanitizeHtml(embedCode),
        youtubeId: youtubeId || undefined,
        canvaEmbed: canvaEmbed || undefined,
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Create learning', 'DB01');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}

export async function updateLearningResource(id: string, formData: FormData) {
  return withAuth(async () => {
    const type = formData.get('type') as string;
    if (!TYPE_OPTIONS.includes(type as typeof TYPE_OPTIONS[number])) {
      return { error: 'ประเภทไม่ถูกต้อง' };
    }

    const parsed = learningSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      type,
      tagsStr: formData.get('tags') || '',
      link: formData.get('link') || '',
      content: formData.get('content') || '',
      embedCode: formData.get('embedCode') || '',
      youtubeId: formData.get('youtubeId') || '',
      canvaEmbed: formData.get('canvaEmbed') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const fileUrl = formData.get('fileUrl') as string;

    try {
      await dbConnect();
      const updateData: Record<string, unknown> = {
        title, description, subject, type,
        link: link || undefined,
        tags: parseTagString(tagsStr),
        published,
        content: sanitizeHtml(content),
        embedCode: sanitizeHtml(embedCode),
        youtubeId: youtubeId || undefined,
        canvaEmbed: canvaEmbed || undefined,
      };

      if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;
      if (fileUrl) updateData.fileUrl = fileUrl;

      await Learning.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update learning', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
