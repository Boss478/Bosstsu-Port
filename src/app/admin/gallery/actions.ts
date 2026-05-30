'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
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
    const coverUrl = formData.get('coverUrl') as string;
    const photoUrls = JSON.parse((formData.get('photoUrls') as string) || '[]');

    if (!coverUrl) return { error: formatError('U03') };

    try {
      await dbConnect();
      await Gallery.create({
        title, slug, description,
        date: new Date(dateStr),
        tags: parseTagString(tagsStr),
        cover: coverUrl,
        photos: photoUrls,
        published,
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
    const coverUrl = formData.get('coverUrl') as string;
    const photoUrls = formData.get('photoUrls') as string;

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

      if (coverUrl) updateData.cover = coverUrl;
      if (photoUrls) updateData.photos = JSON.parse(photoUrls);

      await Gallery.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update gallery', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
