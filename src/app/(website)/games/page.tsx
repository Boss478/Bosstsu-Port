import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import GamesClient from "./GamesClient";
import { CONFIG } from "@/lib/config";
import type { IGame } from "@/models/Game";

export const revalidate = 60;

export default async function GamesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; category?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const category = params.category || "ทั้งหมด";
  const query = params.q || "";
  const sort = params.sort === "asc" ? "asc" : "desc";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let docs: any[] = [];
  let total = 0;
  let uniqueCategories: string[] = [];

  try {
    await dbConnect();

    const skip = (page - 1) * CONFIG.PAGINATION.GAMES_PUBLIC;
    const match: Record<string, unknown> = { published: { $ne: false } };
    if (category && category !== "ทั้งหมด") match.category = category;
    if (query) match.title = { $regex: query, $options: 'i' };

    const results = await Promise.all([
      Game.find(match)
        .select("slug title description category thumbnail playUrl instructions tags createdAt")
        .sort({ createdAt: sort === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(CONFIG.PAGINATION.GAMES_PUBLIC)
        .lean(),
      Game.countDocuments(match),
      Game.distinct("category", { published: { $ne: false } }),
    ]);
    docs = results[0] as any[];
    total = results[1] as number;
    uniqueCategories = results[2] as string[];
  } catch {
    // DB unavailable (Docker build) — ISR populates at runtime
  }

  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.GAMES_PUBLIC));

  const items = docs.map((doc: IGame) => {
    const hasHtml = !doc.playUrl;
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
