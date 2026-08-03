'use client';

import { useState, useEffect, startTransition } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';
import { toolKeys } from '@/lib/query/keys';

interface QuizQuestion {
  correctAnswer?: number;
  question?: string;
  options?: string[];
}

interface QuickQuizProps {
  session: {
    _id: string;
    title?: string;
    sessionCode?: string;
    steps?: unknown[];
    config?: {
      maxSubmissions?: number;
      questions?: QuizQuestion[];
    };
  };
  stepIndex?: number;
  studentName?: string;
  mascot?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
  sseConnected?: boolean;
}

export default function QuickQuiz({
  session,
  stepIndex,
  studentName,
  mascot,
  onMascotEvent,
  sseConnected,
}: QuickQuizProps) {
  const qc = useQueryClient();
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maxReached, setMaxReached] = useState(false);
  const [bestScore, setBestScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [history, setHistory] = useState<Array<{ score: number }>>([]);
  const [existingAttempts, setExistingAttempts] = useState(0);
  const [submittedAttempt, setSubmittedAttempt] = useState<number | null>(null);

  const questions = session.config?.questions || [];
  const total = questions.length;
  const currentQuestion = questions[currentQ];
  const resolvedStepCfg =
    stepIndex !== undefined
      ? ((session.steps as Record<string, unknown>[])?.[stepIndex]?.config as
          Record<string, unknown> | undefined)
      : undefined;
  const maxSubmissions =
    (resolvedStepCfg?.maxSubmissions as number | undefined) ?? session.config?.maxSubmissions ?? 1;
  const queryKey = toolKeys.poll(session._id, stepIndex);

  const { data: pollData } = useQuery({
    queryKey,
    queryFn: async () => {
      const stepParam = stepIndex !== undefined ? `&stepIndex=${stepIndex}` : '';
      const codeParam = session.sessionCode
        ? `&code=${encodeURIComponent(session.sessionCode)}`
        : '';
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}${stepParam}${codeParam}`, {
        headers: { 'student-token': getStudentToken() },
      });
      return res.json();
    },
    refetchInterval: () => (sseConnected ? 0 : 10_000 + Math.floor(Math.random() * 4_000)),
  });

  useEffect(() => {
    if (!pollData) return;
    const myResponses = (pollData.responses || []).filter(
      (r: { isOwn?: boolean }) => r.isOwn === true,
    );
    const count = myResponses.length;
    startTransition(() => {
      setExistingAttempts(count);
      if (count >= maxSubmissions && maxSubmissions > 0) {
        const totalQ = session.config?.questions?.length || 0;
        const scores = myResponses
          .map((r: { content?: Record<string, unknown> }) => (r.content?.score as number) ?? 0)
          .filter((s: number) => s >= 0);
        setBestScore(scores.length ? Math.max(...scores) : 0);
        setTotalQuestions(totalQ);
        setHistory(
          myResponses.map((r: { content?: Record<string, unknown> }) => ({
            score: (r.content?.score as number) ?? 0,
          })),
        );
        setMaxReached(true);
      }
    });
  }, [pollData, maxSubmissions, session.config?.questions?.length]);

  const submitMutation = useMutation({
    mutationFn: async () => {
      let score = 0;
      questions.forEach((q: { correctAnswer?: number }, i: number) => {
        if (answers[i] === q.correctAnswer) score++;
      });
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'student-token': getStudentToken() },
        body: JSON.stringify({
          content: { score, total, answers },
          ...(studentName && { studentName }),
          ...(mascot && { mascot }),
          ...(stepIndex !== undefined && { stepIndex }),
        }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      if (data.error) {
        if (data.bestScore !== undefined) {
          setBestScore(data.bestScore);
          setTotalQuestions(data.total);
          setHistory(data.history || []);
          setMaxReached(true);
        } else {
          setError(data.error);
        }
        return;
      }
      const score = Object.values(answers).reduce((acc, ans, i) => {
        return acc + (ans === questions[i]?.correctAnswer ? 1 : 0);
      }, 0);
      setSubmitted(true);
      setSubmittedAttempt(existingAttempts + 1);
      qc.invalidateQueries({ queryKey });
      onMascotEvent?.(score === total ? 'celebrate' : 'correct');
    },
    onError: () => setError(t('failedToSubmitSimple')),
  });

  const handleSubmit = () => {
    if (Object.keys(answers).length < total) return;
    setError(null);
    submitMutation.mutate();
  };

  if (total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">{t('noQuizQuestions')}</p>
      </div>
    );
  }

  if (maxReached) {
    return (
      <div className="min-h-screen flex items-start justify-center p-4 pt-12">
        <div className="max-w-lg w-full space-y-4">
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
              {t('attemptLeft', {
                current: Math.min(existingAttempts, maxSubmissions),
                max: maxSubmissions,
              })}
              {existingAttempts < maxSubmissions && (
                <span className="ml-2">
                  · {t('attemptsRemaining', { n: maxSubmissions - existingAttempts })}
                </span>
              )}
            </p>
            <i aria-hidden="true" className="fi fi-sr-trophy text-6xl text-amber-500 block mb-4" />
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
              {t('bestScore', { score: bestScore, total: totalQuestions })}
            </h2>
          </div>
          {history.length > 0 && (
            <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide mb-3">
                {t('attemptHistory')}
              </h3>
              <div className="space-y-2">
                {history.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-50 dark:bg-slate-900/50"
                  >
                    <span className="text-sm text-zinc-500 dark:text-zinc-400">
                      {t('attemptLabel')} {history.length - i}
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {h.score}/{totalQuestions}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (submitted) {
    const score = Object.values(answers).reduce((acc, ans, i) => {
      return acc + (ans === questions[i]?.correctAnswer ? 1 : 0);
    }, 0);
    const attemptCount = submittedAttempt ?? existingAttempts + 1;

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3">
            {t('attemptLeft', {
              current: Math.min(attemptCount, maxSubmissions),
              max: maxSubmissions,
            })}
            {attemptCount < maxSubmissions && (
              <span className="ml-2">
                · {t('attemptsRemaining', { n: maxSubmissions - attemptCount })}
              </span>
            )}
          </p>
          <i aria-hidden="true" className="fi fi-sr-trophy text-6xl text-amber-500 block mb-4" />
          <h2 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {t('scoreOfTotal', { score, total })}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            {score === total ? t('perfectGreatJob') : t('moreToGo', { n: total - score })}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            {session.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
            <span>{t('questionOfTotal', { current: currentQ + 1, total })}</span>
            <div className="w-32 h-2 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${((currentQ + 1) / total) * 100}%` }}
              />
            </div>
          </div>
          {maxSubmissions > 0 && (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
              {t('attemptLeft', {
                current: Math.min(existingAttempts + 1, maxSubmissions),
                max: maxSubmissions,
              })}
            </p>
          )}
        </div>

        {currentQuestion && (
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4 h-[360px] overflow-y-auto">
            <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              {currentQuestion.question}
            </p>
            <div className="space-y-2">
              {(currentQuestion.options || []).map((opt: string, idx: number) => (
                <label
                  key={idx}
                  className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    answers[currentQ] === idx
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500/30'
                      : 'border-zinc-200 dark:border-slate-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${currentQ}`}
                    checked={answers[currentQ] === idx}
                    onChange={() => setAnswers((prev) => ({ ...prev, [currentQ]: idx }))}
                    className="accent-blue-500 w-4 h-4"
                  />
                  <span className="text-zinc-700 dark:text-zinc-300">{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-2 text-center">{error}</p>}

        <div className="flex gap-3 mt-4">
          {currentQ > 0 && (
            <button
              onClick={() => setCurrentQ((prev) => prev - 1)}
              className="flex-1 py-3 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              {t('previous')}
            </button>
          )}
          {currentQ < total - 1 ? (
            <button
              onClick={() => setCurrentQ((prev) => prev + 1)}
              disabled={answers[currentQ] === undefined}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {t('next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitMutation.isPending || Object.keys(answers).length < total}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitMutation.isPending ? t('submitting') : t('submitQuiz')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
