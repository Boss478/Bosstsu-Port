'use client';

import { useState, useEffect } from 'react';
import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import MultiStepSessionView from './MultiStepSessionView';
import SessionGuard from './SessionGuard';
import { t } from '@/lib/tool-translations';

interface ToolSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function ToolSessionView({ session }: ToolSessionViewProps) {
  const [studentName, setStudentName] = useState('');
  const [nameConfirmed, setNameConfirmed] = useState(false);

  const nameStorageKey = `tool_name_${session._id}`;

  useEffect(() => {
    if (session.requireStudentName) {
      const saved = localStorage.getItem(nameStorageKey);
      if (saved) {
        setStudentName(saved);
        setNameConfirmed(true);
      }
    }
  }, [session.requireStudentName, nameStorageKey]);

  const handleConfirmName = () => {
    localStorage.setItem(nameStorageKey, studentName);
    setNameConfirmed(true);
  };

  if (!session.isActive) {
    return <SessionGuard session={session} />;
  }

  const isMultiSession = session.steps && session.steps.length > 1;

  if (!isMultiSession && session.requireStudentName && !nameConfirmed) {
    return (
      <div className="min-h-screen bg-blue-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full p-6 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center space-y-4">
          <i className="fi fi-sr-user text-4xl text-blue-400 block" />
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {t('yourName')}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {session.title}
          </p>
          <input
            type="text"
            value={studentName}
            onChange={e => setStudentName(e.target.value)}
            placeholder={t('yourNameOptional')}
            className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-zinc-200 dark:border-slate-700 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
            autoFocus
          />
          <button
            onClick={handleConfirmName}
            disabled={!studentName.trim()}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold rounded-xl transition-all disabled:cursor-not-allowed"
          >
            เข้าร่วม
          </button>
        </div>
      </div>
    );
  }

  if (isMultiSession) {
    return <MultiStepSessionView session={session} />;
  }

  const sharedProps = { session, studentName: studentName || '' };

  switch (session.type) {
    case 'padlet':
      return <PadletBoard {...sharedProps} />;
    case 'poll':
      return <MentimeterPoll session={session} />;
    case 'assignment':
      return <AssignmentForm {...sharedProps} />;
    case 'qa_board':
      return <QABoard session={session} />;
    case 'quiz':
      return <QuickQuiz session={session} />;
    case 'exit_ticket':
      return <ExitTicketForm {...sharedProps} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
            <i className="fi fi-sr-tool text-4xl text-zinc-400 block mb-3" />
            <p className="text-zinc-500">{t('toolTypeNotFound')}</p>
          </div>
        </div>
      );
  }
}
