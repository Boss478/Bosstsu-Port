'use client';

import { useState, useEffect, useRef } from 'react';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface ExitTicketFormProps {
  session: any;
  stepIndex?: number;
  studentName?: string;
  mascot?: string;
  onMascotEvent?: (event: 'celebrate' | 'correct' | 'wrong') => void;
}

type StepKey = 'learned' | 'question' | 'wantToKnow';

export default function ExitTicketForm({ session, stepIndex, studentName: propName, mascot, onMascotEvent }: ExitTicketFormProps) {
  const [studentName, setStudentName] = useState(propName || '');
  const [learned, setLearned] = useState('');
  const [question, setQuestion] = useState('');
  const [wantToKnow, setWantToKnow] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const isAnimating = useRef(false);

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
      }
    } catch {
      setError(t('failedToSubmitSimple'));
    } finally {
      setSubmitting(false);
    }
  };

  const goToStep = (step: number) => {
    if (isAnimating.current) return;
    isAnimating.current = true;
    setCurrentStep(step);
    setTimeout(() => { isAnimating.current = false; }, 350);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-lg w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
          <i aria-hidden="true" className="fi fi-sr-check-circle text-6xl text-emerald-500 block mb-4" />
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{t('submittedTitle')}</h2>
          <p className="text-zinc-500 dark:text-zinc-400">{t('thankYouReflection')}</p>
        </div>
      </div>
    );
  }

  const fields = [
    {
      key: 'learned' as StepKey,
      value: learned,
      set: setLearned,
      label: t('learnedToday'),
      placeholder: t('learnedPlaceholder'),
      icon: 'fi-sr-bulb',
      color: 'emerald',
      required: true,
    },
    {
      key: 'question' as StepKey,
      value: question,
      set: setQuestion,
      label: t('questionStillHave'),
      placeholder: t('questionPlaceholder'),
      icon: 'fi-sr-interrogation',
      color: 'blue',
      required: true,
    },
    {
      key: 'wantToKnow' as StepKey,
      value: wantToKnow,
      set: setWantToKnow,
      label: t('wantToKnowMore'),
      placeholder: t('wantToKnowPlaceholder'),
      icon: 'fi-sr-search',
      color: 'purple',
      required: true,
    },
  ];

  const allFields = (
    <>
      <div className="space-y-2">
        <label className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
          <i aria-hidden="true" className={`fi fi-sr-bulb text-emerald-500`} />
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
          <i aria-hidden="true" className="fi fi-sr-interrogation text-blue-500" />
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
          <i aria-hidden="true" className="fi fi-sr-search text-purple-500" />
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
    </>
  );

  const currentField = fields[currentStep];
  const isLastStep = currentStep === fields.length - 1;
  const canSubmit = learned.trim() && question.trim() && wantToKnow.trim();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-sm font-mono">
            <i aria-hidden="true" className="fi fi-sr-ticket" />
            {session.sessionCode}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm space-y-4">
            <div className="space-y-2 sm:block hidden">
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                {t('yourNameOptional')}
              </label>
              {!propName && (
              <input
                type="text"
                value={studentName}
                onChange={e => setStudentName(e.target.value)}
                placeholder={t('anonymousPlaceholder')}
                className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              )}
            </div>

            <div className="hidden sm:block space-y-4">
              {allFields}
            </div>

            <div className="block sm:hidden space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {t('yourNameOptional')}
                </label>
                {!propName && (
                <input
                  type="text"
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder={t('anonymousPlaceholder')}
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                )}
              </div>

              <div key={currentField.key} className={`animate-slide-left`}>
                <div className="space-y-2">
                  <label className={`text-sm font-bold text-${currentField.color}-600 dark:text-${currentField.color}-400 flex items-center gap-2`}>
                    <i aria-hidden="true" className={`fi ${currentField.icon} text-${currentField.color}-500`} />
                    {currentField.label}
                  </label>
                  <textarea
                    value={currentField.value}
                    onChange={e => currentField.set(e.target.value)}
                    required={currentField.required}
                    rows={4}
                    placeholder={currentField.placeholder}
                    className={`w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-${currentField.color}-500 resize-none`}
                    autoFocus
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1)}
                  disabled={currentStep === 0}
                  className="px-4 py-2 rounded-xl bg-zinc-200 dark:bg-slate-700 text-zinc-700 dark:text-zinc-300 font-medium disabled:opacity-30 transition-all"
                >
                  <i aria-hidden="true" className="fi fi-sr-angle-left" />
                  {' '}{t('previous')}
                </button>

                <div className="flex items-center gap-1.5">
                  {fields.map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-all ${i === currentStep ? 'bg-blue-500 w-3' : 'bg-zinc-300 dark:bg-zinc-600'}`}
                    />
                  ))}
                </div>

                {!isLastStep ? (
                  <button
                    type="button"
                    onClick={() => goToStep(currentStep + 1)}
                    disabled={!currentField.value.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium disabled:opacity-30 transition-all"
                  >
                    {t('next')}{' '}
                    <i aria-hidden="true" className="fi fi-sr-angle-right" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting || !canSubmit}
                    className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 transition-all"
                  >
                    {submitting ? t('submitting') : t('submitExitTicket')}
                  </button>
                )}
              </div>
            </div>

            {error && <p className="text-sm text-red-500 bg-red-50 p-3 rounded-lg">{error}</p>}
          </div>

          <button
            type="submit"
            disabled={submitting || !canSubmit}
            className="hidden sm:block w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
          >
            {submitting ? t('submitting') : t('submitExitTicket')}
          </button>
        </form>
      </div>
    </div>
  );
}
