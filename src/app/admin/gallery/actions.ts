'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
import { saveFile } from '@/lib/upload';
import { formatError } from '@/lib/error-code';
import { parseTagString } from '@/lib/format';
import { titleField, slugField, tagsField, optionalString } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError, revalidateContentPaths, createTogglePublished, createDeleteItem } from '@/lib/admin-crud';

const gallerySchema = z.object({
  title: titleField,
  slug: slugField,
  description: optionalString,
  dateStr: z.string().trim().min(1, 'กรุณาระบุวันที่'),
  tagsStr: tagsField,
  relatedPortfolioId: z.string().optional(),
}).strict();

const ADMIN = ROUTES.ADMIN.GALLERY;
const PUBLIC = ROUTES.PUBLIC.GALLERY;

export const togglePublished = createTogglePublished(Gallery, ADMIN, PUBLIC);
export const deleteGalleryAlbum = createDeleteItem(Gallery, ADMIN, PUBLIC);

export async function createGalleryAlbum(formData: FormData) {
  return withAuth(async () => {
    const parsed = gallerySchema.safeParse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      dateStr: formData.get('date'),
      tagsStr: formData.get('tags') || '',
      relatedPortfolioId: formData.get('relatedPortfolioId') || undefined,
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, slug, description, dateStr, tagsStr, relatedPortfolioId } = parsed.data;
    const published = formData.get('published') === 'on';
    const coverFile = formData.get('cover') as File;
    const photoFiles = formData.getAll('photos') as File[];

    if (!coverFile || coverFile.size === 0) return { error: formatError('U03') };

    try {
      await dbConnect();
      const coverPath = await saveFile(coverFile, 'gallery/covers');
      const tags = parseTagString(tagsStr);
      const photos: string[] = [];
      for (const file of photoFiles) {
        if (file.size > 0) photos.push(await saveFile(file, 'gallery/albums'));
      }

      await Gallery.create({
        title, slug, description,
        date: new Date(dateStr),
        tags, cover: coverPath, photos, published,
        relatedPortfolioId: relatedPortfolioId || undefined,
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Create gallery', 'DB01');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}

export async function updateGalleryAlbum(id: string, formData: FormData) {
  return withAuth(async () => {
    const parsed = gallerySchema.safeParse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      dateStr: formData.get('date'),
      tagsStr: formData.get('tags') || '',
      relatedPortfolioId: formData.get('relatedPortfolioId') || undefined,
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, slug, description, dateStr, tagsStr, relatedPortfolioId } = parsed.data;
    const published = formData.get('published') === 'on';
    const coverFile = formData.get('cover') as File;
    const photoFiles = formData.getAll('photos') as File[];
    const existingPhotosStr = formData.get('existingPhotos') as string;

    try {
      await dbConnect();
      const updateData: Record<string, unknown> = {
        title, slug, description,
        date: new Date(dateStr),
        tags: parseTagString(tagsStr),
        published,
      };

      if (relatedPortfolioId) {
        updateData.relatedPortfolioId = relatedPortfolioId;
      } else {
        updateData.$unset = { relatedPortfolioId: 1 };
      }

      if (coverFile && coverFile.size > 0) {
        updateData.cover = await saveFile(coverFile, 'gallery/covers');
      }

      const photos = existingPhotosStr ? JSON.parse(existingPhotosStr) : [];
      for (const file of photoFiles) {
        if (file.size > 0) photos.push(await saveFile(file, 'gallery/albums'));
      }
      updateData.photos = photos;

      await Gallery.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update gallery', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
