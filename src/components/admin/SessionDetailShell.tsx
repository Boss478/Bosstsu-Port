'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Breadcrumb from '@/components/Breadcrumb';
import ResultsView from '@/components/admin/ResultsView';
import SessionManager from '@/components/admin/SessionManager';
import QuickStartModal, { type StepConfig } from '@/components/admin/QuickStartModal';
import StageManagerModal from '@/components/admin/StageManagerModal';
import StudentList from '@/components/admin/StudentList';
import { advanceStep } from '@/app/admin/tools/actions';
import { t } from '@/lib/tool-translations';

interface SessionDetailShellProps {
  session: Record<string, unknown>;
  responses: Record<string, unknown>[];
}

export default function SessionDetailShell({ session, responses }: SessionDetailShellProps) {
  const router = useRouter();
  const [codeFullScreen, setCodeFullScreen] = useState(false);
  const [advancing, setAdvancing] = useState(false);
  const [editSessionData, setEditSessionData] = useState<Record<string, unknown> | null>(null);
  const [showStageManager, setShowStageManager] = useState(false);

  const steps = session.steps as Array<{ type: string; title: string }> | undefined;
  const hasSteps = steps && steps.length > 1;
  const initialCurrentStep = (session.currentStep as number) ?? -1;
  const initialLastActiveStep = (session.lastActiveStep as number) ?? -1;
  const isActive = session.isActive === true;

  const [localCurrentStep, setLocalCurrentStep] = useState(initialCurrentStep);
  const [localLastActiveStep, setLocalLastActiveStep] = useState(initialLastActiveStep);

  const handleAdvance = async (stepIndex: number) => {
    setAdvancing(true);
    const result = await advanceStep(String(session._id), stepIndex);
    if (result.currentStep !== undefined) {
      setLocalCurrentStep(result.currentStep);
      setLocalLastActiveStep(result.lastActiveStep ?? -1);
    }
    setAdvancing(false);
  };

  const handleToggleWaiting = async () => {
    setAdvancing(true);
    const prevStep = localCurrentStep;
    const result = await advanceStep(String(session._id), -1);
    if (result.currentStep !== undefined) {
      setLocalCurrentStep(result.currentStep);
      setLocalLastActiveStep(result.lastActiveStep ?? prevStep);
    }
    setAdvancing(false);
  };

  return (
    <>
      {codeFullScreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 transition-opacity duration-300"
          onClick={() => setCodeFullScreen(false)}
        >
          <div 
            className="relative p-12 rounded-3xl bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border border-white/60 dark:border-slate-700/50 shadow-2xl max-w-6xl w-full mx-4 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setCodeFullScreen(false)}
              className="absolute top-4 right-4 flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
            >
              <i className="fi fi-sr-compress text-sm" />
              Exit
            </button>

            <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">
              {String(session.responseCount)} response{Number(session.responseCount) !== 1 ? 's' : ''}
            </p>
            <p className="text-[10rem] leading-none font-bold tracking-[0.2em] font-mono text-blue-600 dark:text-blue-400 select-all mb-8">
              {String(session.sessionCode)}
            </p>
            <div className="pt-6 border-t border-zinc-200 dark:border-slate-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Students go to:</p>
              <a
                href={`/study/${session.sessionCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-blue-600 dark:text-blue-400 hover:underline text-lg"
              >
                /study/{String(session.sessionCode)}
                <i className="fi fi-sr-arrow-up-right text-sm" />
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 pt-28 pb-12 px-4">
        <div className="max-w-5xl mx-auto">
          <Breadcrumb items={[
            { label: 'Backend', href: '/admin' },
            { label: 'Class Tools', href: '/admin/tools' },
            { label: String(session.sessionCode) },
          ]} />

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-3">
                <i className="fi fi-sr-play text-blue-500" />
                Session <span className="font-mono tracking-widest text-blue-600 dark:text-blue-400">{String(session.sessionCode)}</span>
              </h1>
              <p className="text-zinc-500 dark:text-zinc-400 mt-1">{String(session.title)}</p>
            </div>
            <div className="flex items-center gap-3">
              {hasSteps && (
                <button
                  onClick={() => setShowStageManager(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <i className="fi fi-sr-list" />
                  Manage Stages
                </button>
              )}
              <button
                onClick={() => setEditSessionData(session)}
                className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-pencil" />
                Edit
              </button>
              <Link
                href="/admin/tools"
                className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-arrow-left" />
                All Sessions
              </Link>
            </div>
          </div>

           <SessionManager
             session={session}
             onToggleCodeFullScreen={() => setCodeFullScreen(true)}
           />
           <div className="mt-6">
             <StudentList sessionId={String(session._id)} />
           </div>

          {hasSteps && (
            <div className="mt-6 p-4 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">{t('step')}</h3>
                <div className="flex items-center gap-2">
                  {localCurrentStep === -1 && isActive && localLastActiveStep < 0 && (
                    <button
                      onClick={() => handleAdvance(0)}
                      disabled={advancing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      <i className="fi fi-sr-play text-xs" />
                      {t('startSession')}
                    </button>
                  )}
                  {localCurrentStep === -1 && isActive && localLastActiveStep >= 0 && (
                    <button
                      onClick={() => handleAdvance(localLastActiveStep)}
                      disabled={advancing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      <i className="fi fi-sr-play text-xs" />
                      Resume
                    </button>
                  )}
                  {localCurrentStep >= 0 && isActive && (
                    <button
                      onClick={handleToggleWaiting}
                      disabled={advancing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      <i className="fi fi-sr-pause text-xs" />
                      Waiting
                    </button>
                  )}
                  {localCurrentStep >= 0 && localCurrentStep < steps.length - 1 && isActive && (
                    <button
                      onClick={() => handleAdvance(localCurrentStep + 1)}
                      disabled={advancing}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all disabled:opacity-50"
                    >
                      {t('nextStep')}
                      <i className="fi fi-sr-arrow-right text-xs" />
                    </button>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {steps.map((step, idx) => {
                  const effectiveStep = localCurrentStep === -1 ? localLastActiveStep : localCurrentStep;
                  let btnClasses: string;
                  if (idx === effectiveStep) {
                    btnClasses = localCurrentStep === -1
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-blue-600 text-white shadow-sm';
                  } else if (idx < effectiveStep) {
                    btnClasses = localCurrentStep === -1
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
                  } else {
                    btnClasses = 'bg-zinc-100 dark:bg-slate-700 text-zinc-500 dark:text-zinc-400';
                  }
                  const lineClasses = idx < effectiveStep
                    ? (localCurrentStep === -1 ? 'bg-amber-400' : 'bg-emerald-400')
                    : 'bg-zinc-300 dark:bg-slate-600';
                  return (
                    <div key={idx} className="flex items-center gap-2 flex-1">
                      <button
                        onClick={() => handleAdvance(idx)}
                        disabled={advancing}
                        className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${btnClasses}`}
                      >
                        <span className="block font-bold">{idx + 1}</span>
                        <span className="block truncate">{step.title}</span>
                      </button>
                      {idx < steps.length - 1 && (
                        <div className={`w-4 h-0.5 ${lineClasses}`} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-6">
            <ResultsView 
              session={session} 
              initialResponses={responses}
              onToggleFullScreen={() => window.open(`/admin/tools/sessions/${String(session._id)}/results`, '_blank')}
              refreshInterval={15000}
              sessionCurrentStep={localCurrentStep}
            />
          </div>
        </div>
      </div>

      {showStageManager && (
        <StageManagerModal
          sessionId={String(session._id)}
          steps={steps || []}
          currentStep={localCurrentStep}
          onSuccess={() => {
            setShowStageManager(false);
            router.refresh();
          }}
          onClose={() => setShowStageManager(false)}
        />
      )}

      {editSessionData && (
        <QuickStartModal
          editingSession={{
            _id: String(editSessionData._id),
            title: String(editSessionData.title || ''),
            type: String(editSessionData.type || ''),
            config: editSessionData.config as Record<string, unknown> | undefined,
            requireStudentName: editSessionData.requireStudentName as boolean | undefined,
            steps: editSessionData.steps as StepConfig[] | undefined,
            allowStudentNavigation: editSessionData.allowStudentNavigation as boolean | undefined,
            description: String(editSessionData.description || ''),
          }}
          onSuccess={() => {
            setEditSessionData(null);
            router.refresh();
          }}
          onClose={() => setEditSessionData(null)}
        />
      )}
    </>
  );
}