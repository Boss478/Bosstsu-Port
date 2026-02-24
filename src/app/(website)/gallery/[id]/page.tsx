import { notFound } from "next/navigation";
import dbConnect from "@/lib/db";
import Gallery from "@/models/Gallery";
import AlbumContent from "./AlbumContent";

export const revalidate = 60;

export async function generateStaticParams() {
  await dbConnect();
  const docs = await Gallery.find({ published: { $ne: false } }, "slug").lean();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return docs.map((doc: any) => ({
    id: doc.slug,
  }));
}

export default async function GalleryAlbumPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  await dbConnect();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc: any = await Gallery.findOne({ slug: id, published: { $ne: false } }).lean();

  if (!doc) notFound();

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const album = {
    id: doc.slug,
    title: doc.title,
    description: doc.description || "",
    cover: doc.cover,
    tags: doc.tags || [],
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date || defaultFallbackDate).toISOString(),
    photos: doc.photos || [],
    relatedPortfolioId: doc.relatedPortfolioId || undefined,
  };

  return <AlbumContent album={album} />;
}
