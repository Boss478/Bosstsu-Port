'use server';

import { revalidatePath } from 'next/cache';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
import { verifyAuth } from '@/lib/auth';
import { saveFile } from '@/lib/upload';
import { createErrorResponse } from '@/lib/error-code';
import { z } from 'zod';

const gallerySchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  description: z.string().optional(),
  dateStr: z.string().min(1, 'Date is required'),
  tagsStr: z.string().optional(),
  relatedPortfolioId: z.string().optional(),
});

function formatError(err: ReturnType<typeof createErrorResponse>): string {
  return `${err.code}: ${err.message} (${err.translation})`;
}

export async function createGalleryAlbum(formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  const parsed = gallerySchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    dateStr: formData.get('date'),
    tagsStr: formData.get('tags') || '',
    relatedPortfolioId: formData.get('relatedPortfolioId') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, slug, description, dateStr, tagsStr, relatedPortfolioId } = parsed.data;
  const published = formData.get('published') === 'on';
  const coverFile = formData.get('cover') as File;
  const photoFiles = formData.getAll('photos') as File[];

  if (!coverFile || coverFile.size === 0) {
    return { error: formatError(createErrorResponse('U03')) };
  }

  await dbConnect();

  try {
    const coverPath = await saveFile(coverFile, 'gallery/covers', true);
    const tags = tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [];
    
    const photos: string[] = [];
    for (const file of photoFiles) {
      if (file.size > 0) {
        const path = await saveFile(file, 'gallery/albums');
        photos.push(path);
      }
    }

    await Gallery.create({
      title,
      slug,
      description,
      date: new Date(dateStr),
      tags,
      cover: coverPath,
      photos,
      published,
      relatedPortfolioId: relatedPortfolioId || undefined,
    });
  } catch (error: unknown) {
    console.error('CreateGallery Error:', error);
    return { error: formatError(createErrorResponse('DB01')) };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');
  return { error: undefined };
}

export async function updateGalleryAlbum(id: string, formData: FormData) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  const parsed = gallerySchema.safeParse({
    title: formData.get('title'),
    slug: formData.get('slug'),
    description: formData.get('description'),
    dateStr: formData.get('date'),
    tagsStr: formData.get('tags') || '',
    relatedPortfolioId: formData.get('relatedPortfolioId') || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { title, slug, description, dateStr, tagsStr, relatedPortfolioId } = parsed.data;
  const published = formData.get('published') === 'on';
  const coverFile = formData.get('cover') as File;
  const photoFiles = formData.getAll('photos') as File[];
  const existingPhotosStr = formData.get('existingPhotos') as string;

  await dbConnect();

  try {
    const updateData: Record<string, unknown> = {
      title,
      slug,
      description,
      date: new Date(dateStr),
      tags: tagsStr ? tagsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
      published,
    };

    if (relatedPortfolioId) {
      updateData.relatedPortfolioId = relatedPortfolioId;
    } else {
      updateData.$unset = { relatedPortfolioId: 1 };
    }

    if (coverFile && coverFile.size > 0) {
      updateData.cover = await saveFile(coverFile, 'gallery/covers', true);
    }

    const photos = existingPhotosStr ? JSON.parse(existingPhotosStr) : [];
    
    for (const file of photoFiles) {
      if (file.size > 0) {
        const path = await saveFile(file, 'gallery/albums');
        photos.push(path);
      }
    }
    updateData.photos = photos;

    await Gallery.findByIdAndUpdate(id, updateData);
  } catch (error: unknown) {
    console.error('UpdateGallery Error:', error);
    return { error: formatError(createErrorResponse('DB02')) };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');
  return { error: undefined };
}

export async function deleteGalleryAlbum(id: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: formatError(createErrorResponse('401')) };

  await dbConnect();
  try {
    await Gallery.findByIdAndDelete(id);
  } catch (error: unknown) {
    console.error('DeleteGallery Error:', error);
    return { error: formatError(createErrorResponse('DB03')) };
  }

  revalidatePath('/admin/gallery');
  revalidatePath('/gallery');
  return { error: undefined };
}