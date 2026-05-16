'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Breadcrumb from '@/components/Breadcrumb';
import ResultsView from '@/components/admin/ResultsView';
import SessionManager from '@/components/admin/SessionManager';

interface SessionDetailShellProps {
  session: Record<string, unknown>;
  responses: Record<string, unknown>[];
}

export default function SessionDetailShell({ session, responses }: SessionDetailShellProps) {
  const [resultsFullScreen, setResultsFullScreen] = useState(false);
  const [codeFullScreen, setCodeFullScreen] = useState(false);
  const [origin, setOrigin] = useState('');

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (resultsFullScreen) {
      document.body.classList.add('results-fullscreen');
    } else {
      document.body.classList.remove('results-fullscreen');
    }
    return () => {
      document.body.classList.remove('results-fullscreen');
    };
  }, [resultsFullScreen]);

  return (
    <>
      {codeFullScreen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity duration-300"
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
              {session.responseCount} response{session.responseCount !== 1 ? 's' : ''}
            </p>
            <p className="text-[10rem] leading-none font-bold tracking-[0.2em] font-mono text-blue-600 dark:text-blue-400 select-all mb-8">
              {String(session.sessionCode)}
            </p>
            <div className="pt-6 border-t border-zinc-200 dark:border-slate-700">
              <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Students go to:</p>
              <a
                href={`${origin}/study/${session.sessionCode}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 font-mono text-blue-600 dark:text-blue-400 hover:underline text-lg"
              >
                {origin}/study/{String(session.sessionCode)}
                <i className="fi fi-sr-arrow-up-right text-sm" />
              </a>
            </div>
          </div>
        </div>
      )}

      {resultsFullScreen && (
        <div 
          className="fixed inset-0 z-40 bg-blue-50 dark:bg-slate-950 pt-4 pb-4 px-4 overflow-auto"
          onClick={() => setResultsFullScreen(false)}
        >
          <div className="max-w-full mx-auto">
            <div className="flex items-center justify-between mb-4 px-2" onClick={(e) => e.stopPropagation()}>
              <div className="text-sm text-zinc-500 dark:text-zinc-400">
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{String(session.sessionCode)}</span>
                {' — '}{String(session.title)}
              </div>
              <button
                onClick={() => setResultsFullScreen(false)}
                className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-compress text-sm" />
                Exit Full Screen
              </button>
            </div>
            <div onClick={(e) => e.stopPropagation()}>
              <ResultsView 
                session={session} 
                initialResponses={responses}
                fullScreen={resultsFullScreen}
                onToggleFullScreen={() => setResultsFullScreen(v => !v)}
              />
            </div>
          </div>
        </div>
      )}

      {!resultsFullScreen && (
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
              <Link
                href="/admin/tools"
                className="flex items-center gap-2 px-4 py-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 rounded-xl shadow-sm text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-slate-700 transition-colors"
              >
                <i className="fi fi-sr-arrow-left" />
                All Sessions
              </Link>
            </div>

            <SessionManager 
              session={session} 
              onToggleCodeFullScreen={() => setCodeFullScreen(true)}
            />

            <div className="mt-6">
              <ResultsView 
                session={session} 
                initialResponses={responses}
                fullScreen={resultsFullScreen}
                onToggleFullScreen={() => setResultsFullScreen(v => !v)}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}