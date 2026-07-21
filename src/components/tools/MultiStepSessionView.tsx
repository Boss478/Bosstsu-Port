'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import ToolErrorBoundary from './ErrorBoundary';
import ToastContainer from './ToastContainer';
import { useToast } from '@/hooks/useToast';
import MascotAvatar from './mascots/MascotAvatar';
import StudentSetupScreen from './StudentSetupScreen';
import MascotCompanion, { type MascotEvent } from './mascots/MascotCompanion';
import StudentSettings from './StudentSettings';
import { getMascotStorageKey, loadMascotId, saveMascotId, getRandomMascot } from './mascots/mascot-data';
import { t } from '@/lib/tool-translations';
import { useSSE } from '@/lib/use-sse';
import { useDeviceTier } from '@/lib/device-tier-provider';
import { useFocusTrack } from '@/lib/use-focus-track';
import BroadcastBanner from './BroadcastBanner';
import ConnectionDot from './ConnectionDot';

interface MultiStepSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function MultiStepSessionView({ session }: MultiStepSessionViewProps) {
  const totalSteps = session.steps?.length ?? 0;
  const [currentStep, setCurrentStep] = useState(session.currentStep ?? 0);
  const [transitioning, setTransitioning] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [showMascotPicker, setShowMascotPicker] = useState(false);
  const [mascotEventType, setMascotEventType] = useState<MascotEvent | null>(null);
  const [mascotEventCount, setMascotEventCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toast = useToast();

  const nameStorageKey = `tool_name_${session._id}`;
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

  const { broadcastMessage, connected, clearBroadcast } = useSSE(session._id, {
    onStepChange: (newStep) => {
      if (newStep !== latestStepRef.current) {
        setTransitioning(true);
        setTimeout(() => {
          setCurrentStep(newStep);
          latestStepRef.current = newStep;
          setTransitioning(false);
        }, 300);
      }
    },
    onKicked: () => {
      if (session.requireStudentName) {
        localStorage.removeItem(nameStorageKey);
        setStudentName('');
        setNameConfirmed(false);
      } else {
        window.location.href = '/study';
      }
    },
  });

  const { setForceTier, setCustomConfig, forced } = useDeviceTier();

  useEffect(() => {
    const cfg = session.config;
    if (cfg?.forceTier) setForceTier(cfg.forceTier);
    if (cfg?.customTierConfig) setCustomConfig(cfg.customTierConfig);
  }, [session.config, setForceTier, setCustomConfig]);

  useFocusTrack(session._id, nameConfirmed);

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
    const msg = event === 'celebrate' ? t('toastSubmitted')
      : event === 'correct' ? t('toastCorrect')
      : t('toastError');
    toast.show(msg, event === 'wrong' ? 'error' : 'success');
  }, []);

  const needsMascotSetup = enableMascots && showMascotPicker && !session.requireStudentName;
  const needsNameSetup = session.requireStudentName && !nameConfirmed;

  if (needsMascotSetup || needsNameSetup) {
    return (
      <>
        <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} selectedMascot={selectedMascot} onMascotSelect={(id) => { setSelectedMascot(id); saveMascotId(session._id, id); }} />
        <StudentSetupScreen
          studentName={studentName}
          onNameChange={setStudentName}
          selectedMascot={selectedMascot}
          onMascotSelect={handleMascotSelect}
          onConfirm={session.requireStudentName ? handleConfirmName : handleMascotPickerDone}
          requireName={session.requireStudentName}
          enableMascots={enableMascots}
          sessionTitle={session.title}
          confirmLabel={session.requireStudentName ? (currentStep < 0 ? 'เข้าร่วม' : 'ยืนยัน') : 'เข้าร่วม'}
        >
          {session.requireStudentName && (
            <>
              <p className="text-zinc-500 dark:text-zinc-400 mt-6 text-sm">{t('sessionCode')}</p>
              <p className="text-zinc-400 -mt-3 text-5xl font-bold tracking-[0.15em] font-mono select-all">
                {session.sessionCode}
              </p>

            </>
          )}
        </StudentSetupScreen>
        {enableMascots && selectedMascot && (
          <MascotCompanion sessionId={session._id} eventType={mascotEventType} eventCount={mascotEventCount} onSettingsClick={() => setSettingsOpen(true)} />
        )}
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      </>
    );
  }

  if (currentStep < 0) {
    return (
      <>
        <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} selectedMascot={selectedMascot} onMascotSelect={(id) => { setSelectedMascot(id); saveMascotId(session._id, id); }} />
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

          </div>
        </div>
        {enableMascots && selectedMascot && (
          <MascotCompanion sessionId={session._id} isWaiting eventType={mascotEventType} eventCount={mascotEventCount} onSettingsClick={() => setSettingsOpen(true)} />
        )}
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
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
      {broadcastMessage && (
        <BroadcastBanner
          message={broadcastMessage.message}
          messageType={broadcastMessage.messageType}
          duration={broadcastMessage.duration}
          onDismiss={clearBroadcast}
        />
      )}
      <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} selectedMascot={selectedMascot} />
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
        <MascotCompanion sessionId={session._id} eventType={mascotEventType} eventCount={mascotEventCount} onSettingsClick={() => setSettingsOpen(true)} />
      )}
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      <div className="fixed bottom-4 right-4 z-40">
        <ConnectionDot status={connected} forced={forced} />
      </div>
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
      return <ToolErrorBoundary key="padlet"><PadletBoard session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    case 'poll':
      return <ToolErrorBoundary key="poll"><MentimeterPoll session={session} stepIndex={stepIndex} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    case 'assignment':
      return <ToolErrorBoundary key="assignment"><AssignmentForm session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    case 'qa_board':
      return <ToolErrorBoundary key="qa_board"><QABoard session={session} stepIndex={stepIndex} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    case 'quiz':
      return <ToolErrorBoundary key="quiz"><QuickQuiz session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    case 'exit_ticket':
      return <ToolErrorBoundary key="exit_ticket"><ExitTicketForm session={session} stepIndex={stepIndex} studentName={studentName} mascot={mascot} onMascotEvent={onMascotEvent} /></ToolErrorBoundary>;
    default:
      return <div className="text-center py-20 text-zinc-400">{t('toolTypeNotFound')}</div>;
  }
}
