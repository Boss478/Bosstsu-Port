'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import MascotSelector from './mascots/MascotSelector';
import MascotAvatar from './mascots/MascotAvatar';
import MascotCompanion, { type MascotEvent } from './mascots/MascotCompanion';
import { getMascotStorageKey, loadMascotId, saveMascotId, getRandomMascot } from './mascots/mascot-data';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

interface MultiStepSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function MultiStepSessionView({ session }: MultiStepSessionViewProps) {
  const totalSteps = session.steps?.length ?? 0;
  const [currentStep, setCurrentStep] = useState(session.currentStep ?? 0);
  const [transitioning, setTransitioning] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [showMascotPicker, setShowMascotPicker] = useState(false);
  const [mascotEventType, setMascotEventType] = useState<MascotEvent | null>(null);
  const [mascotEventCount, setMascotEventCount] = useState(0);

  const nameStorageKey = `tool_name_${session._id}`;
  const isVisible = useRef(true);
  const latestStepRef = useRef(currentStep);
  const nameConfirmedRef = useRef(nameConfirmed);

  const enableMascots = session.config?.enableMascots !== false;

  useEffect(() => { latestStepRef.current = currentStep; }, [currentStep]);
  useEffect(() => { nameConfirmedRef.current = nameConfirmed; }, [nameConfirmed]);

  useEffect(() => {
    if (session.requireStudentName) {
      const saved = localStorage.getItem(nameStorageKey);
      if (saved) {
        setStudentName(saved);
        setNameConfirmed(true);
      }
    }
  }, [session.requireStudentName, nameStorageKey]);

  useEffect(() => {
    if (!enableMascots) return;
    const id = loadMascotId(session._id);
    setSelectedMascot(id);

    if (!session.requireStudentName) {
      const existing = localStorage.getItem(getMascotStorageKey(session._id));
      if (!existing) setShowMascotPicker(true);
    }
  }, [session._id, session.requireStudentName, enableMascots]);

  const handleConfirmName = () => {
    localStorage.setItem(nameStorageKey, studentName);
    setNameConfirmed(true);
  };

  const handleMascotSelect = (id: string) => {
    setSelectedMascot(id);
    saveMascotId(session._id, id);
  };

  const handleMascotPickerDone = () => {
    if (!selectedMascot) {
      const id = getRandomMascot().id;
      setSelectedMascot(id);
      saveMascotId(session._id, id);
    }
    setShowMascotPicker(false);
  };

  const handleMascotEvent = useCallback((event: MascotEvent) => {
    setMascotEventType(event);
    setMascotEventCount((c) => c + 1);
  }, []);

  // Race condition fix: poll unconditionally, never gated on nameConfirmed
  const pollStep = useCallback(async () => {
    if (!isVisible.current) return;
    try {
      const token = getStudentToken();
      const res = await fetch(`/api/tools/step?sessionId=${session._id}&studentToken=${encodeURIComponent(token)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.kicked) {
        if (session.requireStudentName && nameConfirmedRef.current) {
          localStorage.removeItem(nameStorageKey);
          setStudentName('');
          setNameConfirmed(false);
          return;
        }
        if (!session.requireStudentName) {
          window.location.href = '/study';
          return;
        }
      }
      if (data.currentStep !== latestStepRef.current) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentStep(data.currentStep);
          latestStepRef.current = data.currentStep;
          setTransitioning(false);
        }, 300);
      }
    } catch {
      // silent
    }
  }, [session._id, nameStorageKey]);

  useEffect(() => {
    const interval = setInterval(pollStep, 10000);
    const onVisibility = () => { isVisible.current = !document.hidden; };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, [pollStep]);

  const requirePicker = enableMascots && showMascotPicker && !session.requireStudentName;
  if (requirePicker) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-950">
        <div className="max-w-md w-full p-6 text-center">
          <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
            {t('yourName')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1 mb-4">{session.title}</p>
          <MascotSelector selectedId={selectedMascot} onSelect={handleMascotSelect} />
          <button
            onClick={handleMascotPickerDone}
            className="w-full mt-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    );
  }

  if (session.requireStudentName && !nameConfirmed) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-950">
          <div className="text-center max-w-md w-full p-6">
            <i aria-hidden="true" className="fi fi-sr-user text-4xl text-blue-400 block mb-4" />
            <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
              {t('yourName')}
            </h2>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={t('yourNameOptional')}
              className="w-full mt-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              autoFocus
            />
            {enableMascots && (
              <div className="mt-4">
                <MascotSelector selectedId={selectedMascot} onSelect={handleMascotSelect} />
              </div>
            )}
            <button
              onClick={handleConfirmName}
              disabled={!studentName.trim()}
              className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
            >
              {currentStep < 0 ? 'เข้าร่วม' : 'ยืนยัน'}
            </button>
            <p className="text-zinc-500 dark:text-zinc-400 mt-6 text-sm">{t('sessionCode')}</p>
            <p className="text-zinc-400 mt-1 text-5xl font-bold tracking-[0.15em] font-mono select-all">
              {session.sessionCode}
            </p>
            <button
              onClick={async () => { setRefreshing(true); await pollStep(); setRefreshing(false); }}
              disabled={refreshing}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
        </div>
        {enableMascots && selectedMascot && (
          <MascotCompanion sessionId={session._id} eventType={mascotEventType} eventCount={mascotEventCount} />
        )}
      </>
    );
  }

  if (currentStep < 0) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-blue-50 dark:bg-slate-950">
          <div className="text-center max-w-md w-full p-6">
            <i aria-hidden="true" className="fi fi-sr-hourglass text-4xl text-blue-400 animate-pulse block mb-4" />
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{session.title}</h1>
            {session.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-4">{session.description}</p>
            )}
            <h2 className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
              {t('waitingForTeacher')}
            </h2>
            {enableMascots && selectedMascot && (
              <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                <div className="w-6 h-6 rounded overflow-hidden">
                  <MascotAvatar mascotId={selectedMascot} size={24} />
                </div>
                <span>{studentName || t('anonymous')}</span>
              </div>
            )}
            {(!enableMascots || !selectedMascot) && session.requireStudentName && studentName && (
              <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mt-4">
                <i aria-hidden="true" className="fi fi-sr-user text-xs" />
                <span>{studentName}</span>
              </div>
            )}
            <p className="text-zinc-500 dark:text-zinc-400 mt-6 text-sm">{t('sessionCode')}</p>
            <p className="text-zinc-400 mt-1 text-5xl font-bold tracking-[0.15em] font-mono select-all">
              {session.sessionCode}
            </p>
            <button
              onClick={async () => { setRefreshing(true); await pollStep(); setRefreshing(false); }}
              disabled={refreshing}
              className="mt-8 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-all disabled:opacity-50"
            >
              <i className={`fi fi-sr-refresh text-sm ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
          </div>
        </div>
        {enableMascots && selectedMascot && (
          <MascotCompanion sessionId={session._id} isWaiting eventType={mascotEventType} eventCount={mascotEventCount} />
        )}
      </>
    );
  }

  const step = session.steps?.[currentStep];
  const stepConfig = { ...session, type: step?.type, config: step?.config, title: step?.title || session.title };

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
    <>
      <div className={`min-h-screen flex flex-col bg-blue-50 dark:bg-slate-950 transition-opacity duration-300 ${transitioning ? 'opacity-0' : 'opacity-100'}`}>
        <div className="p-4 max-w-5xl mx-auto w-full">
          <div className="text-center mb-3">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{session.title}</h1>
            {session.description && (
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">{session.description}</p>
            )}
          </div>
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
          {enableMascots && selectedMascot && (
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              <div className="w-5 h-5 rounded overflow-hidden">
                <MascotAvatar mascotId={selectedMascot} size={20} />
              </div>
              <span>{studentName || t('anonymous')}</span>
            </div>
          )}
          {(!enableMascots || !selectedMascot) && session.requireStudentName && studentName && (
            <div className="flex items-center justify-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400 mt-1">
              <i aria-hidden="true" className="fi fi-sr-user text-xs" />
              <span>{studentName}</span>
            </div>
          )}
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
          {renderTool(stepConfig, currentStep, studentName, enableMascots && selectedMascot ? selectedMascot : undefined, enableMascots ? handleMascotEvent : undefined)}
        </div>

        <div className="text-center py-4 text-sm text-zinc-400 font-mono">
          {t('sessionCode')}: {session.sessionCode}
        </div>
      </div>
      {enableMascots && selectedMascot && (
        <MascotCompanion sessionId={session._id} eventType={mascotEventType} eventCount={mascotEventCount} />
      )}
    </>
  );
}

function renderTool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  stepIndex: number,
  studentName?: string,
  mascot?: string,
  onMascotEvent?: (e: MascotEvent) => void,
) {
  const s = session as { type?: string; config?: unknown };
  switch (s.type) {
    case 'padlet':
      return <PadletBoard session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} />;
    case 'poll':
      return <MentimeterPoll session={session} stepIndex={stepIndex} mascot={mascot} onMascotEvent={onMascotEvent} />;
    case 'assignment':
      return <AssignmentForm session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} />;
    case 'qa_board':
      return <QABoard session={session} stepIndex={stepIndex} mascot={mascot} onMascotEvent={onMascotEvent} />;
    case 'quiz':
      return <QuickQuiz session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} />;
    case 'exit_ticket':
      return <ExitTicketForm session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} />;
    default:
      return <div className="text-center py-20 text-zinc-400">{t('toolTypeNotFound')}</div>;
  }
}
