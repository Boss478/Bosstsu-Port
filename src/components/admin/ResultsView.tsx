'use client';

import { useState } from 'react';
import ExportButton from './ExportButton';
import DeleteButton from './DeleteButton';
import { deleteResponse, toggleQAAnswered } from '@/app/admin/tools/actions';

interface ResultsViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  responses: any[];
}

const TOOL_LABELS: Record<string, string> = {
  padlet: 'Padlet (Idea Board)',
  poll: 'Poll',
  assignment: 'Assignment',
  qa_board: 'Q&A Board',
  quiz: 'Quiz',
  exit_ticket: 'Exit Ticket',
  discussion: 'Discussion',
};

export default function ResultsView({ session, responses }: ResultsViewProps) {
  const toolType = session.type || 'padlet';
  const [, setRefresh] = useState(0);
  const forceRefresh = () => setRefresh(n => n + 1);

  const handleDelete = async (id: string) => {
    await deleteResponse(id);
    forceRefresh();
  };

  const handleToggleAnswered = async (id: string, current: boolean) => {
    await toggleQAAnswered(id, !current);
    forceRefresh();
  };

  return (
    <div id="results-capture-area">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          Results — {TOOL_LABELS[toolType] || toolType}
        </h2>
        <ExportButton session={session} responses={responses} />
      </div>

      {responses.length === 0 ? (
        <div className="p-12 rounded-2xl bg-white/40 dark:bg-slate-800/40 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
          <i className="fi fi-sr-inbox text-4xl text-zinc-300 dark:text-zinc-600 block mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400">No responses yet. Share the session code with students!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {toolType === 'padlet' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {responses.map((r: { _id: string; studentName?: string; content: { message?: string }; createdAt: string }) => (
                <div key={r._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{r.studentName || 'Anonymous'}</span>
                    <DeleteButton id={r._id} action={deleteResponse} />
                  </div>
                  <p className="text-zinc-700 dark:text-zinc-300 text-sm">{r.content?.message}</p>
                  <p className="text-xs text-zinc-400 mt-2">{new Date(r.createdAt).toLocaleTimeString('th-TH')}</p>
                </div>
              ))}
            </div>
          )}

          {toolType === 'poll' && (
            <PollResults responses={responses} session={session} onDelete={handleDelete} />
          )}

          {toolType === 'assignment' && (
            <div className="rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-zinc-200/60 dark:border-slate-700/50 text-sm text-zinc-500 dark:text-zinc-400">
                    <th className="p-4 font-medium">Student</th>
                    <th className="p-4 font-medium hidden md:table-cell">Answer</th>
                    <th className="p-4 font-medium hidden md:table-cell">File</th>
                    <th className="p-4 font-medium text-right">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {responses.map((r: { _id: string; studentName?: string; content: { answer?: string }; fileUrl?: string; createdAt: string }) => (
                    <tr key={r._id} className="border-b last:border-0 border-zinc-100/60 dark:border-slate-700/30">
                      <td className="p-4 font-semibold text-zinc-900 dark:text-zinc-100">
                        {r.studentName || 'Anonymous'}
                      </td>
                      <td className="p-4 hidden md:table-cell text-sm text-zinc-600 dark:text-zinc-400 max-w-xs truncate">
                        {r.content?.answer}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {r.fileUrl && (
                          <a href={r.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                            <i className="fi fi-sr-file text-xs" />
                            Download
                          </a>
                        )}
                      </td>
                      <td className="p-4 text-right text-xs text-zinc-400">
                        {new Date(r.createdAt).toLocaleTimeString('th-TH')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {toolType === 'qa_board' && (
            <div className="space-y-3">
              {responses
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
                        <p className="text-zinc-700 dark:text-zinc-300">{r.content?.question}</p>
                        <p className="text-xs text-zinc-400 mt-1">
                          {r.content?.upvotes || 0} upvote{r.content?.upvotes !== 1 ? 's' : ''} · {new Date(r.createdAt).toLocaleTimeString('th-TH')}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {r.content?.isAnswered && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-400 font-medium">
                            Answered
                          </span>
                        )}
                        <button
                          onClick={() => handleToggleAnswered(r._id, !!r.content?.isAnswered)}
                          className="p-1.5 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                          title="Toggle answered"
                        >
                          <i className="fi fi-sr-check text-sm" />
                        </button>
                        <DeleteButton id={r._id} action={deleteResponse} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {toolType === 'quiz' && (
            <QuizResults responses={responses} session={session} onDelete={handleDelete} />
          )}

          {toolType === 'exit_ticket' && (
            <ExitTicketResults responses={responses} onDelete={handleDelete} />
          )}

          {toolType === 'discussion' && (
            <div className="space-y-3">
              {responses.map((r: { _id: string; studentName?: string; content: { reply?: string }; createdAt: string }) => (
                <div key={r._id} className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-xs text-blue-600 dark:text-blue-400">{r.studentName || 'Anonymous'}</p>
                      <p className="text-zinc-700 dark:text-zinc-300 mt-1">{r.content?.reply}</p>
                      <p className="text-xs text-zinc-400 mt-1">{new Date(r.createdAt).toLocaleTimeString('th-TH')}</p>
                    </div>
                    <DeleteButton id={r._id} action={deleteResponse} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PollResults({ responses, session, onDelete }: { responses: { _id: string; content: { selectedOption?: string; word?: string } }[]; session: { config: { pollMode?: string; allowCustomChoices?: boolean; questions?: { options?: string[] }[] } }; onDelete: (id: string) => void }) {
  const mode = session.config?.pollMode || 'mcq';
  const rawOptions = session.config?.questions?.[0]?.options;
  const options = rawOptions?.length
    ? rawOptions.map((o, i) => o || `Option ${i + 1}`)
    : ['Option A', 'Option B', 'Option C', 'Option D'];

  if (mode === 'wordcloud') {
    const wordCounts: Record<string, number> = {};
    responses.forEach((r) => {
      const word = r.content?.word?.trim();
      if (word) wordCounts[word] = (wordCounts[word] || 0) + 1;
    });
    const sorted = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);

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
  const total = responses.length || 1;

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
            {Object.entries(customCounts).sort((a, b) => b[1] - a[1]).map(([opt, count]) => {
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