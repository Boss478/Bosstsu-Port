'use client';

import nextDynamic from 'next/dynamic';
import type { LawDoc } from '@/types/lawlib';

// ssr:false required — the reader core will hydrate from localStorage later
// (see AlphabetAdventureShell pattern). Static render would hydrate-fail.
// The server page passes the law JSON through this boundary as a prop.
const LawlibReaderClient = nextDynamic(() => import('./LawlibReaderClient'), {
  loading: () => <div className="min-h-[60vh] animate-pulse bg-blue-100 dark:bg-slate-800" />,
  ssr: false,
});

export default function LawlibReaderShell({ law }: { law: LawDoc }) {
  return <LawlibReaderClient law={law} />;
}
