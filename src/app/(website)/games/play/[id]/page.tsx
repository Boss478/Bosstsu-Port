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

  await dbConnect();

  const doc = await Game.findById(id).lean();

  if (!doc || !doc.htmlContent) {
    redirect('/games');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serializableDoc = JSON.parse(JSON.stringify(doc));

  return (
    <PlayView
      htmlContent={serializableDoc.htmlContent}
      title={serializableDoc.title}
    />
  );
}
