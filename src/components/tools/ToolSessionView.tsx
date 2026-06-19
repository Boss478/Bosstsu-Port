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
import MascotSelector from './mascots/MascotSelector';
import MascotCompanion, { type MascotEvent } from './mascots/MascotCompanion';
import { getMascotStorageKey, loadMascotId, saveMascotId, getRandomMascot } from './mascots/mascot-data';
import { t } from '@/lib/tool-translations';
import { getStudentToken } from '@/lib/client-token';

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

  useEffect(() => {
    if (!nameConfirmed) return;
    const id = setInterval(async () => {
      const token = getStudentToken();
      try {
        const res = await fetch(`/api/tools/step?sessionId=${session._id}&studentToken=${encodeURIComponent(token)}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.kicked) {
          if (session.requireStudentName && nameConfirmedRef.current) {
            localStorage.removeItem(nameStorageKey);
            setStudentName('');
            setNameConfirmed(false);
          } else if (!session.requireStudentName) {
            window.location.href = '/study';
          }
        }
      } catch {
        // silent
      }
    }, 10000);
    return () => clearInterval(id);
  }, [session._id, session.requireStudentName, nameStorageKey, nameConfirmed]);

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

  if (!session.isActive) {
    return <SessionGuard session={session} />;
  }

  if (enableMascots && showMascotPicker && !session.requireStudentName) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center space-y-4">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('yourName')}</h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{session.title}</p>
          <MascotSelector selectedId={selectedMascot} onSelect={handleMascotSelect} />
          <button
            onClick={handleMascotPickerDone}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all"
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    );
  }

  const isMultiSession = session.steps && session.steps.length > 1;

  if (!isMultiSession && session.requireStudentName && !nameConfirmed) {
    return (
      <>
        <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-md w-full p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center space-y-4">
            <i aria-hidden="true" className="fi fi-sr-user text-4xl text-blue-400 block" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">{t('yourName')}</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">{session.title}</p>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              placeholder={t('yourNameOptional')}
              className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
              autoFocus
            />
            {enableMascots && (
              <MascotSelector selectedId={selectedMascot} onSelect={handleMascotSelect} />
            )}
            <button
              onClick={handleConfirmName}
              disabled={!studentName.trim()}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
            >
              เข้าร่วม
            </button>
          </div>
        </div>
        {enableMascots && selectedMascot && (
          <MascotCompanion
            sessionId={session._id}
            eventType={mascotEventType}
            eventCount={mascotEventCount}
          />
        )}
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
      {renderTool(session, sharedProps, enableMascots, selectedMascot, mascotEventType, mascotEventCount)}
      {enableMascots && selectedMascot && (
        <MascotCompanion
          sessionId={session._id}
          eventType={mascotEventType}
          eventCount={mascotEventCount}
        />
      )}
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
      return <PadletBoard {...props} />;
    case 'poll':
      return <MentimeterPoll session={session} mascot={props.mascot} onMascotEvent={props.onMascotEvent} />;
    case 'assignment':
      return <AssignmentForm {...props} />;
    case 'qa_board':
      return <QABoard session={session} mascot={props.mascot} onMascotEvent={props.onMascotEvent} />;
    case 'quiz':
      return <QuickQuiz session={session} stepIndex={undefined} studentName={props.studentName} mascot={props.mascot} onMascotEvent={props.onMascotEvent} />;
    case 'exit_ticket':
      return <ExitTicketForm {...props} />;
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
