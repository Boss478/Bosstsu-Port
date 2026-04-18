'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Learning from '@/models/Learning';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { createErrorResponse } from '@/lib/error-code';
import { z } from 'zod';

const learningSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  subject: z.string().min(1, 'Subject is required'),
  type: z.string().min(1, 'Type is required'),
  link: z.string().url('Invalid URL format'),
  tagsStr: z.string().optional(),
});

function formatError(err: ReturnType<typeof createErrorResponse>): string {
  return `${err.code}: ${err.message} (${err.translation})`;
}

export async function createLearningResource(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  const parsed = learningSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    subject: formData.get('subject'),
    type: formData.get('type'),
    link: formData.get('link'),
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, subject, type, link, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  await dbConnect();

  try {
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    let thumbnail: string | undefined;
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnail = await saveFile(thumbnailFile, 'learning');
    }

    await Learning.create({
      title,
      description,
      subject,
      type,
      link,
      tags,
      published,
      thumbnail,
    });
  } catch (error: unknown) {
    console.error('Create learning error:', error);
    return { error: formatError(createErrorResponse('DB01')) };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}

export async function updateLearningResource(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  const parsed = learningSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    subject: formData.get('subject'),
    type: formData.get('type'),
    link: formData.get('link'),
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, subject, type, link, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  await dbConnect();

  try {
    const updateData: Record<string, unknown> = {
      title,
      description,
      subject,
      type,
      link,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
    };

    if (thumbnailFile && thumbnailFile.size > 0) {
      updateData.thumbnail = await saveFile(thumbnailFile, 'learning');
    }

    await Learning.findByIdAndUpdate(id, updateData);
  } catch (error: unknown) {
    console.error('Update learning error:', error);
    return { error: formatError(createErrorResponse('DB02')) };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}

export async function deleteLearningResource(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  await dbConnect();
  try {
    await Learning.findByIdAndDelete(id);
  } catch (error: unknown) {
    console.error('Delete learning error:', error);
    return { error: formatError(createErrorResponse('DB03')) };
  }

  revalidatePath('/admin/resources');
  revalidatePath('/resources');
  return { error: undefined };
}