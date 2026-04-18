import dbConnect from "@/lib/db";
import Learning from "@/models/Learning";
import ResourcesClient from "./ResourcesClient";
import { type ResourceItem } from "./data";
import { CONFIG } from "@/lib/config";
import type { ILearningResource } from "@/models/Learning";

export const revalidate = 60;

export default async function ResourcesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; type?: string; sort?: string }>;
}) {
  await dbConnect();

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1"));
  const type = params.type || "All";
  const sort = params.sort === "Oldest" ? "Oldest" : "Newest";

  const skip = (page - 1) * CONFIG.PAGINATION.LEARNING_PUBLIC;

  const match: { published: { $ne: boolean }; type?: string } = { published: { $ne: false } };
  if (type && type !== "All") {
    match.type = type;
  }

  const [docs, total, uniqueTypes, uniqueTags] = await Promise.all([
    Learning.find(match)
      .select("title description type thumbnail link createdAt")
      .sort({ createdAt: sort === "Newest" ? -1 : 1 })
      .skip(skip)
      .limit(CONFIG.PAGINATION.LEARNING_PUBLIC)
      .lean(),
    Learning.countDocuments(match),
    Learning.distinct("type", { published: { $ne: false } }),
    Learning.distinct("tags", { published: { $ne: false } }),
  ]);

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
      sort={sort}
      totalItems={total}
    />
  );
}
