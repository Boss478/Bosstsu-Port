import dbConnect from "@/lib/db";
import Learning from "@/models/Learning";
import ResourcesClient from "./ResourcesClient";

export const revalidate = 60;

export default async function ResourcesPage() {
  await dbConnect();

  const docs = await Learning.find({ published: { $ne: false } })
    .sort({ createdAt: -1 })
    .lean();
  
  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = docs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || "",
    type: doc.type || "Other",
    cover: doc.thumbnail || "",
    link: doc.link || "#",
    date: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : new Date(doc.createdAt || defaultFallbackDate).toISOString(),
    tags: doc.tags || [],
    subject: doc.subject || "",
  }));

  return <ResourcesClient initialItems={items} />;
}
