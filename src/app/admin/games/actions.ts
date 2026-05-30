'use server';

import { z } from 'zod';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import { formatError } from '@/lib/error-code';
import { slugify, parseTagString } from '@/lib/format';
import { titleField, descriptionField, tagsField } from '@/lib/validation';
import { ROUTES } from '@/lib/routes';
import { withAuth, handleDbError, sanitizeHtml, revalidateContentPaths, createTogglePublished, createDeleteItem } from '@/lib/admin-crud';

const gameSchema = z.object({
  title: titleField,
  description: descriptionField,
  category: z.string().trim().min(1, 'กรุณาระบุหมวดหมู่'),
  playUrl: z.string().optional(),
  htmlContent: z.string().optional(),
  instructions: z.string().optional(),
  tagsStr: tagsField,
  gameType: z.enum(['url', 'html']),
}).strict().refine((data) => {
  if (data.gameType === 'url') {
    return data.playUrl && (
      data.playUrl.startsWith('/') ||
      data.playUrl.startsWith('http://') ||
      data.playUrl.startsWith('https://')
    );
  }
  return true;
}, {
  message: 'URL ต้องเป็นลิงก์ที่ถูกต้องหรือเส้นทางที่ขึ้นต้นด้วย /',
  path: ['playUrl'],
}).refine((data) => {
  if (data.gameType === 'html') {
    return data.htmlContent && data.htmlContent.trim().length > 0;
  }
  return true;
}, {
  message: 'เนื้อหา HTML จำเป็นสำหรับเกมแบบ One-page HTML',
  path: ['htmlContent'],
});

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

    const { title, description, category, playUrl, htmlContent, instructions, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailUrl = formData.get('thumbnailUrl') as string;
    const slug = slugify(title);

    if (!thumbnailUrl) return { error: formatError('U03') };

    try {
      await dbConnect();
      const tags = parseTagString(tagsStr);

      await Game.create({
        title, slug, description, category,
        playUrl: playUrl || '',
        instructions: instructions || undefined,
        htmlContent: sanitizeHtml(htmlContent),
        tags, published, thumbnail: thumbnailUrl,
      });
    } catch (error: unknown) {
      return handleDbError(error, 'Create game', 'DB01');
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

    const { title, description, category, playUrl, htmlContent, instructions, tagsStr } = parsed.data;
    const published = formData.get('published') === 'on';
    const thumbnailUrl = formData.get('thumbnailUrl') as string;

    try {
      await dbConnect();
      const updateData: Record<string, unknown> = {
        title, description, category,
        playUrl: playUrl || '',
        instructions: instructions || undefined,
        htmlContent: sanitizeHtml(htmlContent),
        tags: parseTagString(tagsStr),
        published,
      };

      if (thumbnailUrl) updateData.thumbnail = thumbnailUrl;

      await Game.findByIdAndUpdate(id, updateData);
    } catch (error: unknown) {
      return handleDbError(error, 'Update game', 'DB02');
    }
    revalidateContentPaths(ADMIN, PUBLIC);
    return { error: undefined };
  });
}
