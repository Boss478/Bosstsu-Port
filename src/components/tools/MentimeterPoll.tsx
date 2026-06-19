'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface MentimeterPollProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  stepIndex?: number;
  mascot?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
}

export default function MentimeterPoll({ session, stepIndex, mascot, onMascotEvent }: MentimeterPollProps) {
  const [responses, setResponses] = useState<{ _id: string; content: { selectedOption?: string; word?: string } }[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [word, setWord] = useState('');
  const [customMode, setCustomMode] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const STORAGE_KEY = `poll_voted_${session._id}`;

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(STORAGE_KEY)) {
      setSubmitted(true);
    }
  }, [session._id]);

  const pollMode = session.config?.pollMode || 'mcq';
  const rawOptions = session.config?.questions?.[0]?.options;
  const options = rawOptions?.length
    ? rawOptions.map((o: string, i: number) => o || `ตัวเลือก ${i + 1}`)
    : ['ตัวเลือก ก', 'ตัวเลือก ข', 'ตัวเลือก ค', 'ตัวเลือก ง'];
  const allowCustom = session.config?.allowCustomChoices || false;
  const questionText = session.config?.questions?.[0]?.question;

  const fetchPoll = async () => {
    try {
      const stepParam = stepIndex !== undefined ? `&stepIndex=${stepIndex}` : '';
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}${stepParam}`);
      const data = await res.json();
      if (data.responses) {
        setResponses(data.responses);
      }
      if (typeof data.totalCount === 'number') {
        setTotalCount(data.totalCount);
      }
    } catch {
      // silent fail for polling
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchPoll();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPoll();
    const interval = setInterval(fetchPoll, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id]);

  useEffect(() => {
    if (!submitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitted]);

  const handleSubmit = async () => {
    if (pollMode === 'mcq') {
      if (customMode && !customValue.trim()) return;
      if (!customMode && !selected) return;
    }
    if (pollMode === 'wordcloud' && !word.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'student-token': getStudentToken(),
        },
        body: JSON.stringify({
          content: pollMode === 'mcq'
            ? { selectedOption: customMode ? customValue.trim() : selected }
            : { word: word.trim() },
          ...(mascot && { mascot }),
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSubmitted(true);
        onMascotEvent?.('celebrate');
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEY, 'true');
        }
        fetchPoll();
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  const counts: Record<string, number> = {};
  const customCounts: Record<string, number> = {};
  if (pollMode === 'mcq') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options.forEach((o: any) => { counts[o] = 0; });
    responses.forEach(r => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const opt = (r.content as any)?.selectedOption;
      if (opt) {
        if (counts[opt] !== undefined) {
          counts[opt]++;
        } else {
          customCounts[opt] = (customCounts[opt] || 0) + 1;
        }
      }
    });
  }

  const wordCounts: Record<string, number> = {};
  if (pollMode === 'wordcloud') {
    responses.forEach(r => {
      const w = r.content?.word?.trim();
      if (w) wordCounts[w] = (wordCounts[w] || 0) + 1;
    });
  }

  const sortedWords = Object.entries(wordCounts).sort((a, b) => b[1] - a[1]);

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{session.config?.prompt || t('voteNow')}</p>
        {questionText && (
          <p className="text-lg mt-4 text-zinc-600 dark:text-zinc-400">{questionText}</p>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        {submitted ? (
          <div className="text-center py-8">
            <i aria-hidden="true" className="fi fi-sr-check-circle text-5xl text-emerald-500 block mb-3" />
            <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{t('voteSubmitted')}</p>
            <p className="text-sm text-zinc-400 mt-1">{t('resultsAutoUpdate')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pollMode === 'mcq' ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {options.map((opt: any) => (
                  <label
                    key={opt}
                    className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      selected === opt && !customMode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30'
                        : 'border-zinc-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="option"
                      value={opt}
                      checked={selected === opt && !customMode}
                      onChange={() => { setSelected(opt); setCustomMode(false); }}
                      className="accent-blue-500 w-4 h-4"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-medium">{opt}</span>
                  </label>
                ))}
                {allowCustom && (
                  <label
                    className={`flex flex-col gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                      customMode
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30'
                        : 'border-zinc-200 dark:border-slate-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="option"
                        value="__custom__"
                        checked={customMode}
                        onChange={() => { setSelected(null); setCustomMode(true); }}
                        className="accent-blue-500 w-4 h-4"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300 font-medium">{t('otherTypeYourOwn')}</span>
                    </div>
                    {customMode && (
                      <input
                        type="text"
                        value={customValue}
                        onChange={e => setCustomValue(e.target.value)}
                        placeholder={t('typeCustomOption')}
                        className="ml-7 w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    )}
                  </label>
                )}
              </div>
            ) : (
              <input
                type="text"
                placeholder={t('typeAnswerEnter')}
                value={word}
                onChange={e => setWord(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSubmit(); } }}
                className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
              />
            )}

            {error && <p className="text-sm text-red-500">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting || (pollMode === 'mcq' ? (customMode ? !customValue.trim() : !selected) : !word.trim())}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submitVote')}
            </button>
          </div>
        )}
      </div>

      <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{t('liveResults')}</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refreshResultsTitle')}
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <span className="text-xs text-zinc-400">
              {totalCount} {totalCount !== 1 ? t('votes') : t('vote')}
            </span>
          </div>
        </div>

        {pollMode === 'mcq' ? (
          <div className="space-y-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {options.map((opt: any) => {
              const pct = responses.length ? Math.round((counts[opt] / responses.length) * 100) : 0;
              return (
                <div key={opt} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                    <span className="text-zinc-500 font-medium">{counts[opt]} ({pct}%)</span>
                  </div>
                  <div className="h-4 rounded-full bg-zinc-100 dark:bg-slate-700 overflow-hidden">
                    <div className="h-full rounded-full bg-blue-500 dark:bg-blue-400 transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
            {Object.keys(customCounts).length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-200/60 dark:border-slate-700/50 space-y-2">
                <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">{t('customChoices')}</p>
                {Object.entries(customCounts).sort((a, b) => b[1] - a[1]).map(([opt, count]) => {
                  const pct = responses.length ? Math.round((count / responses.length) * 100) : 0;
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
        ) : (
          <div className="flex flex-wrap gap-3 min-h-16">
            {sortedWords.length === 0 ? (
              <p className="text-sm text-zinc-400">{t('noResponsesYet')}</p>
            ) : (
              sortedWords.map(([w, count]) => (
                <span
                  key={w}
                  className="px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-bold border border-blue-200 dark:border-blue-800"
                  style={{ fontSize: `${Math.min(1 + count * 0.3, 2.5)}rem` }}
                >
                  {w} ({count})
                </span>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}