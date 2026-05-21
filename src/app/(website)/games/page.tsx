import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import GamesClient from "./GamesClient";
import { CONFIG } from "@/lib/config";
import type { IGame } from "@/models/Game";

export const dynamic = 'force-dynamic';

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; sort?: string; q?: string }>;
}) {
  await dbConnect();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const category = params.category || "";
  const query = params.q || "";
  const sort = params.sort === "asc" ? "asc" : "desc";

  const skip = (page - 1) * CONFIG.PAGINATION.GAMES_PUBLIC;

  const match: Record<string, unknown> = { published: { $ne: false } };
  if (category && category !== "ทั้งหมด") match.category = category;
  if (query) match.title = { $regex: query, $options: 'i' };

  const [docs, total, uniqueCategories] = await Promise.all([
    Game.find(match)
      .select("slug title description category thumbnail playUrl htmlContent instructions tags createdAt")
      .sort({ createdAt: sort === "desc" ? -1 : 1 })
      .skip(skip)
      .limit(CONFIG.PAGINATION.GAMES_PUBLIC)
      .lean(),
    Game.countDocuments(match),
    Game.distinct("category", { published: { $ne: false } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.GAMES_PUBLIC));

  const items = docs.map((doc: IGame) => {
    const hasHtml = !!doc.htmlContent;
    return {
      id: doc._id.toString(),
      slug: doc.slug,
      title: doc.title,
      description: doc.description || "",
      category: doc.category || "",
      cover: doc.thumbnail || "",
      link: hasHtml ? `/games/play/${doc._id.toString()}` : (doc.playUrl || "#"),
      date: doc.createdAt instanceof Date
        ? doc.createdAt.toISOString()
        : (doc.createdAt ? new Date(doc.createdAt).toISOString() : "2024-01-01T00:00:00.000Z"),
      tags: doc.tags || [],
      instructions: doc.instructions || "",
      isHtmlContent: hasHtml,
    };
  });

  return (
    <GamesClient
      items={items}
      uniqueCategories={uniqueCategories as string[]}
      currentPage={page > totalPages ? 1 : page}
      totalPages={totalPages}
      activeCategory={category}
      activeQuery={query}
      sort={sort}
      total={total}
    />
  );
}
