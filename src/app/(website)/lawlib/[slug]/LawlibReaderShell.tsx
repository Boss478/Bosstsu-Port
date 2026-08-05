'use client';

import nextDynamic from 'next/dynamic';
import type { LawDoc } from '@/types/lawlib';
import type { DigestView } from '@/lib/lawlib/digest-view';

// ssr:false required — the reader core will hydrate from localStorage later
// (see AlphabetAdventureShell pattern). Static render would hydrate-fail.
// The server page passes the law JSON + digest view through this boundary as
// props. The loading fallback carries `lawlib-shell-loading` so no-JS users
// see the StaticFullText region instead of a dead skeleton (NIT-7).
const LawlibReaderClient = nextDynamic(() => import('./LawlibReaderClient'), {
  loading: () => (
    <div className="lawlib-shell-loading min-h-[60vh] animate-pulse bg-blue-100 dark:bg-slate-800" />
  ),
  ssr: false,
});

export default function LawlibReaderShell({
  law,
  digestView,
}: {
  law: LawDoc;
  digestView: DigestView | null;
}) {
  // key={law.slug}: mid-session client-side law switches remount the reader
  // (loop-1 #6) — activeKey/expandedKey/view state can never leak across laws.
  return <LawlibReaderClient key={law.slug} law={law} digestView={digestView} />;
}
