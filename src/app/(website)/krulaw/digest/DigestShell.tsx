'use client';

import nextDynamic from 'next/dynamic';
import type { DigestView } from './digest-view';

// ssr:false — same boundary pattern as [slug]/KrulawReaderShell.tsx: the study
// client may hydrate from localStorage later (study-mode progress), and static
// render must never diverge. The server page passes the built view through
// this boundary as a prop.
const DigestStudyClient = nextDynamic(() => import('./DigestStudyClient'), {
  loading: () => <div className="min-h-[60vh] animate-pulse bg-blue-100 dark:bg-slate-800" />,
  ssr: false,
});

export default function DigestShell({ view }: { view: DigestView }) {
  return <DigestStudyClient view={view} />;
}
