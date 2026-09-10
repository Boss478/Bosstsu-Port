import type { Metadata } from 'next';
import PhonicsClient from './PhonicsClient';
import ErrorBoundary from './components/ErrorBoundary';
import PhonicsOrientationGuard from './PhonicsOrientationGuard';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Phonics Island | Boss478',
  description:
    'Master English phonemes, spelling, and vocabulary through a retro pixel-art island adventure.',
};

export default function PhonicsPage() {
  return (
    <div className="phonics-standalone-root h-[100dvh] min-h-0 w-full">
      <PhonicsOrientationGuard>
        <ErrorBoundary>
          <PhonicsClient />
        </ErrorBoundary>
      </PhonicsOrientationGuard>
    </div>
  );
}
