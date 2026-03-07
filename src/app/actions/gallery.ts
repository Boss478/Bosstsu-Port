'use server';

import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';
import { unstable_cache } from 'next/cache';

export const getGalleryAlbums = unstable_cache(
  async () => {
    await dbConnect();
    const albums = await Gallery.find({ published: true }).sort({ date: -1 }).lean();
    return JSON.parse(JSON.stringify(albums));
  },
  ['gallery-public-list'],
  { tags: ['gallery'], revalidate: 3600 }
);

export async function getGalleryAlbumBySlug(slug: string) {
  if (typeof slug !== 'string') return null;
  await dbConnect();
  const album = await Gallery.findOne({ slug }).lean();
  if (!album) return null;
  return JSON.parse(JSON.stringify(album));
}
