'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import { saveFile } from '@/lib/upload';
import { formatError } from '@/lib/error-code';
import { parseTagString } from '@/lib/format';
import { titleField, descriptionField, tagsField, optionalString } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError, sanitizeHtml, revalidateContentPaths, createTogglePublished, createDeleteItem } from '@/lib/admin-crud';

const TYPE_OPTIONS = [
  'Article', 'Presentation', 'Video', 'Lesson Plan',
  'Sheet', 'Worksheet', 'Scratch', 'Interactive'
] as const;

const ALLOWED_FILE_TYPES: Record<string, string[]> = {
  'Lesson Plan': ['application/pdf'],
  'Presentation': ['application/pdf'],
  'Sheet': ['image/jpeg', 'image/png', 'application/pdf'],
  'Worksheet': ['image/jpeg', 'image/png', 'application/pdf'],
};

function validateFileType(file: File, allowed: string[]): boolean {
  if (!file || file.size === 0) return allowed.length === 0;
  return allowed.includes(file.type);
}

const learningBaseSchema = z.object({
  title: titleField,
  description: descriptionField,
  subject: z.string().trim().min(1, 'กรุณาเลือกวิชา'),
  type: z.string().trim().min(1, 'กรุณาเลือกประเภท'),
  tagsStr: tagsField,
}).strict();

const ADMIN = ROUTES.ADMIN.RESOURCES;
const PUBLIC = ROUTES.PUBLIC.RESOURCES;

export const togglePublished = createTogglePublished(Learning, ADMIN, PUBLIC);
export const deleteLearningResource = createDeleteItem(Learning, ADMIN, PUBLIC);

function buildSchema(type: string, hasFileField: boolean) {
  return hasFileField
    ? learningBaseSchema.extend({
        link: optionalString,
        content: optionalString,
        embedCode: optionalString,
        youtubeId: optionalString,
        canvaEmbed: optionalString,
        file: z.instanceof(File).optional(),
      })
    : learningBaseSchema.extend({
        link: optionalString,
        content: optionalString,
        embedCode: optionalString,
        youtubeId: optionalString,
        canvaEmbed: optionalString,
      });
}

export async function createLearningResource(formData: FormData) {
  return withAuth(async () => {
    const type = formData.get('type') as string;
    if (!TYPE_OPTIONS.includes(type as typeof TYPE_OPTIONS[number])) {
      return { error: 'ประเภทไม่ถูกต้อง' };
    }

    const allowedFileTypes = ALLOWED_FILE_TYPES[type] || [];
    const hasFileField = allowedFileTypes.length > 0;
    const learningSchema = buildSchema(type, hasFileField);

    const parsed = learningSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      type,
      link: formData.get('link') || '',
      content: formData.get('content') || '',
      embedCode: formData.get('embedCode') || '',
      youtubeId: formData.get('youtubeId') || '',
      canvaEmbed: formData.get('canvaEmbed') || '',
      tagsStr: formData.get('tags') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailFile = formData.get('thumbnail') as File;
    const resourceFile = formData.get('resourceFile') as File;

    try {
      await dbConnect();
      const tags = parseTagString(tagsStr);

      let thumbnail: string | undefined;
      if (thumbnailFile && thumbnailFile.size > 0) {
        thumbnail = await saveFile(thumbnailFile, 'learning');
      }

      let fileUrl: string | undefined;
      if (resourceFile && resourceFile.size > 0) {
        if (!validateFileType(resourceFile, allowedFileTypes)) {
          return { error: `ประเภทไฟล์ไม่ถูกต้อง อนุญาต: ${allowedFileTypes.join(', ')}` };
        }
        fileUrl = await saveFile(resourceFile, 'learning');
      }

      await Learning.create({
        title, description, subject, type,
        link: link || undefined,
        tags, published, thumbnail,
        content: sanitizeHtml(content),
        embedCode: sanitizeHtml(embedCode),
        youtubeId: youtubeId || undefined,
        canvaEmbed: canvaEmbed || undefined,
        fileUrl,
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

    const allowedFileTypes = ALLOWED_FILE_TYPES[type] || [];
    const hasFileField = allowedFileTypes.length > 0;
    const learningSchema = buildSchema(type, hasFileField);

    const parsed = learningSchema.safeParse({
      title: formData.get('title'),
      description: formData.get('description'),
      subject: formData.get('subject'),
      type,
      link: formData.get('link') || '',
      content: formData.get('content') || '',
      embedCode: formData.get('embedCode') || '',
      youtubeId: formData.get('youtubeId') || '',
      canvaEmbed: formData.get('canvaEmbed') || '',
      tagsStr: formData.get('tags') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailFile = formData.get('thumbnail') as File;
    const resourceFile = formData.get('resourceFile') as File;

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

      if (thumbnailFile && thumbnailFile.size > 0) {
        updateData.thumbnail = await saveFile(thumbnailFile, 'learning');
      }

      if (resourceFile && resourceFile.size > 0) {
        if (!validateFileType(resourceFile, allowedFileTypes)) {
          return { error: `ประเภทไฟล์ไม่ถูกต้อง อนุญาต: ${allowedFileTypes.join(', ')}` };
        }
        updateData.fileUrl = await saveFile(resourceFile, 'learning');
      }

      await Learning.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update learning', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
