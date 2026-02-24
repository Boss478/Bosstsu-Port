'use server';

import dbConnect from '@/lib/db';
import Gallery from '@/models/Gallery';

export async function getGalleryAlbums() {
  await dbConnect();
  const albums = await Gallery.find({}).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(albums));
}

export async function getGalleryAlbumBySlug(slug: string) {
  if (typeof slug !== 'string') return null;
  await dbConnect();
  const album = await Gallery.findOne({ slug }).lean();
  if (!album) return null;
  return JSON.parse(JSON.stringify(album));
}
