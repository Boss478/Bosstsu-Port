import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import Game from '@/models/Game';
import PlayView from './PlayView';

export const metadata = {
  title: 'Play Game',
};

interface PlayGamePageProps {
  params: Promise<{ id: string }>;
}

export default async function PlayGamePage({ params }: PlayGamePageProps) {
  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    redirect('/games');
  }

  let doc: Record<string, unknown> | null = null;
  try {
    await dbConnect();
    doc = await Game.findById(id).select('+htmlContent').lean() as Record<string, unknown> | null;
  } catch {
    // DB unavailable (Docker build) — ISR populates at runtime
  }

  if (!doc || !doc.htmlContent) {
    redirect('/games');
  }

  const serializableDoc: Record<string, unknown> = JSON.parse(JSON.stringify(doc));

  return (
    <PlayView
      htmlContent={serializableDoc.htmlContent}
      title={serializableDoc.title}
    />
  );
}
