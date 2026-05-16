'use client';

import { useState } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import ResultsView from '@/components/admin/ResultsView';
import SessionManager from '@/components/admin/SessionManager';

interface SessionDetailShellProps {
  session: Record<string, unknown>;
  responses: Record<string, unknown>[];
}

export default function SessionDetailShell({ session, responses }: SessionDetailShellProps) {
  const [fullScreen, setFullScreen] = useState(false);

  return (
    <div className={`min-h-screen bg-blue-50 dark:bg-slate-950 ${fullScreen ? 'pt-4 pb-4' : 'pt-28 pb-12 px-4'}`}>
      <div className={fullScreen ? 'max-w-full px-4' : 'max-w-5xl mx-auto'}>
        {!fullScreen && (
          <>
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFullScreen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <i className="fi fi-sr-expand text-sm" />
                  Full Screen
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

            <SessionManager session={session} />
          </>
        )}

        {fullScreen && (
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="text-sm text-zinc-500 dark:text-zinc-400">
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{String(session.sessionCode)}</span>
              {' — '}{String(session.title)}
            </div>
            <button
              onClick={() => setFullScreen(false)}
              className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
            >
              <i className="fi fi-sr-compress text-sm" />
              Exit Full Screen
            </button>
          </div>
        )}

        <div className={fullScreen ? '' : 'mt-6'}>
          <ResultsView session={session} responses={responses} />
        </div>
      </div>
    </div>
  );
}