import Learning from "@/models/Learning";
import Tag from "@/models/Tag";
import ResourcesClient from "./ResourcesClient";
import { type ResourceItem } from "./data";
import { CONFIG } from "@/lib/config";
import { fetchPublished } from "@/lib/fetch-published";
import type { ILearningResource } from "@/models/Learning";

export const revalidate = 60;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; sort?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const type = params.type || "All";
  const query = params.q || "";
  const sort = params.sort === "Oldest" ? "Oldest" : "Newest";

  const skip = (page - 1) * CONFIG.PAGINATION.LEARNING_PUBLIC;
  const match: Record<string, unknown> = { published: { $ne: false } };
  if (type && type !== "All") match.type = type;
  if (query) match.title = { $regex: query, $options: 'i' };

  const [{ docs, total }, uniqueTypes, tagDocs] = await Promise.all([
    fetchPublished({
      model: Learning,
      match,
      select: "title description type thumbnail link createdAt",
      sort: { createdAt: sort === "Newest" ? -1 : 1 },
      skip,
      limit: CONFIG.PAGINATION.LEARNING_PUBLIC,
    }),
    Learning.distinct("type", { published: { $ne: false } }).catch(() => [] as string[]),
    Tag.distinct("name", { category: "learning" }).catch(() => [] as string[]),
  ]);

  const uniqueTags = tagDocs.length > 0 ? tagDocs : [];
  const totalPages = Math.max(1, Math.ceil(total / CONFIG.PAGINATION.LEARNING_PUBLIC));
  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  const items: ResourceItem[] = docs.map((doc: ILearningResource) => ({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || "",
    type: doc.type || "Other",
    cover: doc.thumbnail || "",
    link: doc.link || "#",
    date: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : new Date(doc.createdAt || defaultFallbackDate).toISOString(),
  }));

  return (
    <ResourcesClient
      items={items}
      uniqueTypes={uniqueTypes as string[]}
      uniqueTags={uniqueTags as string[]}
      currentPage={page > totalPages ? 1 : page}
      totalPages={totalPages}
      activeType={type}
      activeQuery={query}
      sort={sort}
      total={total}
    />
  );
}
