import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import DeleteButton from '@/components/admin/DeleteButton';
import ToggleActive from '@/components/admin/ToggleActive';
import { deleteSession, getAllSessions, countSessions, toggleActive } from './actions';
import QuickStartModal from '@/components/admin/QuickStartModal';
import SearchFilter from '@/components/admin/SearchFilter';
import PageSizeSelector from '@/components/admin/PageSizeSelector';
import { CONFIG } from '@/lib/config';

export const dynamic = 'force-dynamic';

const TOOL_TYPE_LABELS: Record<string, string> = {
  padlet: 'Padlet (Idea Board)',
  poll: 'Poll',
  assignment: 'Assignment',
  qa_board: 'Q&A Board',
  quiz: 'Quick Quiz',
  exit_ticket: 'Exit Ticket',
};

const TOOL_TYPE_ICONS: Record<string, string> = {
  padlet: 'fi-sr-grid',
  poll: 'fi-sr-chart-pie',
  assignment: 'fi-sr-file-upload',
  qa_board: 'fi-sr-interrogation',
  quiz: 'fi-sr-graduation-cap',
  exit_ticket: 'fi-sr-ticket',
};

export default async function ToolsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const page = typeof resolvedSearchParams.page === 'string' ? parseInt(resolvedSearchParams.page) : 1;
  const limit = typeof resolvedSearchParams.limit === 'string'
    ? Math.min(parseInt(resolvedSearchParams.limit), 250)
    : CONFIG.PAGINATION.DEFAULT_LIMIT;
  const search = typeof resolvedSearchParams.q === 'string' ? resolvedSearchParams.q : '';
  const sortParam = typeof resolvedSearchParams.sort === 'string' ? resolvedSearchParams.sort : 'latest';
  const typeFilter = typeof resolvedSearchParams.type === 'string' ? resolvedSearchParams.type : '';

  const skip = (page - 1) * limit;

  const sessionsRaw = await getAllSessions({
    search: search || undefined,
    sort: sortParam,
    type: typeFilter || undefined,
    limit,
    skip,
  });

  const totalSessions = await countSessions(search || undefined, typeFilter || undefined);
  const totalPages = Math.ceil(totalSessions / limit);

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

  function buildPaginationQuery(newPage: number): Record<string, string | number> {
    const params: Record<string, string | number> = { page: newPage };
    if (search) params.q = search;
    if (sortParam) params.sort = sortParam;
    if (typeFilter) params.type = typeFilter;
    if (typeof resolvedSearchParams.limit === 'string') params.limit = resolvedSearchParams.limit;
    return params;
  }

  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-28 pb-12 px-4">
      <div className="max-w-5xl mx-auto">
        <Breadcrumb items={[{ label: 'Backend', href: '/admin' }, { label: 'Class Tools' }]} />

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
            <i className="fi fi-sr-chalkboard text-blue-500" />
            Class Tools
          </h1>
          <div className="flex items-center gap-3">
            <Link
              href="/admin/tools/templates"
              className="flex items-center gap-2 px-6 py-2.5 bg-white dark:bg-slate-800 text-zinc-700 dark:text-zinc-300 font-bold rounded-xl border border-zinc-300 dark:border-slate-600 hover:border-blue-400 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all hover:-translate-y-0.5"
            >
              <i className="fi fi-sr-template text-sm" />
              Templates
            </Link>
            <QuickStartModal />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
          <SearchFilter toolTypes={TOOL_TYPE_LABELS} />
          <PageSizeSelector />
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
                          <ToggleActive
                            id={session._id}
                            isActive={session.isActive}
                            action={toggleActive}
                          />
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
          {pastSessions.length === 0 && activeSessions.length === 0 ? (
            <div className="p-12 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
              <i className="fi fi-sr-chalkboard-teacher text-4xl text-zinc-300 dark:text-zinc-600 block mb-3" />
              <p className="text-zinc-500 dark:text-zinc-400">No sessions yet.</p>
            </div>
          ) : (
            <>
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
                          <ToggleActive
                            id={session._id}
                            isActive={session.isActive}
                            action={toggleActive}
                          />
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex justify-center gap-2">
                  <Link
                    href={page <= 1 ? '#' : { pathname: '/admin/tools', query: buildPaginationQuery(page - 1) }}
                    className={`p-2 rounded-lg border ${
                      page <= 1
                        ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
                    }`}
                  >
                    <i className="fi fi-sr-angle-left" />
                  </Link>
                  <span className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
                    Page {page} of {totalPages}
                  </span>
                  <Link
                    href={page >= totalPages ? '#' : { pathname: '/admin/tools', query: buildPaginationQuery(page + 1) }}
                    className={`p-2 rounded-lg border ${
                      page >= totalPages
                        ? 'pointer-events-none opacity-50 border-zinc-200 dark:border-slate-700'
                        : 'bg-white dark:bg-slate-800 border-zinc-200 dark:border-slate-700 hover:bg-zinc-50'
                    }`}
                  >
                    <i className="fi fi-sr-angle-right" />
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
