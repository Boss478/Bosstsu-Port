'use client';

import nextDynamic from 'next/dynamic';
const AlphabetAdventureClient = nextDynamic(() => import('./AlphabetAdventureClient'), {
  loading: () => <div className="min-h-screen bg-slate-950 animate-pulse" />,
  ssr: false,
});

export default function AlphabetAdventureShell() {
  return <AlphabetAdventureClient />;
}
