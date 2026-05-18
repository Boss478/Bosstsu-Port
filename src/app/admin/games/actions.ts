'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { formatError } from '@/lib/error-code';
import { slugify, parseTagString } from '@/lib/format';
import { z } from 'zod';
import DOMPurify from 'isomorphic-dompurify';

const gameSchema = z.object({
  title: z.string().trim().min(1, 'กรุณาระบุชื่อ').max(100),
  description: z.string().trim().min(1, 'กรุณาระบุรายละเอียด').max(500),
  category: z.string().trim().min(1, 'กรุณาระบุหมวดหมู่'),
  playUrl: z.string().optional(),
  htmlContent: z.string().optional(),
  instructions: z.string().optional(),
  tagsStr: z.string().optional(),
  gameType: z.enum(['url', 'html']),
}).strict().refine((data) => {
  if (data.gameType === 'url') {
    return data.playUrl && (
      data.playUrl.startsWith('/') ||
      data.playUrl.startsWith('http://') ||
      data.playUrl.startsWith('https://')
    );
  }
  return true;
}, {
  message: 'URL ต้องเป็นลิงก์ที่ถูกต้องหรือเส้นทางที่ขึ้นต้นด้วย /',
  path: ['playUrl'],
}).refine((data) => {
  if (data.gameType === 'html') {
    return data.htmlContent && data.htmlContent.trim().length > 0;
  }
  return true;
}, {
  message: 'เนื้อหา HTML จำเป็นสำหรับเกมแบบ One-page HTML',
  path: ['htmlContent'],
});

export async function createGame(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const parsed = gameSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    playUrl: formData.get('playUrl') || '',
    htmlContent: formData.get('htmlContent') || '',
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
    gameType: formData.get('gameType'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, category, playUrl, htmlContent, instructions, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  // Generate slug from title
  const slug = slugify(title);

  // Validate thumbnail BEFORE any file operations
  if (!thumbnailFile || thumbnailFile.size === 0) {
    return { error: formatError('U03') };
  }

  try {
    await dbConnect();
    const tags = parseTagString(tagsStr);
    const thumbnail = await saveFile(thumbnailFile, 'games');

    await Game.create({
      title,
      slug,
      description,
      category,
      playUrl: playUrl || '',
      instructions: instructions || undefined,
      htmlContent: htmlContent ? DOMPurify.sanitize(htmlContent) : undefined,
      tags,
      published,
      thumbnail,
    });
  } catch (error: unknown) {
    console.error('Create game error:', error);
    return { error: formatError('DB01') };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}

export async function updateGame(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  const parsed = gameSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    playUrl: formData.get('playUrl') || '',
    htmlContent: formData.get('htmlContent') || '',
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
    gameType: formData.get('gameType'),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, category, playUrl, htmlContent, instructions, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  try {
    await dbConnect();
    const updateData: Record<string, unknown> = {
      title,
      description,
      category,
      playUrl: playUrl || '',
      instructions: instructions || undefined,
      htmlContent: htmlContent ? DOMPurify.sanitize(htmlContent) : undefined,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
    };

    if (thumbnailFile && thumbnailFile.size > 0) {
      updateData.thumbnail = await saveFile(thumbnailFile, 'games');
    }

    await Game.findByIdAndUpdate(id, updateData);
  } catch (error: unknown) {
    console.error('Update game error:', error);
    return { error: formatError('DB02') };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}

export async function deleteGame(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError('401') };

  try {
    await dbConnect();
    await Game.findByIdAndDelete(id);
  } catch (error: unknown) {
    console.error('Delete game error:', error);
    return { error: formatError('DB03') };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}
