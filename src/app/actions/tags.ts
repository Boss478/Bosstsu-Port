'use server';

import dbConnect from '@/lib/db';
import Tag from '@/models/Tag';
import { verifyAuth } from '@/lib/auth';
import { createErrorResponse } from '@/lib/error-code';

export async function getTagsByCategory(category: string): Promise<string[]> {
  await dbConnect();
  const tags = await Tag.find({ category }).sort({ name: 1 }).lean();
  return tags.map(t => t.name);
}

export async function addCustomTag(name: string, category: string) {
  const isAuth = await verifyAuth();
  if (!isAuth) return { error: createErrorResponse('401') };

  await dbConnect();
  const formattedName = name.trim();
  if (!formattedName) return { error: createErrorResponse('T01') };

  try {
    const existing = await Tag.findOne({
      $expr: {
        $and: [
          { $eq: ['$category', category] },
          { $eq: [{ $toLower: '$name' }, formattedName.toLowerCase()] },
        ],
      },
    });

    if (!existing) {
      await Tag.create({ name: formattedName, category });
    }
    return { success: true, name: existing ? existing.name : formattedName };
  } catch {
    return { error: createErrorResponse('T02') };
  }
}