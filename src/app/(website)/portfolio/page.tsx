import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import PortfolioClient from "./PortfolioClient";
import { type PortfolioItem } from "./data";
import { CONFIG } from "@/lib/config";

export const revalidate = 60;

export default async function PortfolioPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string; sort?: string }>;
}) {
  await dbConnect();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const tag = params.tag || "";
  const sort = params.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * CONFIG.PAGINATION.PORTFOLIO_PUBLIC;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: Record<string, any> = { published: { $ne: false } };
  if (tag && tag !== "ทั้งหมด") {
    match.tags = tag;
  }

  const [docs, total, uniqueTags] = await Promise.all([
    Portfolio.find(match)
      .select("slug title description cover tags date gallery tools")
      .sort({ date: sort === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(CONFIG.PAGINATION.PORTFOLIO_PUBLIC)
      .lean(),
    Portfolio.countDocuments(match),
    Portfolio.distinct("tags", { published: { $ne: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.PORTFOLIO_PUBLIC));

  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const items: PortfolioItem[] = docs.map((doc: any) => ({
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
      sort={sort}
    />
  );
}
