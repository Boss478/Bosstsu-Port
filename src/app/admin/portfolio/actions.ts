'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { verifyAuth } from '@/lib/auth';
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
  
  const coverUrl = formData.get('coverUrl') as string;
  const galleryUrlsStr = formData.get('galleryUrls') as string;
  const galleryUrls = galleryUrlsStr ? JSON.parse(galleryUrlsStr) : [];

  if (!coverUrl) {
    return { error: 'Cover image is required' };
  }

  await dbConnect();

  try {
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    const tools = toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [];

    await Portfolio.create({
      title,
      slug,
      description,
      content,
      date: new Date(dateStr),
      tags,
      tools,
      cover: coverUrl,
      gallery: galleryUrls,
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
  
  const coverUrl = formData.get('coverUrl') as string;
  const galleryUrlsStr = formData.get('galleryUrls') as string;
  const galleryUrls = galleryUrlsStr ? JSON.parse(galleryUrlsStr) : undefined;

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

    if (coverUrl) {
      updateData.cover = coverUrl;
    }

    if (galleryUrls !== undefined) {
      updateData.gallery = galleryUrls;
    }

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
