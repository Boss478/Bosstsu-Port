'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface ExitTicketFormProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function ExitTicketForm({ session }: ExitTicketFormProps) {
  const [studentName, setStudentName] = useState('');
  const [learned, setLearned] = useState('');
  const [question, setQuestion] = useState('');
  const [wantToKnow, setWantToKnow] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!submitted) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [submitted]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learned.trim() || !question.trim() || !wantToKnow.trim()) return;
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
          studentName: studentName.trim() || undefined,
          content: { learned: learned.trim(), question: question.trim(), wantToKnow: wantToKnow.trim() },
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

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
          <i className="fi fi-sr-check-circle text-6xl text-emerald-500 block mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('submittedTitle')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{t('thankYouReflection')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
            <i className="fi fi-sr-ticket" />
            {session.sessionCode}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('yourNameOptional')}
              </label>
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder={t('anonymousPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                <i className="fi fi-sr-lightbulb text-emerald-500" />
                {t('learnedToday')}
              </label>
              <textarea
                value={learned}
                onChange={e => setLearned(e.target.value)}
                required
                rows={3}
                placeholder={t('learnedPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2">
                <i className="fi fi-sr-interrogation text-blue-500" />
                {t('questionStillHave')}
              </label>
              <textarea
                value={question}
                onChange={e => setQuestion(e.target.value)}
                required
                rows={3}
                placeholder={t('questionPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                <i className="fi fi-sr-search text-purple-500" />
                {t('wantToKnowMore')}
              </label>
              <textarea
                value={wantToKnow}
                onChange={e => setWantToKnow(e.target.value)}
                required
                rows={3}
                placeholder={t('wantToKnowPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
              />
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || !learned.trim() || !question.trim() || !wantToKnow.trim()}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('submitExitTicket')}
          </button>
        </form>
      </div>
    </div>
  );
}