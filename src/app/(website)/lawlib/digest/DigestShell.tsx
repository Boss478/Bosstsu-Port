'use client';

import nextDynamic from 'next/dynamic';
import type { DigestView } from '@/lib/lawlib/digest-view';

// next/dynamic keeps the study client code-split from the server page bundle.
// No `ssr: false`: the digest has no localStorage dependency, so the client
// tree SSR's to full static HTML (crawlers get the content). The server page
// passes the built view through this boundary as a prop.
const DigestStudyClient = nextDynamic(() => import('./DigestStudyClient'), {
  loading: () => <div className="min-h-[60vh] animate-pulse bg-blue-100 dark:bg-slate-800" />,
});

export default function DigestShell({ view }: { view: DigestView }) {
  return <DigestStudyClient view={view} />;
}
