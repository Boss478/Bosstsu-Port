'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getConsent, setConsent } from '@/lib/analytics/consent';

export default function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (getConsent() === null) setVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
  }, []);

  if (!visible) return null;

  const handleAccept = () => {
    setConsent('accepted');
    setVisible(false);
  };

  const handleDecline = () => {
    setConsent('rejected');
    setVisible(false);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-3xl p-4 rounded-full bg-white/30 dark:bg-slate-900/30 backdrop-blur-[1px] hover:backdrop-blur-xs transition-all border border-blue-200/30 dark:border-slate-600/40 shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-white/30 to-white/5 dark:from-slate-800/30 dark:to-slate-900/20">
      <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 px-2">
        <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 text-center sm:text-left">
          This site uses usage data to improve your experience.{' '}
          <Link
            href="/cookie-policy"
            className="underline hover:text-blue-500 transition-colors whitespace-nowrap"
          >
            Learn more
          </Link>
        </p>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={handleDecline}
            className="px-4 py-1.5 text-sm rounded-full border border-zinc-300 dark:border-slate-600 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-slate-800 transition-colors"
          >
            Decline
          </button>
          <button
            onClick={handleAccept}
            className="px-4 py-1.5 text-sm rounded-full bg-blue-500 text-white hover:bg-blue-600 transition-colors"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
