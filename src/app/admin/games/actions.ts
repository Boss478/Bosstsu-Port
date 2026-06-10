'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import { slugify, parseTagString } from '@/lib/format';
import { finalizeUploads } from '@/lib/upload';
import { titleField, descriptionField, tagsField } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import {
  withAuth,
  handleDbError,
  sanitizeHtml,
  revalidateContentPaths,
  createTogglePublished,
  createDeleteItem,
} from '@/lib/admin-crud';
import { trackServerEvent } from '@/lib/analytics/server';

const gameSchema = z
  .object({
    title: titleField,
    description: descriptionField,
    category: z.string().trim().min(1, 'กรุณาระบุหมวดหมู่'),
    playUrl: z.string().optional(),
    htmlContent: z.string().optional(),
    instructions: z.string().optional(),
    tagsStr: tagsField,
    gameType: z.enum(['url', 'html']),
  })
  .strict()
  .refine(
    (data) => {
      if (data.gameType === 'url') {
        return (
          data.playUrl &&
          (data.playUrl.startsWith('/') ||
            data.playUrl.startsWith('http://') ||
            data.playUrl.startsWith('https://'))
        );
      }
      return true;
    },
    {
      message: 'URL ต้องเป็นลิงก์ที่ถูกต้องหรือเส้นทางที่ขึ้นต้นด้วย /',
      path: ['playUrl'],
    },
  )
  .refine(
    (data) => {
      if (data.gameType === 'html') {
        return data.htmlContent && data.htmlContent.trim().length > 0;
      }
      return true;
    },
    {
      message: 'เนื้อหา HTML จำเป็นสำหรับเกมแบบ One-page HTML',
      path: ['htmlContent'],
    },
  );

const ADMIN = ROUTES.ADMIN.GAMES;
const PUBLIC = ROUTES.PUBLIC.GAMES;

export const togglePublished = createTogglePublished(Game, ADMIN, PUBLIC);
export const deleteGame = createDeleteItem(Game, ADMIN, PUBLIC);

export async function createGame(formData: FormData) {
  return withAuth(async () => {
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

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, category, playUrl, htmlContent, instructions, tagsStr } =
      parsed.data;
    const slug = slugify(title);

    try {
      await dbConnect();
      const tags = parseTagString(tagsStr);

      const doc = await Game.create({
        title,
        slug,
        description,
        category,
        playUrl: playUrl || '',
        instructions: instructions || undefined,
        htmlContent: sanitizeHtml(htmlContent),
        tags,
        published: false,
      });
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'game', action: 'create' },
      });
      return { id: doc._id.toString() };
    } catch (error: unknown) {
      return handleDbError(error, 'Create game', 'DB01');
    }
  });
}

export async function saveGameMedia(id: string, formData: FormData) {
  return withAuth(async () => {
    await dbConnect();
    const rawThumbnailUrl = formData.get('thumbnailUrl') as string;
    const published = formData.get('published') === 'on';
    try {
      const [thumbnailUrl] = rawThumbnailUrl
        ? await finalizeUploads([rawThumbnailUrl], 'games')
        : [''];
      const updateData: Record<string, unknown> = { published };
      if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;
      await Game.findByIdAndUpdate(id, updateData);
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'game', action: 'save_media' },
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Save game media', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}

export async function updateGame(id: string, formData: FormData) {
  return withAuth(async () => {
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

    if (!parsed.success) return { error: parsed.error.issues[0].message };

    const { title, description, category, playUrl, htmlContent, instructions, tagsStr } =
      parsed.data;
    const published = formData.get('published') === 'on';
    const rawThumbnailUrl = formData.get('thumbnailUrl') as string;

    try {
      await dbConnect();
      const [thumbnailUrl] = rawThumbnailUrl
        ? await finalizeUploads([rawThumbnailUrl], 'games')
        : [''];

      const updateData: Record<string, unknown> = {
        title,
        description,
        category,
        playUrl: playUrl || '',
        instructions: instructions || undefined,
        htmlContent: sanitizeHtml(htmlContent),
        tags: parseTagString(tagsStr),
        published,
      };

      if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;

      await Game.findByIdAndUpdate(id, updateData);
      await trackServerEvent({
        path: ADMIN,
        eventName: 'form_submit',
        metadata: { form: 'game', action: 'edit' },
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Update game', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
