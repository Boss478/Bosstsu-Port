import dbConnect from "@/lib/db";
import Gallery from "@/models/Gallery";
import GalleryClient from "./GalleryClient";
import { type GalleryAlbum } from "./data";
import { CONFIG } from "@/lib/config";

export const revalidate = 60;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; sort?: string }>;
}) {
  await dbConnect();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const tag = params.tag || "";
  const sort = params.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * CONFIG.PAGINATION.GALLERY_PUBLIC;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: Record<string, any> = { published: { $ne: false } };
  if (tag && tag !== "ทั้งหมด") {
    match.tags = tag;
  }

  const [docs, total, uniqueTags] = await Promise.all([
    Gallery.find(match)
      .select("slug title cover tags date photos")
      .sort({ date: sort === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(CONFIG.PAGINATION.GALLERY_PUBLIC)
      .lean(),
    Gallery.countDocuments(match),
    Gallery.distinct("tags", { published: { $ne: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.GALLERY_PUBLIC));

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const albums: GalleryAlbum[] = docs.map((doc: any) => ({
    id: doc.slug,
    title: doc.title,
    cover: doc.cover,
    tags: doc.tags || [],
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date || defaultFallbackDate).toISOString(),
    photos: doc.photos || [],
  }));

  return (
    <GalleryClient
      items={albums}
      uniqueTags={uniqueTags as string[]}
      currentPage={page > totalPages ? 1 : page}
      totalPages={totalPages}
      activeTag={tag}
      sort={sort}
    />
  );
}
