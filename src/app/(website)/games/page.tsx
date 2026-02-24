import dbConnect from "@/lib/db";
import Game from "@/models/Game";
import GamesClient from "./GamesClient";

export const revalidate = 60;

export default async function GamesPage() {
  await dbConnect();

  const docs = await Game.find({ published: { $ne: false } })
    .sort({ createdAt: -1 })
    .lean();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items = docs.map((doc: any) => ({
    id: doc._id.toString(),
    title: doc.title,
    description: doc.description || "",
    genre: doc.genre || "",
    cover: doc.thumbnail || "",
    link: doc.playUrl || "#",
    date: doc.createdAt instanceof Date
      ? doc.createdAt.toISOString()
      : (doc.createdAt ? new Date(doc.createdAt).toISOString() : "2024-01-01T00:00:00.000Z"),
    tags: doc.tags || [],
    instructions: doc.instructions || "",
  }));

  return <GamesClient initialItems={items} />;
}
