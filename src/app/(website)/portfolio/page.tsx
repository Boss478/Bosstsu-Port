import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import Tag from "@/models/Tag";
import PortfolioClient from "./PortfolioClient";
import { type PortfolioItem } from "./data";
import { CONFIG } from "@/lib/config";
import type { IPortfolioItem } from "@/models/Portfolio";

export const revalidate = 60;

export default async function PortfolioPage({
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

    const skip = (page - 1) * CONFIG.PAGINATION.PORTFOLIO_PUBLIC;
    const match: Record<string, unknown> = { published: { $ne: false } };
    if (tag && tag !== "ทั้งหมด") match.tags = tag;
    if (query) match.title = { $regex: query, $options: 'i' };

    const results = await Promise.all([
      Portfolio.find(match)
        .select("slug title description cover tags date gallery tools")
        .sort({ date: sort === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(CONFIG.PAGINATION.PORTFOLIO_PUBLIC)
        .lean(),
      Portfolio.countDocuments(match),
      Tag.distinct("name", { category: "portfolio" }),
    ]);
    docs = results[0] as any[];
    total = results[1] as number;
    tagDocs = results[2] as string[];
  } catch {
    // DB unavailable (Docker build) — ISR populates at runtime
  }

  const uniqueTags = tagDocs.length > 0 ? tagDocs : [];

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.PORTFOLIO_PUBLIC));

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const items: PortfolioItem[] = docs.map((doc: IPortfolioItem) => ({
    id: doc.slug,
    title: doc.title,
    description: doc.description || "",
    content: doc.content || "",
    gallery: doc.gallery || [],
    tools: doc.tools || [],
    cover: doc.cover,
    tags: doc.tags || [],
    date: doc.date instanceof Date ? doc.date.toISOString() : new Date(doc.date || defaultFallbackDate).toISOString(),
    relatedGalleryId: doc.relatedGalleryId || undefined,
  }));

  return (
    <PortfolioClient
      items={items}
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
