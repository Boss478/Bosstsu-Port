'use client';

import { useState, useEffect, useMemo } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';
import MascotAvatar from './mascots/MascotAvatar';

interface QABoardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  stepIndex?: number;
  mascot?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
}

interface Question {
  _id: string;
  studentName?: string;
  mascot?: string;
  content: {
    question: string;
    isAnswered?: boolean;
    upvotes?: number;
  };
  votes: number;
  hasVoted: boolean;
  createdAt?: string;
}

export default function QABoard({ session, stepIndex, mascot, onMascotEvent }: QABoardProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem(`voted_qa_${session._id}`) : null;
    return new Set<string>(saved ? JSON.parse(saved) : []);
  });

  const fetchQuestions = async () => {
    try {
      const stepParam = stepIndex !== undefined ? `&stepIndex=${stepIndex}` : '';
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}${stepParam}`);
      const data = await res.json();
      if (data.responses) {
        setQuestions(data.responses);
      }
      setLoading(false);
    } catch {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchQuestions();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchQuestions();
    const interval = setInterval(fetchQuestions, 10000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session._id]);

  const handleSubmit = async () => {
    if (!question.trim()) return;
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
          content: { question: question.trim(), upvotes: 0, isAnswered: false },
          ...(mascot && { mascot }),
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setQuestion('');
        onMascotEvent?.('celebrate');
        fetchQuestions();
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVote = async (questionId: string) => {
    if (votedIds.has(questionId)) return;
    const formData = new FormData();
    formData.append('responseId', questionId);
    formData.append('action', 'vote');
    try {
      const res = await fetch('/api/tools/edit', {
        method: 'PATCH',
        headers: { 'student-token': getStudentToken() },
        body: formData,
      });
      if (res.ok) {
        const newVoted = new Set(votedIds);
        newVoted.add(questionId);
        setVotedIds(newVoted);
        localStorage.setItem(`voted_qa_${session._id}`, JSON.stringify([...newVoted]));
        fetchQuestions();
      }
    } catch {
      // silent
    }
  };

  const sorted = useMemo(() => [...questions].sort((a, b) => (b.content?.upvotes || 0) - (a.content?.upvotes || 0)), [questions]);

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
        <p className="text-zinc-500 dark:text-zinc-400">{session.config?.prompt || t('askAnonymously')}</p>
      </div>

      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <textarea
          placeholder={session.config?.prompt || t('typeYourQuestion')}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitting || !question.trim()}
          className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {submitting ? t('submitting') : t('submitQuestion')}
        </button>
      </div>

      {loading ? (
        <div className="space-y-3 pb-4" style={{ '--sk-base': 'rgba(148,163,184,0.1)', '--sk-shine': 'rgba(148,163,184,0.15)' } as React.CSSProperties}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton p-4 rounded-xl h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{t('questions')}</h2>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">{t('noQuestionsYet')}</div>
          ) : (
            sorted.map(q => (
              <div
                key={q._id}
                className={`animate-fade-slide-up p-4 rounded-xl backdrop-blur-sm border shadow-sm transition-colors ${
                  q.content?.isAnswered
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-white/60 dark:bg-slate-800/60 border-white/60 dark:border-slate-700/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <button
                      onClick={() => handleVote(q._id)}
                      disabled={votedIds.has(q._id)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
                        votedIds.has(q._id)
                          ? 'text-blue-600 dark:text-blue-400 cursor-default'
                          : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <i className={`fi ${votedIds.has(q._id) ? 'fi-sr-triangle-fill' : 'fi-sr-triangle'} text-lg`} />
                    </button>
                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      {q.content?.upvotes || 0}
                    </span>
                    <span className="text-xs text-zinc-400">{t('votes')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      {q.mascot && (
                        <div className="w-4 h-4 rounded overflow-hidden shrink-0">
                          <MascotAvatar mascotId={q.mascot} size={16} />
                        </div>
                      )}
                      <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400 truncate">
                        {q.studentName || t('anonymous')}
                      </span>
                    </div>
                    <p className="text-zinc-700 dark:text-zinc-300">{q.content?.question}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-400">
                        {q.createdAt && new Date(q.createdAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {q.content?.isAnswered && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700 font-medium">{t('answered')}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}