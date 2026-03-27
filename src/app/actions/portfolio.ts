'use server';

import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { revalidatePath, unstable_cache } from 'next/cache';
import { CONFIG } from '@/lib/config';
import { verifyAuth } from '@/lib/auth';
import { z } from 'zod';

const PortfolioInput = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  content: z.string().optional(),
  gallery: z.array(z.string()).optional(),
  tools: z.array(z.string()).optional(),
  cover: z.string().url(),
  tags: z.array(z.string()).optional(),
  date: z.coerce.date(),
  published: z.boolean().default(true),
  relatedGalleryId: z.string().optional()
}).strict();

export const getPortfolioItems = unstable_cache(
  async () => {
    await dbConnect();
    const items = await Portfolio.find({ published: true }).sort({ date: -1 }).lean();
    return JSON.parse(JSON.stringify(items));
  },
  ['portfolio-public-list'],
  { tags: ['portfolio'], revalidate: 3600 }
);

export async function getPortfolioItemBySlug(slug: string) {
  if (typeof slug !== 'string') return null;
  await dbConnect();
  const item = await Portfolio.findOne({ slug }).lean();
  if (!item) return null;
  return JSON.parse(JSON.stringify(item));
}

export async function getRecentPortfolioItems(excludeSlug: string, limit = CONFIG.PAGINATION.PORTFOLIO_RECENT) {
  if (typeof excludeSlug !== 'string') return [];
  await dbConnect();
  const items = await Portfolio.find({ slug: { $ne: excludeSlug } })
    .sort({ date: -1 })
    .limit(limit)
    .lean();
  return JSON.parse(JSON.stringify(items));
}

export async function getRelatedByTags(currentSlug: string, tags: string[], limit = CONFIG.PAGINATION.PORTFOLIO_RELATED) {
  if (typeof currentSlug !== 'string' || !Array.isArray(tags)) return [];
  const safeTags = tags.filter(t => typeof t === 'string');
  await dbConnect();
  const items = await Portfolio.find({
    slug: { $ne: currentSlug },
    tags: { $in: safeTags },
  })
    .sort({ date: -1 })
    .lean();

  // Score by number of matching tags, then take top N
  const scored = items.map((item) => ({
    ...item,
    score: (item.tags as string[]).filter((t: string) => tags.includes(t)).length,
  }));
  scored.sort((a, b) => b.score - a.score);
  return JSON.parse(JSON.stringify(scored.slice(0, limit)));
}

export async function getOlderAndNewerItem(currentSlug: string) {
  if (typeof currentSlug !== 'string') return { newerItem: null, olderItem: null };
  await dbConnect();
  const current = await Portfolio.findOne({ slug: currentSlug }).lean();
  if (!current) return { newerItem: null, olderItem: null };

  const [newerItem] = await Portfolio.find({ date: { $gt: current.date } })
    .sort({ date: 1 })
    .limit(1)
    .lean();

  const [olderItem] = await Portfolio.find({ date: { $lt: current.date } })
    .sort({ date: -1 })
    .limit(1)
    .lean();

  return {
    newerItem: newerItem ? JSON.parse(JSON.stringify(newerItem)) : null,
    olderItem: olderItem ? JSON.parse(JSON.stringify(olderItem)) : null,
  };
}

export async function createPortfolioItem(rawData: unknown) {
  if (!(await verifyAuth())) throw new Error("Unauthorized");
  const data = PortfolioInput.parse(rawData);
  await dbConnect();
  const newItem = await Portfolio.create(data);
  revalidatePath('/portfolio');
  return JSON.parse(JSON.stringify(newItem));
}
