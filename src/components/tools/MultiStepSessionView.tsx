'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import DiscussionForum from './DiscussionForum';
import { t } from '@/lib/tool-translations';

interface MultiStepSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function MultiStepSessionView({ session }: MultiStepSessionViewProps) {
  const totalSteps = session.steps?.length ?? 0;
  const [currentStep, setCurrentStep] = useState(session.currentStep ?? 0);
  const [transitioning, setTransitioning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const isVisible = useRef(true);

  const pollStep = useCallback(async () => {
    if (!isVisible.current) return;
    try {
      const res = await fetch(`/api/tools/step?sessionId=${session._id}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.currentStep !== currentStep) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentStep(data.currentStep);
          setTransitioning(false);
        }, 300);
      }
    } catch {
      // silent
    }
  }, [session._id, currentStep]);

  useEffect(() => {
    const interval = setInterval(pollStep, 10000);
    const onVisibility = () => { isVisible.current = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, [pollStep]);

  if (currentStep < 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-950">
        <div className="text-center">
          <i className="fi fi-sr-hourglass text-4xl text-blue-400 animate-pulse block mb-4" />
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
            {t('waitingForTeacher')}
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400 mt-6 text-sm">{t('sessionCode')}</p>
          <p className="text-zinc-400 mt-1 text-5xl font-bold tracking-[0.15em] font-mono select-all">
            {session.sessionCode}
          </p>
          <button
            onClick={async () => {
              setRefreshing(true);
              await pollStep();
              setRefreshing(false);
            }}
            disabled={refreshing}
            className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
          >
            <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
            {t('refresh')}
          </button>
        </div>
      </div>
    );
  }

  const step = session.steps?.[currentStep];
  const stepConfig = { ...session, type: step?.type, config: step?.config };

  const handlePrevStep = () => {
    if (currentStep > 0 && session.allowStudentNavigation) {
      setCurrentStep((prev: number) => prev - 1);
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps - 1 && session.allowStudentNavigation) {
      setCurrentStep((prev: number) => prev + 1);
    }
  };

  return (
    <div className={`min-h-screen flex flex-col bg-blue-50 dark:bg-slate-950 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
      <div className="p-4 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 justify-center">
          {session.steps?.map((_: unknown, i: number) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full transition-all ${
                i === currentStep
                  ? 'bg-blue-600 scale-125'
                  : i < currentStep
                    ? 'bg-blue-300 dark:bg-blue-700'
                    : 'bg-zinc-300 dark:bg-zinc-600'
              }`}
            />
          ))}
        </div>
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-2">
          {t('stepOfTotal', { current: currentStep + 1, total: totalSteps })} — {step?.title}
        </p>
      </div>

      {session.allowStudentNavigation && (
        <div className="flex justify-center gap-4 mb-4">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 0}
            className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 disabled:opacity-30"
          >
            ← Previous
          </button>
          <button
            onClick={handleNextStep}
            disabled={currentStep >= totalSteps - 1}
            className="px-4 py-2 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}

      <div className="flex-1">
        {renderTool(stepConfig, currentStep)}
      </div>

      <div className="text-center py-4 text-sm text-zinc-400 font-mono">
        {t('sessionCode')}: {session.sessionCode}
      </div>
    </div>
  );
}

function renderTool(session: unknown, stepIndex: number) {
  const s = session as { type?: string; config?: unknown };
  switch (s.type) {
    case 'padlet':
      return <PadletBoard session={session} stepIndex={stepIndex} />;
    case 'poll':
      return <MentimeterPoll session={session} stepIndex={stepIndex} />;
    case 'assignment':
      return <AssignmentForm session={session} stepIndex={stepIndex} />;
    case 'qa_board':
      return <QABoard session={session} stepIndex={stepIndex} />;
    case 'quiz':
      return <QuickQuiz session={session} stepIndex={stepIndex} />;
    case 'exit_ticket':
      return <ExitTicketForm session={session} stepIndex={stepIndex} />;
    case 'discussion':
      return <DiscussionForum session={session} stepIndex={stepIndex} />;
    default:
      return <div className="text-center py-20 text-zinc-400">{t('toolTypeNotFound')}</div>;
  }
}
