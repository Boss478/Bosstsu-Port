'use client';

import PadletBoard from './PadletBoard';
import MentimeterPoll from './MentimeterPoll';
import AssignmentForm from './AssignmentForm';
import QABoard from './QABoard';
import QuickQuiz from './QuickQuiz';
import ExitTicketForm from './ExitTicketForm';
import DiscussionForum from './DiscussionForum';
import SessionGuard from './SessionGuard';

interface ToolSessionViewProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function ToolSessionView({ session }: ToolSessionViewProps) {
  if (!session.isActive) {
    return <SessionGuard session={session} />;
  }

  switch (session.type) {
    case 'padlet':
      return <PadletBoard session={session} />;
    case 'poll':
      return <MentimeterPoll session={session} />;
    case 'assignment':
      return <AssignmentForm session={session} />;
    case 'qa_board':
      return <QABoard session={session} />;
    case 'quiz':
      return <QuickQuiz session={session} />;
    case 'exit_ticket':
      return <ExitTicketForm session={session} />;
    case 'discussion':
      return <DiscussionForum session={session} />;
    default:
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 text-center">
            <i className="fi fi-sr-tool text-4xl text-zinc-400 block mb-3" />
            <p className="text-zinc-500">Tool type not found</p>
          </div>
        </div>
      );
  }
}