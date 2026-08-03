'use client';

import { useState, useMemo } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';
import { useToolPoll } from '@/hooks/use-tool-poll';
import MascotAvatar from './mascots/MascotAvatar';
import type { ToolSessionClient } from '@/types/tools';

interface QABoardProps {
  session: ToolSessionClient;
  stepIndex?: number;
  mascot?: string;
  studentName?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
  sseConnected?: boolean;
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
  createdAt?: string;
}

export default function QABoard({
  session,
  stepIndex,
  mascot,
  studentName,
  onMascotEvent,
  sseConnected,
}: QABoardProps) {
  const [question, setQuestion] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [votedIds, setVotedIds] = useState<Set<string>>(() => {
    const saved =
      typeof window !== 'undefined' ? localStorage.getItem(`voted_qa_${session._id}`) : null;
    if (!saved) return new Set<string>();
    try {
      return new Set<string>(JSON.parse(saved));
    } catch {
      return new Set<string>();
    }
  });

  const {
    data: pollData,
    isLoading,
    refetch,
    queryKey,
  } = useToolPoll(session._id, stepIndex, undefined, sseConnected, session.sessionCode);
  const qc = useQueryClient();

  const submitMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'student-token': getStudentToken() },
        body: JSON.stringify({
          content: { question: question.trim(), upvotes: 0, isAnswered: false },
          ...(studentName && { studentName }),
          ...(mascot && { mascot }),
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        setError(data.error);
        return;
      }
      setQuestion('');
      onMascotEvent?.('celebrate');
      qc.invalidateQueries({ queryKey });
    },
    onError: () => setError(t('failedToSubmitSimple')),
  });

  const voteMutation = useMutation({
    mutationFn: async (questionId: string) => {
      const formData = new FormData();
      formData.append('responseId', questionId);
      formData.append('action', 'vote');
      const res = await fetch('/api/tools/edit', {
        method: 'PATCH',
        headers: { 'student-token': getStudentToken() },
        body: formData,
      });
      if (!res.ok) throw new Error('Failed');
      return questionId;
    },
    onSuccess: (questionId) => {
      setVotedIds((prev) => {
        if (prev.has(questionId)) return prev;
        const next = new Set(prev);
        next.add(questionId);
        localStorage.setItem(`voted_qa_${session._id}`, JSON.stringify([...next]));
        return next;
      });
      qc.invalidateQueries({ queryKey });
    },
  });

  const handleSubmit = () => {
    if (!question.trim()) return;
    setError(null);
    submitMutation.mutate();
  };

  const handleVote = (questionId: string) => {
    if (votedIds.has(questionId)) return;
    voteMutation.mutate(questionId);
  };

  const sorted = useMemo(
    () =>
      [...(pollData?.responses || [])].sort(
        (a, b) => ((b as Question).content?.upvotes || 0) - ((a as Question).content?.upvotes || 0),
      ),
    [pollData],
  );

  return (
    <div className="min-h-screen flex flex-col max-w-3xl mx-auto p-4 gap-4">
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          {session.title}
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          {session.config?.prompt || t('askAnonymously')}
        </p>
      </div>

      <div className="p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
        <textarea
          placeholder={session.config?.prompt || t('typeYourQuestion')}
          aria-label={session.config?.prompt || t('typeYourQuestion')}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
        {error && <p className="text-sm text-red-500 mt-2">{error}</p>}
        <button
          onClick={handleSubmit}
          disabled={submitMutation.isPending || !question.trim()}
          className="mt-3 w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
        >
          {submitMutation.isPending ? t('submitting') : t('submitQuestion')}
        </button>
      </div>

      {isLoading ? (
        <div
          className="space-y-3 pb-4"
          style={
            {
              '--sk-base': 'rgba(148,163,184,0.1)',
              '--sk-shine': 'rgba(148,163,184,0.15)',
            } as React.CSSProperties
          }
        >
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton p-4 rounded-xl h-20" />
          ))}
        </div>
      ) : (
        <div className="space-y-3 pb-4" aria-live="polite">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-zinc-900 dark:text-zinc-100">{t('questions')}</h2>
            <button
              onClick={() => refetch()}
              disabled={isLoading}
              className="p-1.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-slate-700 text-zinc-400 transition-colors disabled:opacity-50"
              title={t('refresh')}
            >
              <i className={`fi fi-sr-refresh text-sm ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {sorted.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">{t('noQuestionsYet')}</div>
          ) : (
            sorted.map((q) => (
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
                      aria-label={t('vote')}
                      aria-pressed={votedIds.has(q._id)}
                      className={`min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg transition-colors ${
                        votedIds.has(q._id)
                          ? 'text-blue-600 dark:text-blue-400 cursor-default'
                          : 'text-zinc-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                      }`}
                    >
                      <i
                        className={`fi ${votedIds.has(q._id) ? 'fi-sr-triangle-fill' : 'fi-sr-triangle'} text-lg`}
                      />
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
                        {q.createdAt &&
                          new Date(q.createdAt).toLocaleTimeString('th-TH', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                      </span>
                      {q.content?.isAnswered && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-700 font-medium">
                          {t('answered')}
                        </span>
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
