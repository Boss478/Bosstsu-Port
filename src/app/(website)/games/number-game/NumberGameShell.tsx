'use client';

import nextDynamic from 'next/dynamic';
const NumberGameClient = nextDynamic(() => import('./NumberGameClient'), {
  loading: () => <div className="min-h-screen bg-slate-950 animate-pulse" />,
  ssr: false,
});

export default function NumberGameShell() {
  return <NumberGameClient />;
}
