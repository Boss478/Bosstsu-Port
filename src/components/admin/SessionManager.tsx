'use client';

import Link from 'next/link';
import { useState } from 'react';
import { endSession } from '@/app/admin/tools/actions';
import QRSessionCode from '@/components/tools/QRSessionCode';

interface SessionManagerProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
  origin?: string;
  onToggleCodeFullScreen?: () => void;
}

export default function SessionManager({ session, origin, onToggleCodeFullScreen }: SessionManagerProps) {
  const [pending, setPending] = useState(false);

  const handleEnd = async () => {
    if (!confirm('End this session? Students will no longer be able to submit responses.')) return;
    setPending(true);
    const fd = new FormData();
    fd.append('sessionId', session._id);
    await endSession(fd);
    setPending(false);
    window.location.href = '/admin/tools';
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {session.isActive ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-emerald-200 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Active
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-zinc-200 dark:bg-slate-700 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-slate-600">
            Ended
          </span>
        )}

        <span className="text-sm text-zinc-500 dark:text-zinc-400">
          {session.responseCount} response{session.responseCount !== 1 ? 's' : ''}
        </span>

        <div className="flex-1" />

        {session.isActive && (
          <button
            onClick={handleEnd}
            disabled={pending}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 font-medium rounded-xl border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
          >
            <i aria-hidden="true" className="fi fi-sr-stop text-sm" />
            End Session
          </button>
        )}
      </div>

      {session.isActive && (
        <div className="p-8 rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-blue-200 dark:border-blue-800 shadow-lg text-center relative">
          {onToggleCodeFullScreen && (
            <button
              onClick={onToggleCodeFullScreen}
              className="absolute top-4 right-4 p-2 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-blue-500 transition-colors"
              title="Full Screen"
            >
              <i aria-hidden="true" className="fi fi-sr-expand text-sm" />
            </button>
          )}
          <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">
            Share This Code With Students
          </p>
          <p className="text-7xl font-bold tracking-[0.3em] font-mono text-blue-600 dark:text-blue-400 select-all">
            {session.sessionCode}
          </p>
          <div className="mt-4 mb-2 flex justify-center">
            <QRSessionCode value={`${origin}/study/${session.sessionCode}`} size={160} />
          </div>
          <div className="pt-4 border-t border-zinc-200 dark:border-slate-700">
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-2">Students go to:</p>
            {origin ? (
              <div className="flex items-center justify-center gap-3">
                <Link
                  href={`${origin}/study/${session.sessionCode}`}
                  target="_blank"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all text-sm"
                >
                  <i aria-hidden="true" className="fi fi-sr-eye text-xs" />
                  Preview Student View
                  <i aria-hidden="true" className="fi fi-sr-arrow-up-right text-xs" />
                </Link>
                <span className="text-xs text-zinc-400 dark:text-zinc-500 font-mono select-all">
                  {origin}/study/{session.sessionCode}
                </span>
              </div>
            ) : (
              <span className="font-mono text-blue-600 dark:text-blue-400 text-sm">
                study/{session.sessionCode}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
