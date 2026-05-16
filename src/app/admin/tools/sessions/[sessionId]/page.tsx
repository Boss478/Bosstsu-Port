import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import SessionDetailShell from '@/components/admin/SessionDetailShell';

export const dynamic = 'force-dynamic';

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params;
  await dbConnect();

  const [session, responses] = await Promise.all([
    ToolSession.findById(sessionId).lean(),
    ToolResponse.find({ sessionId }).sort({ createdAt: 1 }).lean(),
  ]);

  if (!session) notFound();

  return (
    <SessionDetailShell
      session={JSON.parse(JSON.stringify(session))}
      responses={JSON.parse(JSON.stringify(responses))}
    />
  );
}