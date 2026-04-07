'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { z } from 'zod';

const gameSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().min(1, 'Description is required').max(500),
  category: z.string().min(1, 'Category is required'),
  playUrl: z.string().min(1, 'Play URL is required').refine((url) => url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://'), 'Must be a valid URL or relative path'),
  instructions: z.string().optional(),
  tagsStr: z.string().optional(),
});

export async function createGame(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  const parsed = gameSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    playUrl: formData.get('playUrl'),
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, category, playUrl, instructions, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  await dbConnect();

  try {
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    let thumbnail = '';
    if (thumbnailFile && thumbnailFile.size > 0) {
      thumbnail = await saveFile(thumbnailFile, 'games');
    }

    if (!thumbnail) {
      return { error: 'Thumbnail image is required' };
    }

    await Game.create({
      title,
      description,
      category,
      playUrl,
      instructions: instructions || undefined,
      tags,
      published,
      thumbnail,
    });
  } catch (error: unknown) {
    console.error('Create game error:', error);
    return { error: 'ไม่สามารถสร้างเกมได้' };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}

export async function updateGame(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  const parsed = gameSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    playUrl: formData.get('playUrl'),
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, category, playUrl, instructions, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  await dbConnect();

  try {
    const updateData: Record<string, unknown> = {
      title,
      description,
      category,
      playUrl,
      instructions: instructions || undefined,
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
    };

    if (thumbnailFile && thumbnailFile.size > 0) {
      updateData.thumbnail = await saveFile(thumbnailFile, 'games');
    }

    await Game.findByIdAndUpdate(id, updateData);
  } catch (error: unknown) {
    console.error('Update game error:', error);
    return { error: 'ไม่สามารถอัปเดตเกมได้' };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}

export async function deleteGame(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  await dbConnect();
  try {
    await Game.findByIdAndDelete(id);
  } catch (error: unknown) {
    console.error('Delete game error:', error);
    return { error: 'ไม่สามารถลบเกมได้' };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}
