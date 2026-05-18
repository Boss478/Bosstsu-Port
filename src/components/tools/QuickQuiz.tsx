'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';

interface QuickQuizProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function QuickQuiz({ session }: QuickQuizProps) {
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const questions = session.config?.questions || [];
  const total = questions.length;
  const currentQuestion = questions[currentQ];

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
    if (Object.keys(answers).length < total) return;
    setSubmitting(true);
    setError(null);

    let score = 0;
    questions.forEach((q: { correctAnswer?: number }, i: number) => {
      if (answers[i] === q.correctAnswer) score++;
    });

    try {
      const res = await fetch(`/api/tools/poll?sessionId=${session._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: { score, total, answers },
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setSubmitted(true);
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  if (total === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-zinc-500">{t('noQuizQuestions')}</p>
      </div>
    );
  }

  if (submitted) {
    const score = Object.values(answers).reduce((acc, ans, i) => {
      return acc + (ans === questions[i]?.correctAnswer ? 1 : 0);
    }, 0);

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
          <i className="fi fi-sr-trophy text-6xl text-amber-500 block mb-4" />
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
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
          <div className="flex items-center justify-center gap-3 text-sm text-zinc-500">
            <span>{t('questionOfTotal', { current: currentQ + 1, total })}</span>
            <div className="w-32 h-2 rounded-full bg-zinc-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${((currentQ + 1) / total) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {currentQuestion && (
          <div className="p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
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
                    onChange={() => setAnswers(prev => ({ ...prev, [currentQ]: idx }))}
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
              onClick={() => setCurrentQ(prev => prev - 1)}
              className="flex-1 py-3 bg-zinc-100 dark:bg-slate-800 text-zinc-600 dark:text-zinc-400 font-bold rounded-xl hover:bg-zinc-200 transition-colors"
            >
              {t('previous')}
            </button>
          )}
          {currentQ < total - 1 ? (
            <button
              onClick={() => setCurrentQ(prev => prev + 1)}
              disabled={answers[currentQ] === undefined}
              className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {t('next')}
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting || Object.keys(answers).length < total}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? t('submitting') : t('submitQuiz')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}