'use server';

import dbConnect from '@/lib/db';
import Tag from '@/models/Tag';
import { verifyAuth } from '@/lib/auth';

export async function getTagsByCategory(category: string): Promise<string[]> {
  await dbConnect();
  const tags = await Tag.find({ category }).sort({ name: 1 }).lean();
  return tags.map(t => t.name);
}

export async function addCustomTag(name: string, category: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: 'Unauthorized' };

  await dbConnect();
  const formattedName = name.trim();
  if (!formattedName) return { error: 'Empty tag' };

  try {
    const existing = await Tag.findOne({
      name: { $regex: new RegExp(`^${formattedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
      category,
    });

    if (!existing) {
      await Tag.create({ name: formattedName, category });
    }
    return { success: true, name: existing ? existing.name : formattedName };
  } catch {
    return { error: 'Failed to add tag' };
  }
}
