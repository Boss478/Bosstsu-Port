import dbConnect from "@/lib/db";
import Gallery from "@/models/Gallery";
import Tag from "@/models/Tag";
import GalleryClient from "./GalleryClient";
import { type GalleryAlbum } from "./data";
import { CONFIG } from "@/lib/config";
import type { IGalleryAlbum } from "@/models/Gallery";

export const revalidate = 60;

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const tag = params.tag || "ทั้งหมด";
  const query = params.q || "";
  const sort = params.sort === "asc" ? "asc" : "desc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docs: any[] = [];
  let total = 0;
  let tagDocs: string[] = [];

  try {
    await dbConnect();

    const skip = (page - 1) * CONFIG.PAGINATION.GALLERY_PUBLIC;
    const match: Record<string, unknown> = { published: { $ne: false } };
    if (tag && tag !== "ทั้งหมด") match.tags = tag;
    if (query) match.title = { $regex: query, $options: 'i' };

    const results = await Promise.all([
      Gallery.find(match)
        .select("slug title cover tags date photos")
        .sort({ date: sort === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(CONFIG.PAGINATION.GALLERY_PUBLIC)
        .lean(),
      Gallery.countDocuments(match),
      Tag.distinct("name", { category: "gallery" }),
    ]);
    docs = results[0] as any[];
    total = results[1] as number;
    tagDocs = results[2] as string[];
  } catch {
    // DB unavailable (Docker build) — ISR populates at runtime
  }

  const uniqueTags = tagDocs.length > 0 ? tagDocs : [];

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.GALLERY_PUBLIC));

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const albums: GalleryAlbum[] = docs.map((doc: IGalleryAlbum) => ({
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
      activeQuery={query}
      sort={sort}
      total={total}
    />
  );
}
