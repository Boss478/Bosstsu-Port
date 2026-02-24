'use server';

import dbConnect from '@/lib/db';
import Portfolio from '@/models/Portfolio';
import { revalidatePath } from 'next/cache';

export async function getPortfolioItems() {
  await dbConnect();
  const items = await Portfolio.find({}).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(items));
}

export async function getPortfolioItemBySlug(slug: string) {
  if (typeof slug !== 'string') return null;
  await dbConnect();
  const item = await Portfolio.findOne({ slug }).lean();
  if (!item) return null;
  return JSON.parse(JSON.stringify(item));
}

import { CONFIG } from '@/lib/config';

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

export async function createPortfolioItem(data: Record<string, unknown>) {
  await dbConnect();
  const newItem = await Portfolio.create(data);
  revalidatePath('/portfolio');
  return JSON.parse(JSON.stringify(newItem));
}
