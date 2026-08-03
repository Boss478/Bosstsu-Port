'use client';

import ResultsView from '@/components/admin/ResultsView';
import type { ToolSessionClient } from '@/types/tools';

export interface ToolResponseClient {
  _id: string;
  sessionId: string;
  studentName?: string;
  mascot?: string;
  content: Record<string, unknown>;
  fileUrl?: string;
  stepIndex?: number;
  createdAt: string;
  updatedAt?: string;
}

interface ResultsFullPageProps {
  session: ToolSessionClient;
  initialResponses: ToolResponseClient[];
}

export default function ResultsFullPage({ session, initialResponses }: ResultsFullPageProps) {
  return (
    <div className="min-h-screen bg-blue-50 dark:bg-slate-950 p-4">
      <div className="max-w-full mx-auto">
        <div className="flex items-center justify-between mb-4 px-2">
          <div className="text-sm text-zinc-500 dark:text-zinc-400">
            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
              {String(session.sessionCode)}
            </span>
            {' — '}
            {String(session.title)}
            {' — '}
            <span className="font-semibold">
              {initialResponses.length} response{initialResponses.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <ResultsView
          session={session}
          initialResponses={initialResponses}
          fullScreen={true}
          refreshInterval={15000}
        />
      </div>
    </div>
  );
}
