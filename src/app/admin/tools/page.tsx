import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import DeleteButton from '@/components/admin/DeleteButton';
import { endSession, deleteSession, getAllSessions } from './actions';
import QuickStartModal from '@/components/admin/QuickStartModal';
import dbConnect from '@/lib/db';

export const dynamic = 'force-dynamic';

const TOOL_TYPE_LABELS: Record<string, string> = {
  padlet: 'Padlet (Idea Board)',
  poll: 'Poll',
  assignment: 'Assignment',
  qa_board: 'Q&A Board',
  quiz: 'Quick Quiz',
  exit_ticket: 'Exit Ticket',
  discussion: 'Discussion',
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  padlet: 'fi-sr-grid',
  poll: 'fi-sr-chart-pie',
  assignment: 'fi-sr-file-upload',
  qa_board: 'fi-sr-interrogation',
  quiz: 'fi-sr-graduation-cap',
  exit_ticket: 'fi-sr-ticket',
  discussion: 'fi-sr-comments',
};

export default async function ToolsListPage() {
  await dbConnect();
  const sessionsRaw = await getAllSessions();
  const sessions = sessionsRaw as Array<{
    _id: string;
    sessionCode: string;
    title: string;
    type: string;
    isActive: boolean;
    responseCount: number;
    participantCount: number;
    startedAt: string;
    endedAt?: string;
  }>;

  const activeSessions = sessions.filter(s => s.isActive);
  const pastSessions = sessions.filter(s => !s.isActive);

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: 'Backend', href: '/admin' }, { label: 'Class Tools' }]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-chalkboard text-blue-500" />
            Class Tools
          </h1>
          <QuickStartModal />
        </div>

        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              Active Sessions ({activeSessions.length})
            </h2>
            <div className="space-y-3">
              {activeSessions.map(session => (
                <div
                  key={session._id}
                  className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-emerald-200 dark:border-emerald-800/50 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-xl text-blue-600 dark:text-blue-400 tracking-widest">
                            {session.sessionCode}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Active
                          </span>
                        </div>
                        <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{session.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                          <span className="inline-flex items-center gap-1">
                            <i className={`fi ${TOOL_TYPE_ICONS[session.type] || 'fi-sr-tool'}`} />
                            {TOOL_TYPE_LABELS[session.type] || session.type}
                          </span>
                          <span>{session.responseCount} responses</span>
                          <span>Started {new Date(session.startedAt).toLocaleDateString('th-TH')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/study/${session.sessionCode}`}
                        target="_blank"
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                      >
                        <i className="fi fi-sr-arrow-up-right text-sm" />
                        Try it
                      </Link>
                      <Link
                        href={`/admin/tools/sessions/${session._id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-sm transition-colors"
                      >
                        <i className="fi fi-sr-eye text-sm" />
                        View
                      </Link>
                      <form action={endSession}>
                        <input type="hidden" name="sessionId" value={session._id} />
                        <button
                          type="submit"
                          className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-xl border border-red-200 transition-colors"
                        >
                          <i className="fi fi-sr-stop text-sm" />
                          End
                        </button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Past Sessions */}
        <div>
          <h2 className="text-lg font-bold text-zinc-700 dark:text-zinc-300 mb-4">
            Past Sessions ({pastSessions.length})
          </h2>
          {pastSessions.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
              <i className="fi fi-sr-chalkboard-teacher text-4xl text-zinc-300 dark:text-zinc-600 block mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">No sessions yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pastSessions.map(session => (
                <div
                  key={session._id}
                  className="p-5 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm hover:border-blue-200 dark:hover:border-blue-800/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-lg text-zinc-500 dark:text-zinc-400 tracking-widest">
                          {session.sessionCode}
                        </span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400 font-medium">
                          Ended
                        </span>
                      </div>
                      <p className="text-zinc-700 dark:text-zinc-300 font-semibold">{session.title}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-zinc-400">
                        <span className="inline-flex items-center gap-1">
                          <i className={`fi ${TOOL_TYPE_ICONS[session.type] || 'fi-sr-tool'}`} />
                          {TOOL_TYPE_LABELS[session.type] || session.type}
                        </span>
                        <span>{session.responseCount} responses</span>
                        <span>
                          {session.endedAt
                            ? `Ended ${new Date(session.endedAt).toLocaleDateString('th-TH')}`
                            : `Started ${new Date(session.startedAt).toLocaleDateString('th-TH')}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/tools/sessions/${session._id}`}
                        className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-700/60 hover:bg-zinc-50 dark:hover:bg-slate-700 text-zinc-600 dark:text-zinc-300 font-medium rounded-xl border border-zinc-200 dark:border-slate-600 transition-colors"
                      >
                        <i className="fi fi-sr-eye text-sm" />
                        View Results
                      </Link>
                      <DeleteButton id={session._id} action={deleteSession} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}