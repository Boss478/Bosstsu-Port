'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
import { parseTagString } from '@/lib/format';
import { finalizeUploads } from '@/lib/upload';
import { titleField, slugField, tagsField, optionalString } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import {
  withAuth,
  handleDbError,
  revalidateContentPaths,
  createTogglePublished,
  createDeleteItem,
} from '@/lib/admin-crud';
import { trackServerEvent } from '@/lib/analytics/server';

const gallerySchema = z
  .object({
    title: titleField,
    slug: slugField,
    description: optionalString,
    dateStr: z.string().trim().min(1, 'กรุณาระบุวันที่'),
    tagsStr: tagsField,
    relatedPortfolioId: z.string().optional(),
  })
  .strict();

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

    try {
      await dbConnect();
      const doc = await Gallery.create({
        title,
        slug,
        description,
        date: new Date(dateStr),
        tags: parseTagString(tagsStr),
        published: false,
        relatedPortfolioId: relatedPortfolioId || undefined,
      });
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'gallery', action: 'create' },
      });
      return { id: doc._id.toString() };
    } catch (error: unknown) {
      return handleDbError(error, 'Create gallery', 'DB01');
    }
  });
}

export async function saveGalleryMedia(id: string, formData: FormData) {
  return withAuth(async () => {
    await dbConnect();
    const rawCoverUrl = formData.get('coverUrl') as string;
    const rawPhotoUrls = formData.get('photoUrls') as string;
    const published = formData.get('published') === 'on';
    try {
      const [coverUrl] = rawCoverUrl ? await finalizeUploads([rawCoverUrl], 'gallery') : [''];
      const photoUrls = rawPhotoUrls
        ? await finalizeUploads(JSON.parse(rawPhotoUrls) as string[], 'gallery')
        : [];
      const updateData: Record<string, unknown> = { published };
      if (coverUrl) updateData.cover = coverUrl;
      if (photoUrls.length > 0) updateData.photos = photoUrls;
      await Gallery.findByIdAndUpdate(id, updateData);
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'gallery', action: 'save_media' },
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Save gallery media', 'DB02');
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
    const rawCoverUrl = formData.get('coverUrl') as string;
    const rawPhotoUrls = formData.get('photoUrls') as string;

    try {
      await dbConnect();
      const [coverUrl] = rawCoverUrl ? await finalizeUploads([rawCoverUrl], 'gallery') : [''];
      const photoUrls = rawPhotoUrls
        ? await finalizeUploads(JSON.parse(rawPhotoUrls) as string[], 'gallery')
        : [];

      const updateData: Record<string, unknown> = {
        title,
        slug,
        description,
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
      if (photoUrls.length > 0) updateData.photos = photoUrls;

      await Gallery.findByIdAndUpdate(id, updateData);
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'gallery', action: 'edit' },
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Update gallery', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
