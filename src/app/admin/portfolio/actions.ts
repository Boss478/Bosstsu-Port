'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { z } from 'zod';

const portfolioSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().min(1, 'Description is required').max(500),
  content: z.string().optional(),
  dateStr: z.string().min(1, 'Date is required'),
  tagsStr: z.string().optional(),
  toolsStr: z.string().optional(),
});

export async function createPortfolioItem(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  const parsed = portfolioSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    content: formData.get('content'),
    dateStr: formData.get('date'),
    tagsStr: formData.get('tags') || '',
    toolsStr: formData.get('tools') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, slug, description, content, dateStr, tagsStr, toolsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const coverFile = formData.get('cover') as File;

  if (!coverFile || coverFile.size === 0) {
    return { error: 'Cover image is required' };
  }

  await dbConnect();

  try {
    const coverPath = await saveFile(coverFile, 'portfolio', true);
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tools = toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    // Process gallery photos
    const photoFiles = formData.getAll('photos') as File[];
    const gallery: string[] = [];
    for (const file of photoFiles) {
      if (file && file.size > 0) {
        gallery.push(await saveFile(file, 'portfolio/gallery', false));
      }
    }

    await Portfolio.create({
      title,
      slug,
      description,
      content,
      date: new Date(dateStr),
      tags,
      tools,
      cover: coverPath,
      gallery,
      published,
    });
  } catch (error: unknown) {
    console.error('Create error:', error);
    return { error: (error as Error).message || 'Failed to create item' };
  }

  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
  return { error: undefined };
}

export async function updatePortfolioItem(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  const parsed = portfolioSchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    content: formData.get('content'),
    dateStr: formData.get('date'),
    tagsStr: formData.get('tags') || '',
    toolsStr: formData.get('tools') || '',
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, slug, description, content, dateStr, tagsStr, toolsStr } = parsed.data;
  const published = formData.get('published') === 'on';
  const coverFile = formData.get('cover') as File;

  await dbConnect();

  try {
    const updateData: Record<string, unknown> = {
      title,
      slug,
      description,
      content,
      date: new Date(dateStr),
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      tools: toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
    };

    if (coverFile && coverFile.size > 0) {
      updateData.cover = await saveFile(coverFile, 'portfolio', true);
    }

    // Process gallery photos
    const existingPhotos: string[] = JSON.parse((formData.get('existingPhotos') as string) || '[]');
    const photoFiles = formData.getAll('photos') as File[];
    const newPhotoPaths: string[] = [];
    for (const file of photoFiles) {
      if (file && file.size > 0) {
        newPhotoPaths.push(await saveFile(file, 'portfolio/gallery', false));
      }
    }
    updateData.gallery = [...existingPhotos, ...newPhotoPaths];

    await Portfolio.findByIdAndUpdate(id, updateData);
  } catch (error: unknown) {
    return { error: (error as Error).message || 'Failed to update item' };
  }

  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
  return { error: undefined };
}

export async function deletePortfolioItem(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  await dbConnect();
  try {
    await Portfolio.findByIdAndDelete(id);
  } catch (error: unknown) {
    return { error: (error as Error).message || 'Failed to delete item' };
  }

  revalidatePath('/admin/portfolio');
  revalidatePath('/portfolio');
  return { error: undefined };
}
