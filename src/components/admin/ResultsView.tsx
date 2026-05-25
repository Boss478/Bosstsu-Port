'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import ExportButton from './ExportButton';
import DeleteButton from './DeleteButton';
import { deleteResponse, deleteAllResponses, toggleQAAnswered } from '@/app/admin/tools/actions';
import { t } from '@/lib/tool-translations';

interface ResultsViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialResponses: any[];
  fullScreen?: boolean;
  onToggleFullScreen?: () => void;
  refreshInterval?: number;
  sessionCurrentStep?: number;
}

const TOOL_LABELS: Record<string, string> = {
  padlet: 'Padlet (Idea Board)',
  poll: 'Poll',
  assignment: 'Assignment',
  qa_board: 'Q&A Board',
  quiz: 'Quiz',
  exit_ticket: 'Exit Ticket',
};

export default function ResultsView({ session, initialResponses, fullScreen, onToggleFullScreen, refreshInterval = 15000, sessionCurrentStep = -1 }: ResultsViewProps) {
  const [responses, setResponses] = useState(initialResponses);
  const [refreshing, setRefreshing] = useState(false);
  const [columnsPerRow, setColumnsPerRow] = useState<number | null>(null);
  const [sizePercent, setSizePercent] = useState(100);
  const [previewFileUrl, setPreviewFileUrl] = useState<string | null>(null);
  const [previewFileType, setPreviewFileType] = useState<'image' | 'pdf' | 'other' | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const steps = session.steps as Array<{ type: string; title: string; config?: Record<string, unknown> }> | undefined;
  const hasSteps = steps && steps.length > 1;

  const stepCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    if (hasSteps && steps) {
      for (let i = 0; i < steps.length; i++) counts[i] = 0;
      responses.forEach((r: { stepIndex?: number }) => {
        const si = r.stepIndex;
        if (si !== undefined && si >= 0 && si < steps.length) counts[si] = (counts[si] || 0) + 1;
      });
    }
    return counts;
  }, [responses, hasSteps, steps]);

  const [activeStepTab, setActiveStepTab] = useState<number>(
    hasSteps ? (sessionCurrentStep >= 0 ? sessionCurrentStep : -1) : 0
  );
  const userChangedTab = useRef(false);

  const activeStepType = hasSteps && steps && activeStepTab >= 0 ? steps[activeStepTab].type : null;
  const toolType = activeStepType || session.type || 'padlet';

  const stepSession = hasSteps && activeStepTab >= 0 && steps && steps[activeStepTab].config
    ? { ...session, config: { ...session.config, ...steps[activeStepTab].config } }
    : session;

  // Auto-sync activeStepTab with session current step unless teacher manually selected a tab
  useEffect(() => {
    if (hasSteps && !userChangedTab.current) {
      setActiveStepTab(sessionCurrentStep >= 0 ? sessionCurrentStep : -1);
    }
  }, [sessionCurrentStep, hasSteps]);

  const handleStepTabClick = (idx: number) => {
    userChangedTab.current = true;
    setActiveStepTab(idx);
    fetchResponses(idx);
  };

  const getFileType = (url: string | undefined): 'image' | 'pdf' | 'other' => {
    if (!url) return 'other';
    const ext = url.split('.').pop()?.toLowerCase() || '';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
    if (ext === 'pdf') return 'pdf';
    return 'other';
  };

  const handlePreviewFile = (url: string | undefined) => {
    if (!url) return;
    setPreviewFileType(getFileType(url));
    setPreviewFileUrl(url);
  };

   const fetchResponses = async (customStepIndex?: number) => {
     try {
       const stepIdx = customStepIndex ?? (hasSteps ? activeStepTab : undefined);
       const stepParam = stepIdx !== undefined && stepIdx >= 0 ? `&stepIndex=${stepIdx}` : '';
       const res = await fetch(`/api/tools/poll?sessionId=${session._id}${stepParam}`);
       const data = await res.json();
       if (data.responses) {
         setResponses(prev => {
           // If fetching a specific step, replace only that step's data
           if (stepIdx !== undefined && stepIdx >= 0 && hasSteps) {
             const others = prev.filter((r: any) => {
               const rStepIdx = r.stepIndex;
               return rStepIdx === undefined || rStepIdx < 0 || rStepIdx !== stepIdx;
             });
             return [...others, ...data.responses];
           }
           // If fetching all steps (e.g., all steps view or single step), replace all
           return data.responses;
         });
       }
     } catch {
       // silent fail
     }
   };

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        if (intervalRef.current) clearInterval(intervalRef.current);
      } else {
        fetchResponses();
        intervalRef.current = setInterval(fetchResponses, refreshInterval);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    intervalRef.current = setInterval(fetchResponses, refreshInterval);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchResponses, refreshInterval]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchResponses();
    setRefreshing(false);
  };

  const forceRefresh = async () => {
    await fetchResponses();
  };

  const displayedResponses = useMemo(() => hasSteps && activeStepTab >= 0
    ? responses.filter((r: { stepIndex?: number }) => r.stepIndex === activeStepTab)
    : responses,
  [responses, hasSteps, activeStepTab]);

  const handleDelete = async (id: string) => {
    await deleteResponse(id);
    await fetchResponses();
  };

  const handleToggleAnswered = async (id: string, current: boolean) => {
    await toggleQAAnswered(id, !current);
    await fetchResponses();
  };

  const renderStepContent = (stepType: string, stepRes: any[], stepSesh: any) => {
    switch (stepType) {
      case 'padlet':
        return (
          <div
            className={`grid grid-cols-1 gap-4 ${columnsPerRow === null ? (fullScreen ? 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6' : 'sm:grid-cols-2 lg:grid-cols-3') : ''}`}
            style={columnsPerRow !== null ? { gridTemplateColumns: `repeat(${columnsPerRow}, minmax(0, 1fr))` } : undefined}
          >
            {stepRes.map((r: { _id: string; studentName?: string; content: { message?: string }; createdAt: string }) => (
              <div key={r._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{r.studentName || 'Anonymous'}</span>
                  <DeleteButton id={r._id} action={deleteResponse} />
                </div>
                <p className="text-zinc-700 dark:text-zinc-300 text-sm break-words">{r.content?.message}</p>
                <p className="text-xs text-zinc-400 mt-2">{new Date(r.createdAt).toLocaleTimeString('th-TH')}</p>
              </div>
            ))}
          </div>
        );
      case 'poll':
        return <PollResults responses={stepRes} session={stepSesh} onDelete={handleDelete} />;
      case 'assignment':
        return (
          <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-sm text-zinc-500 dark:text-zinc-400">
                  <th className="p-4 font-medium">Student</th>
                  <th className="p-4 font-medium hidden md:table-cell">Answer</th>
                  <th className="p-4 font-medium hidden lg:table-cell">IP</th>
                  <th className="p-4 font-medium hidden md:table-cell">File</th>
                  <th className="p-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody>
                {stepRes.map((r: { _id: string; studentName?: string; content: { answer?: string }; fileUrl?: string; ip?: string; createdAt: string }) => (
                  <tr key={r._id} className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30">
                    <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">{r.studentName || 'Anonymous'}</td>
                    <td className="p-4 hidden md:table-cell text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">{r.content?.answer}</td>
                    <td className="p-4 hidden lg:table-cell text-xs text-zinc-400 font-mono">{r.ip || '—'}</td>
                    <td className="p-4 hidden md:table-cell">
                      {r.fileUrl && (
                        <button onClick={() => handlePreviewFile(r.fileUrl)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <i className="fi fi-sr-eye text-xs" />
                          {t('previewFile')}
                        </button>
                      )}
                    </td>
                    <td className="p-4 text-right text-xs text-zinc-400">{new Date(r.createdAt).toLocaleTimeString('th-TH')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case 'qa_board':
        return (
          <div className="space-y-3">
            {stepRes
              .sort((a: { content: { upvotes?: number } }, b: { content: { upvotes?: number } }) => (b.content?.upvotes || 0) - (a.content?.upvotes || 0))
              .map((r: { _id: string; studentName?: string; content: { question?: string; upvotes?: number; isAnswered?: boolean }; createdAt: string }) => (
                <div key={r._id} className={`p-4 rounded-xl backdrop-blur-sm border shadow-sm ${
                  r.content?.isAnswered
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50'
                }`}>
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-blue-600 dark:text-blue-400 mb-1">{r.studentName || 'Anonymous'}</p>
                      <p className="text-zinc-700 dark:text-zinc-300 break-words">{r.content?.question}</p>
                      <p className="text-xs text-zinc-400 mt-1">
                        {r.content?.upvotes || 0} upvote{r.content?.upvotes !== 1 ? 's' : ''} · {new Date(r.createdAt).toLocaleTimeString('th-TH')}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {r.content?.isAnswered && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 font-medium">Answered</span>
                      )}
                      <button onClick={() => handleToggleAnswered(r._id, !!r.content?.isAnswered)} className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors" title="Toggle answered">
                        <i className="fi fi-sr-check text-sm" />
                      </button>
                      <DeleteButton id={r._id} action={deleteResponse} />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        );
      case 'quiz':
        return <QuizResults responses={stepRes} session={stepSesh} onDelete={handleDelete} />;
      case 'exit_ticket':
        return <ExitTicketResults responses={stepRes} onDelete={handleDelete} />;
      default:
        return null;
    }
  };

  return (
    <div id="results-capture-area">
      <div className="flex items-center justify-between mb-4">
         <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            {hasSteps && activeStepTab === -1
              ? <>{t('allSteps')} <span className="bg-zinc-200/60 dark:bg-slate-600/60 rounded-full text-xs px-2 py-0.5 leading-none">{responses.length}</span></>
              : activeStepType
                ? <>Step {activeStepTab + 1}: {steps![activeStepTab].title} <span className="bg-zinc-200/60 dark:bg-slate-600/60 rounded-full text-xs px-2 py-0.5 leading-none">{stepCounts[activeStepTab] ?? 0}</span></>
                : <>{TOOL_LABELS[toolType] || toolType} <span className="bg-zinc-200/60 dark:bg-slate-600/60 rounded-full text-xs px-2 py-0.5 leading-none">{responses.length}</span></>}
          </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
            title="Refresh results"
          >
            <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors"
              title={fullScreen ? "Exit Full Screen" : "Full Screen"}
            >
              <i className={`fi ${fullScreen ? 'fi-sr-compress' : 'fi-sr-expand'} text-sm`} />
            </button>
          )}
          <button
            onClick={async () => {
              if (!confirm(t('removeAllResultsConfirm'))) return;
              const result = await deleteAllResponses(String(session._id));
              if (result?.error) {
                alert(result.error);
              } else {
                await fetchResponses();
              }
            }}
            className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600 transition-colors"
            title={t('removeAllResults')}
          >
            <i className="fi fi-sr-trash text-sm" />
          </button>
          <ExportButton session={session} />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
          {hasSteps && (
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 rounded-xl p-1">
              <button
                onClick={() => handleStepTabClick(-1)}
                className={`flex-shrink-0 whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  activeStepTab === -1
                    ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                }`}
              >
                {t('allSteps')}
              </button>
              {steps.map((step, idx) => (
                <button
                  key={idx}
                  onClick={() => handleStepTabClick(idx)}
                  className={`flex-shrink-0 whitespace-nowrap px-3 py-1 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    activeStepTab === idx
                      ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }`}
                >
                  {t('step', { current: idx + 1 })}: {step.title}
                </button>
              ))}
            </div>
          )}

        <div className="flex items-center gap-1 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 rounded-xl p-1">
          <button
            onClick={() => setColumnsPerRow(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              columnsPerRow === null
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
            }`}
          >
            Auto
          </button>
          {[2, 3, 4, 6, 12].map((n) => (
            <button
              key={n}
              onClick={() => setColumnsPerRow(n)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                columnsPerRow === n
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200'
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        <span className="text-zinc-300 dark:text-zinc-600">|</span>

        <div className="flex items-center gap-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-xs border border-white/60 dark:border-slate-700/50 rounded-xl px-3 py-1">
          <button
            onClick={() => setSizePercent((p) => Math.max(50, p - 10))}
            disabled={sizePercent <= 50}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <i className="fi fi-sr-minus text-xs" />
          </button>
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 min-w-[3ch] text-center">
            {sizePercent}%
          </span>
          <button
            onClick={() => setSizePercent((p) => Math.min(250, p + 10))}
            disabled={sizePercent >= 250}
            className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 disabled:opacity-30 transition-colors"
          >
            <i className="fi fi-sr-plus text-xs" />
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div style={{ zoom: `${sizePercent}%` }}>
          {displayedResponses.length === 0 ? (
          <div className="p-12 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
            <i className="fi fi-sr-inbox text-4xl text-zinc-300 dark:text-zinc-600 block mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">No responses yet. Share the session code with students!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {activeStepTab === -1 && hasSteps ? (
            steps.map((step, sidx) => {
              const stepRes = responses.filter((r: { stepIndex?: number }) => r.stepIndex === sidx);
              if (stepRes.length === 0) return null;
              const stepSesh = { ...session, config: { ...session.config, ...step.config } };
              return (
                <div key={sidx}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-bold flex items-center justify-center">
                      {sidx + 1}
                    </span>
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                      {step.title}
                    </h3>
                    <span className="text-xs text-zinc-400">({stepRes.length})</span>
                  </div>
                  {renderStepContent(step.type, stepRes, stepSesh)}
                </div>
              );
            })
          ) : (
            renderStepContent(toolType, displayedResponses, stepSession)
          )}
        </div>
)}
        </div>

        {previewFileUrl && (
          <div 
            className="fixed inset-0 z-150 flex items-center justify-center bg-black/10 p-4 animate-fade-in-up"
            onClick={() => setPreviewFileUrl(null)}
          >
            <button 
              type="button"
              className="absolute top-4 right-4 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full w-12 h-12 flex items-center justify-center transition-all z-10"
              onClick={(e) => {
                e.stopPropagation();
                setPreviewFileUrl(null);
              }}
            >
              <i className="fi fi-sr-cross text-xl flex" />
            </button>
            <div 
              className="relative w-full h-full max-w-4xl max-h-[90vh] flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {previewFileType === 'image' && (
                <img
                  src={previewFileUrl}
                  alt="File Preview"
                  className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-lg"
                />
              )}
              {previewFileType === 'pdf' && (
                <iframe
                  src={previewFileUrl}
                  className="w-full h-full rounded-lg bg-white"
                  title="PDF Preview"
                />
              )}
              {previewFileType === 'other' && (
                <div className="text-center p-8 bg-white dark:bg-slate-800 rounded-lg">
                  <i className="fi fi-sr-file text-6xl text-zinc-300 dark:text-zinc-600 mb-4 block" />
                  <p className="text-zinc-500 dark:text-zinc-400">{t('noPreviewAvailable')}</p>
                  <a 
                    href={previewFileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    <i className="fi fi-sr-download" />
                    {t('downloadAttachedFile')}
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function PollResults({ responses, session, onDelete }: { responses: { _id: string; content: { selectedOption?: string; word?: string } }[]; session: { config: { pollMode?: string; allowCustomChoices?: boolean; questions?: { options?: string[] }[] } }; onDelete: (id: string) => void }) {
  const mode = session.config?.pollMode || 'mcq';
  const rawOptions = session.config?.questions?.[0]?.options;
  const options = useMemo(() => rawOptions?.length
    ? rawOptions.map((o, i) => o || `Option ${i + 1}`)
    : ['Option A', 'Option B', 'Option C', 'Option D'],
  [rawOptions]);

  if (mode === 'wordcloud') {
    const wordCounts = useMemo(() => {
      const counts: Record<string, number> = {};
      responses.forEach((r) => {
        const word = r.content?.word?.trim();
        if (word) counts[word] = (counts[word] || 0) + 1;
      });
      return counts;
    }, [responses]);
    const sorted = useMemo(() => Object.entries(wordCounts).sort((a, b) => b[1] - a[1]), [wordCounts]);

    return (
      <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-4">Word Cloud Results</h3>
        <div className="flex flex-wrap gap-3">
          {sorted.map(([word, count]) => (
            <span
              key={word}
              className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
              style={{ fontSize: `${Math.min(1 + count * 0.3, 2.5)}rem` }}
            >
              {word} ({count})
            </span>
          ))}
        </div>
      </div>
    );
  }

  const { counts, customCounts, total } = useMemo(() => {
    const counts: Record<string, number> = {};
    const customCounts: Record<string, number> = {};
    options.forEach(o => { counts[o] = 0; });
    responses.forEach(r => {
      const opt = r.content?.selectedOption;
      if (opt) {
        if (counts[opt] !== undefined) {
          counts[opt]++;
        } else {
          customCounts[opt] = (customCounts[opt] || 0) + 1;
        }
      }
    });
    return { counts, customCounts, total: responses.length || 1 };
  }, [options, responses]);

  const sortedCustomChoices = useMemo(() => Object.entries(customCounts).sort((a, b) => b[1] - a[1]), [customCounts]);

  return (
    <div className="p-6 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-3">
      <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-2">Vote Distribution</h3>
      {options.map((opt: string) => {
        const pct = Math.round((counts[opt] / total) * 100);
        return (
          <div key={opt} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
              <span className="text-zinc-500 font-medium">{counts[opt]} ({pct}%)</span>
            </div>
            <div className="h-3 rounded-full bg-zinc-100 dark:bg-slate-700 overflow-hidden">
              <div className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all" style={{ width: `${pct}%` }} />
            </div>
</div>
          );
        })}
        {Object.keys(customCounts).length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-slate-700/50 space-y-2">
            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">Custom Choices</p>
            {sortedCustomChoices.map(([opt, count]) => {
              const pct = Math.round((count / total) * 100);
              return (
                <div key={opt} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-600 dark:text-zinc-400 italic">{opt}</span>
                    <span className="text-zinc-400 font-medium">{count} ({pct}%)</span>
                  </div>
                  <div className="h-3 rounded-full bg-zinc-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-indigo-400 dark:bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
  );
}

function QuizResults({ responses, session, onDelete }: { responses: { _id: string; studentName?: string; content: { score?: number; total?: number; answers?: Record<string, number> } }[]; session: { config: { questions?: { correctAnswer?: number }[] } }; onDelete: (id: string) => void }) {
  const total = session.config?.questions?.length || 0;

  return (
    <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-sm text-zinc-500 dark:text-zinc-400">
            <th className="p-4 font-medium">Student</th>
            <th className="p-4 font-medium text-right">Score</th>
            <th className="p-4 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {responses.map((r) => (
            <tr key={r._id} className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30">
              <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">
                {r.studentName || 'Anonymous'}
              </td>
              <td className="p-4 text-right font-bold text-blue-600 dark:text-blue-400">
                {r.content?.score || 0} / {total}
              </td>
              <td className="p-4 text-right">
                <DeleteButton id={r._id} action={deleteResponse} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExitTicketResults({ responses, onDelete }: { responses: { _id: string; studentName?: string; content: { learned?: string; question?: string; wantToKnow?: string } }[]; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {(['learned', 'question', 'wantToKnow'] as const).map((field) => (
        <div key={field} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-sm uppercase tracking-wide">
            {field === 'learned' ? 'Learned' : field === 'question' ? 'Question' : 'Want to Know'}
          </h3>
          <div className="space-y-3">
            {responses
              .filter(r => r.content?.[field])
              .map(r => (
                <div key={r._id} className="pb-3 border-b last:border-0 border-zinc-100 dark:border-slate-700/50">
                  <p className="text-xs font-semibold text-blue-600 dark:text-blue-400">{r.studentName || 'Anonymous'}</p>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">{r.content?.[field]}</p>
                </div>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}