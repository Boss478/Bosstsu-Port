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
  genre: z.string().min(1, 'Genre is required'),
  playUrl: z.string().url('Invalid URL format'),
  instructions: z.string().optional(),
  tagsStr: z.string().optional(),
});

export async function createGame(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  const parsed = gameSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    genre: formData.get('genre'),
    playUrl: formData.get('playUrl'),
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, genre, playUrl, instructions, tagsStr } = parsed.data;
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
      genre,
      playUrl,
      instructions: instructions || undefined,
      tags,
      published,
      thumbnail,
    });
  } catch (error: unknown) {
    console.error('Create game error:', error);
    return { error: (error as Error).message || 'Failed to create game' };
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
    genre: formData.get('genre'),
    playUrl: formData.get('playUrl'),
    instructions: formData.get('instructions') || '',
    tagsStr: formData.get('tags') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, description, genre, playUrl, instructions, tagsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const thumbnailFile = formData.get('thumbnail') as File;

  await dbConnect();

  try {
    const updateData: Record<string, unknown> = {
      title,
      description,
      genre,
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
    return { error: (error as Error).message || 'Failed to update game' };
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
    return { error: (error as Error).message || 'Failed to delete game' };
  }

  revalidatePath('/admin/games');
  revalidatePath('/games');
  return { error: undefined };
}
