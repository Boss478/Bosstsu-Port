import dbConnect from "@/lib/db";
import Gallery from "@/models/Gallery";
import GalleryClient from "./GalleryClient";
import { type GalleryAlbum } from "./data";

export const revalidate = 60; // Cache the DB response for 60 seconds

export default async function GalleryPage() {
  await dbConnect();

  const docs = await Gallery.find({ published: { $ne: false } }).sort({ date: -1 }).lean();
  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const albums: GalleryAlbum[] = docs.map((doc: any) => ({
    id: doc.slug,
    title: doc.title,
    description: doc.description || "",
    cover: doc.cover,
    tags: doc.tags || [],
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date || defaultFallbackDate).toISOString(),
    photos: doc.photos || [],
    relatedPortfolioId: doc.relatedPortfolioId || undefined,
  }));

  return <GalleryClient initialAlbums={albums} />;
}
