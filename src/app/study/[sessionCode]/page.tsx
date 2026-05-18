import Link from 'next/link';
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
  
  if (!session) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
          <i className="fi fi-sr-search-alt text-6xl text-zinc-300 dark:text-zinc-600 block mb-4" />
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            ไม่พบห้องเรียน
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 mb-6">
            รหัสห้องเรียนไม่ถูกต้องหรือไม่มีอยู่ในระบบ
          </p>
          <div className="space-y-3">
            <p className="text-sm text-zinc-400">
              รหัสที่คุณกรอก: <span className="font-mono font-bold text-blue-600">{sessionCode.toUpperCase()}</span>
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/study"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-bold rounded-xl shadow-lg shadow-sky-500/20 transition-all"
              >
                <i className="fi fi-sr-arrow-left" />
                กรอกรหัสใหม่
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-zinc-100 dark:bg-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-600 text-zinc-700 dark:text-zinc-200 font-bold rounded-xl transition-all"
              >
                <i className="fi fi-sr-home" />
                กลับหน้าหลัก
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950">
      <ToolSessionView
        session={JSON.parse(JSON.stringify(session))}
      />
    </div>
  );
}