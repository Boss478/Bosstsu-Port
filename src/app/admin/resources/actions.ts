'use server';

import { revalidatePath } from 'next/cache';
import DOMPurify from 'isomorphic-dompurify';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { formatError } from '@/lib/error-code';
import { z } from 'zod';

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

const learningBaseSchema = z.object({
  title: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100),
  description: z.string().trim().min(1, 'กรุณาระบุรายละเอียด').max(500),
  subject: z.string().trim().min(1, 'กรุณาเลือกวิชา'),
  type: z.string().trim().min(1, 'กรุณาเลือกประเภท'),
  tagsStr: z.string().optional(),
}).strict();

function validateFileType(file: File, allowed: string[]): boolean {
  if (!file || file.size === 0) return allowed.length === 0;
  return allowed.includes(file.type);
}

export async function createLearningResource(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const type = formData.get('type') as string;
  if (!TYPE_OPTIONS.includes(type as typeof TYPE_OPTIONS[number])) {
    return { error: 'ประเภทไม่ถูกต้อง' };
  }

  const allowedFileTypes = ALLOWED_FILE_TYPES[type] || [];
  const hasFileField = allowedFileTypes.length > 0;

  const learningSchema = hasFileField
    ? learningBaseSchema.extend({
        link: z.string().optional(),
        content: z.string().optional(),
        embedCode: z.string().optional(),
        youtubeId: z.string().optional(),
        canvaEmbed: z.string().optional(),
        file: hasFileField ? z.instanceof(File).optional() : z.undefined(),
      })
    : learningBaseSchema.extend({
        link: z.string().optional(),
        content: z.string().optional(),
        embedCode: z.string().optional(),
        youtubeId: z.string().optional(),
        canvaEmbed: z.string().optional(),
      });

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

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;
  const resourceFile = formData.get('resourceFile') as File;

  try {
    await dbConnect();
    const tags = tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

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
      title,
      description,
      subject,
      type,
      link: link || undefined,
      tags,
      published,
      thumbnail,
      content: content ? DOMPurify.sanitize(content) : undefined,
      embedCode: embedCode ? DOMPurify.sanitize(embedCode) : undefined,
      youtubeId: youtubeId || undefined,
      canvaEmbed: canvaEmbed || undefined,
      fileUrl,
    });
  } catch (error: unknown) {
    console.error('Create learning error:', error);
    return { error: formatError('DB01') };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}

export async function updateLearningResource(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const type = formData.get('type') as string;
  if (!TYPE_OPTIONS.includes(type as typeof TYPE_OPTIONS[number])) {
    return { error: 'ประเภทไม่ถูกต้อง' };
  }

  const allowedFileTypes = ALLOWED_FILE_TYPES[type] || [];
  const hasFileField = allowedFileTypes.length > 0;

  const learningSchema = hasFileField
    ? learningBaseSchema.extend({
        link: z.string().optional(),
        content: z.string().optional(),
        embedCode: z.string().optional(),
        youtubeId: z.string().optional(),
        canvaEmbed: z.string().optional(),
        file: hasFileField ? z.instanceof(File).optional() : z.undefined(),
      })
    : learningBaseSchema.extend({
        link: z.string().optional(),
        content: z.string().optional(),
        embedCode: z.string().optional(),
        youtubeId: z.string().optional(),
        canvaEmbed: z.string().optional(),
      });

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

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, subject, link, content, embedCode, youtubeId, canvaEmbed, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;
  const resourceFile = formData.get('resourceFile') as File;

  try {
    await dbConnect();
    const updateData: Record<string, unknown> = {
      title,
      description,
      subject,
      type,
      link: link || undefined,
      tags: tagsStr ? tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
      published,
      content: content ? DOMPurify.sanitize(content) : undefined,
      embedCode: embedCode ? DOMPurify.sanitize(embedCode) : undefined,
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
    console.error('Update learning error:', error);
    return { error: formatError('DB02') };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}

export async function deleteLearningResource(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await Learning.findByIdAndDelete(id);
  } catch (error: unknown) {
    console.error('Delete learning error:', error);
    return { error: formatError('DB03') };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}
