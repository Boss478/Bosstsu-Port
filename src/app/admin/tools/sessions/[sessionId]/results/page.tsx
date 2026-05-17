import { notFound } from 'next/navigation';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import ResultsFullPage from '@/components/admin/ResultsFullPage';

export const dynamic = 'force-dynamic';

export default async function SessionResultsFullPage({
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
    <ResultsFullPage
      session={JSON.parse(JSON.stringify(session))}
      initialResponses={JSON.parse(JSON.stringify(responses))}
    />
  );
}