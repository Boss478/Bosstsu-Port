'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { parseTagString } from '@/lib/format';
import { finalizeUploads } from '@/lib/upload';
import { titleField, slugField, descriptionField, tagsField, optionalString } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError, sanitizeHtml, revalidateContentPaths, createTogglePublished, createDeleteItem } from '@/lib/admin-crud';

const portfolioSchema = z.object({
  title: titleField,
  slug: slugField,
  description: descriptionField,
  content: optionalString,
  dateStr: z.string().trim().min(1, 'กรุณาระบุวันที่'),
  tagsStr: tagsField,
  toolsStr: z.string().optional(),
}).strict();

const ADMIN = ROUTES.ADMIN.PORTFOLIO;
const PUBLIC = ROUTES.PUBLIC.PORTFOLIO;

export const togglePublished = createTogglePublished(Portfolio, ADMIN, PUBLIC);
export const deletePortfolioItem = createDeleteItem(Portfolio, ADMIN, PUBLIC);

export async function createPortfolioItem(formData: FormData) {
  return withAuth(async () => {
    const parsed = portfolioSchema.safeParse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      content: formData.get('content'),
      dateStr: formData.get('date'),
      tagsStr: formData.get('tags') || '',
      toolsStr: formData.get('tools') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, slug, description, content, dateStr, tagsStr, toolsStr } = parsed.data;

    try {
      await dbConnect();
      const doc = await Portfolio.create({
        title, slug, description,
        date: new Date(dateStr),
        tags: parseTagString(tagsStr),
        tools: toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
        content: sanitizeHtml(content),
        published: false,
      });
      return { id: doc._id.toString() };
    } catch (error: unknown) {
      return handleDbError(error, 'Create portfolio', 'DB01');
    }
  });
}

export async function savePortfolioMedia(id: string, formData: FormData) {
  return withAuth(async () => {
    await dbConnect();
    const rawCoverUrl = formData.get('coverUrl') as string;
    const rawGalleryUrls = formData.get('galleryUrls') as string;
    const published = formData.get('published') === 'on';
    try {
      const [coverUrl] = rawCoverUrl ? await finalizeUploads([rawCoverUrl], 'portfolio') : [''];
      const galleryUrls = rawGalleryUrls
        ? await finalizeUploads(JSON.parse(rawGalleryUrls) as string[], 'portfolio/gallery')
        : [];
      const updateData: Record<string, unknown> = { published };
      if (coverUrl) updateData.cover = coverUrl;
      if (galleryUrls.length > 0) updateData.gallery = galleryUrls;
      await Portfolio.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Save portfolio media', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}

export async function updatePortfolioItem(id: string, formData: FormData) {
  return withAuth(async () => {
    const parsed = portfolioSchema.safeParse({
      title: formData.get('title'),
      slug: formData.get('slug'),
      description: formData.get('description'),
      content: formData.get('content'),
      dateStr: formData.get('date'),
      tagsStr: formData.get('tags') || '',
      toolsStr: formData.get('tools') || '',
    });

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, slug, description, content, dateStr, tagsStr, toolsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const rawCoverUrl = formData.get('coverUrl') as string;
    const rawGalleryUrls = formData.get('galleryUrls') as string;

    try {
      await dbConnect();
      const [coverUrl] = rawCoverUrl ? await finalizeUploads([rawCoverUrl], 'portfolio') : [''];
      const galleryUrls = rawGalleryUrls
        ? await finalizeUploads(JSON.parse(rawGalleryUrls) as string[], 'portfolio/gallery')
        : [];

      const updateData: Record<string, unknown> = {
        title, slug, description,
        date: new Date(dateStr),
        tags: parseTagString(tagsStr),
        tools: toolsStr ? toolsStr.split(',').map(t => t.trim()).filter(Boolean) : [],
        content: sanitizeHtml(content),
        published,
      };

      if (coverUrl) updateData.cover = coverUrl;
      if (galleryUrls.length > 0) updateData.gallery = galleryUrls;

      await Portfolio.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update portfolio', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
