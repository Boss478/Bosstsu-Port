'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import MultiStepSessionView from './MultiStepSessionView';
import SessionGuard from './SessionGuard';
import ToolErrorBoundary from './ErrorBoundary';
import ToastContainer from './ToastContainer';
import { useToast } from '@/hooks/useToast';
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

interface ToolSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function ToolSessionView({ session }: ToolSessionViewProps) {
  const [studentName, setStudentName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);
  const [selectedMascot, setSelectedMascot] = useState<string | null>(null);
  const [showMascotPicker, setShowMascotPicker] = useState(false);
  const [mascotEventType, setMascotEventType] = useState<MascotEvent | null>(null);
  const [mascotEventCount, setMascotEventCount] = useState(0);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const toast = useToast();

  const enableMascots = session.config?.enableMascots !== false;

  const nameStorageKey = `tool_name_${session._id}`;
  const nameConfirmedRef = useRef(nameConfirmed);
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
      const key = getMascotStorageKey(session._id);
      const existing = localStorage.getItem(key);
      if (!existing) {
        setShowMascotPicker(true);
      }
    }
  }, [session._id, session.requireStudentName, enableMascots]);

  const { broadcastMessage, connected, clearBroadcast } = useSSE(session._id, {
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

  if (!session.isActive) {
    return (
      <>
        <SessionGuard session={session} mascotId={enableMascots ? selectedMascot : null} />
        <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} selectedMascot={selectedMascot} onMascotSelect={(id) => { setSelectedMascot(id); saveMascotId(session._id, id); }} />
      </>
    );
  }

  const isMultiSession = session.steps && session.steps.length > 1;
  const needsNameSetup = !isMultiSession && session.requireStudentName && !nameConfirmed;
  const needsMascotSetup = enableMascots && showMascotPicker && !session.requireStudentName;

  if (needsNameSetup || needsMascotSetup) {
    return (
      <>
        <StudentSetupScreen
          studentName={studentName}
          onNameChange={setStudentName}
          selectedMascot={selectedMascot}
          onMascotSelect={handleMascotSelect}
          onConfirm={session.requireStudentName ? handleConfirmName : handleMascotPickerDone}
          requireName={session.requireStudentName}
          enableMascots={enableMascots}
          sessionTitle={session.title}
        />
        <StudentSettings open={settingsOpen} onOpenChange={setSettingsOpen} selectedMascot={selectedMascot} onMascotSelect={(id) => { setSelectedMascot(id); saveMascotId(session._id, id); }} />
        {enableMascots && selectedMascot && (
          <MascotCompanion
            sessionId={session._id}
            eventType={mascotEventType}
            eventCount={mascotEventCount}
            onSettingsClick={() => setSettingsOpen(true)}
          />
        )}
        <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
      </>
    );
  }

  if (isMultiSession) {
    return <MultiStepSessionView session={session} />;
  }

  const sharedProps = {
    session,
    studentName: studentName || '',
    ...(enableMascots && selectedMascot
      ? { mascot: selectedMascot, onMascotEvent: handleMascotEvent }
      : {}),
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
      {renderTool(session, sharedProps, enableMascots, selectedMascot, mascotEventType, mascotEventCount)}
      {enableMascots && selectedMascot && (
        <MascotCompanion
          sessionId={session._id}
          eventType={mascotEventType}
          eventCount={mascotEventCount}
          onSettingsClick={() => setSettingsOpen(true)}
        />
      )}
      <div className="fixed bottom-4 right-4 z-40">
        <ConnectionDot status={connected} forced={forced} />
      </div>
      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </>
  );
}

function renderTool(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any,
  sharedProps: Record<string, unknown>,
  enableMascots: boolean,
  selectedMascot: string | null,
  mascotEventType: MascotEvent | null,
  mascotEventCount: number
) {
  const props = sharedProps as {
    session: unknown;
    studentName: string;
    mascot?: string;
    onMascotEvent?: (e: MascotEvent) => void;
  };

  switch (session.type) {
    case 'padlet':
      return <ToolErrorBoundary key="padlet"><PadletBoard {...props} /></ToolErrorBoundary>;
    case 'poll':
      return <ToolErrorBoundary key="poll"><MentimeterPoll session={session} mascot={props.mascot} onMascotEvent={props.onMascotEvent} /></ToolErrorBoundary>;
    case 'assignment':
      return <ToolErrorBoundary key="assignment"><AssignmentForm {...props} /></ToolErrorBoundary>;
    case 'qa_board':
      return <ToolErrorBoundary key="qa_board"><QABoard session={session} mascot={props.mascot} onMascotEvent={props.onMascotEvent} /></ToolErrorBoundary>;
    case 'quiz':
      return <ToolErrorBoundary key="quiz"><QuickQuiz session={session} stepIndex={undefined} studentName={props.studentName} mascot={props.mascot} onMascotEvent={props.onMascotEvent} /></ToolErrorBoundary>;
    case 'exit_ticket':
      return <ToolErrorBoundary key="exit_ticket"><ExitTicketForm {...props} /></ToolErrorBoundary>;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
            <i aria-hidden="true" className="fi fi-sr-tool text-4xl text-zinc-400 block mb-3" />
            <p className="text-zinc-500">{t('toolTypeNotFound')}</p>
          </div>
        </div>
      );
  }
}
