import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolSessionView from '@/components/tools/ToolSessionView';

export const dynamic = 'force-dynamic';

export default async function ToolSessionPage({
  params,
}: {
  params: Promise<{ sessionCode: string }>
}) {
  const { sessionCode } = await params;
  await dbConnect();

  const session = await ToolSession.findOne({ sessionCode: sessionCode.toUpperCase() }).lean();
  if (!session) notFound();

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <ToolSessionView
        session={JSON.parse(JSON.stringify(session))}
      />
    </div>
  );
}