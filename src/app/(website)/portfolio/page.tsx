import dbConnect from "@/lib/db";
import Portfolio from "@/models/Portfolio";
import PortfolioClient from "./PortfolioClient";
import { type PortfolioItem } from "./data";

export const revalidate = 60; // Cache the DB response for 60 seconds

export default async function PortfolioPage() {
  await dbConnect();

  const docs = await Portfolio.find({ published: { $ne: false } }).sort({ date: -1 }).lean();
  const defaultFallbackDate = new Date("2024-01-01T00:00:00.000Z");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

  return <PortfolioClient initialItems={items} />;
}
