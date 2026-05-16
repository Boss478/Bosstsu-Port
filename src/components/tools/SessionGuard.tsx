'use client';

import Link from 'next/link';

interface SessionGuardProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  session: any;
}

export default function SessionGuard({ session }: SessionGuardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-md w-full p-8 rounded-2xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-white/60 dark:border-slate-700/50 shadow-lg text-center">
        <i className="fi fi-sr-clock text-6xl text-zinc-300 dark:text-zinc-600 block mb-4" />
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
          Session Ended
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400 mb-6">
          This session has been closed by the teacher. Thank you for participating!
        </p>
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Session code: <span className="font-mono font-bold text-blue-600">{session.sessionCode}</span>
          </p>
          {session.endedAt && (
            <p className="text-xs text-zinc-400">
              Ended at: {new Date(session.endedAt).toLocaleString('th-TH')}
            </p>
          )}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all mt-4"
          >
            <i className="fi fi-sr-home" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}