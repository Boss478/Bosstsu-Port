import Link from 'next/link';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import SessionDetailShell from '@/components/admin/SessionDetailShell';

export const dynamic = 'force-dynamic';

function isValidObjectId(id: string): boolean {
  return /^[a-f\d]{24}$/i.test(id);
}

function SessionNotFound({ sessionId }: { sessionId: string }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
        <i className="fi fi-sr-search-alt text-6xl text-zinc-300 dark:text-zinc-600 block mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          ไม่พบข้อมูล
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          {isValidObjectId(sessionId)
            ? "ไม่มีข้อมูลเซสชันนี้ในระบบ"
            : "รูปแบบรหัสเซสชันไม่ถูกต้อง"}
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/admin/tools"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
          >
            <i className="fi fi-sr-layer-group" />
            กลับไปหน้ารายการเซสชัน
          </Link>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold rounded-xl transition-all"
          >
            <i className="fi fi-sr-home" />
            แดชบอร์ด
          </Link>
        </div>
      </div>
    </div>
  );
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ sessionId: string }>
}) {
  const { sessionId } = await params;

  if (!isValidObjectId(sessionId)) {
    return <SessionNotFound sessionId={sessionId} />;
  }

  let sessionData: Record<string, unknown> | null = null;
  let responsesData: Record<string, unknown>[] = [];
  let fetchError = false;
  let notFound = false;

  try {
    await dbConnect();

    const [session, responses] = await Promise.all([
      ToolSession.findById(sessionId).lean(),
      ToolResponse.find({ sessionId }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!session) {
      notFound = true;
    } else {
      sessionData = JSON.parse(JSON.stringify(session));
      responsesData = JSON.parse(JSON.stringify(responses));
    }
  } catch {
    fetchError = true;
  }

  if (notFound || fetchError || !sessionData) {
    return <SessionNotFound sessionId={sessionId} />;
  }

  return (
    <SessionDetailShell
      session={sessionData}
      responses={responsesData}
    />
  );
}