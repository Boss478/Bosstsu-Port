'use client';

import { startTransition, useEffect, useState } from 'react';

function isPortraitBlocked() {
  return (
    typeof window !== 'undefined' &&
    window.innerWidth <= 1024 &&
    window.matchMedia('(orientation: portrait)').matches
  );
}

export default function PhonicsOrientationGuard({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [portraitBlocked, setPortraitBlocked] = useState(false);

  useEffect(() => {
    const updateOrientation = () => {
      startTransition(() => setPortraitBlocked(isPortraitBlocked()));
    };

    updateOrientation();
    window.addEventListener('resize', updateOrientation);
    window.addEventListener('orientationchange', updateOrientation);
    return () => {
      window.removeEventListener('resize', updateOrientation);
      window.removeEventListener('orientationchange', updateOrientation);
    };
  }, []);

  return (
    <>
      <div
        aria-hidden={portraitBlocked}
        className={portraitBlocked ? 'pointer-events-none select-none' : undefined}
        inert={portraitBlocked || undefined}
      >
        {children}
      </div>
      {portraitBlocked && (
        <div
          className="phonics-orientation-prompt"
          role="dialog"
          aria-modal="true"
          aria-labelledby="phonics-orientation-title"
          aria-describedby="phonics-orientation-description"
        >
          <div className="phonics-orientation-card">
            <div className="phonics-orientation-icon" aria-hidden="true">
              ↻
            </div>
            <p className="phonics-orientation-kicker">PHONICS ISLAND</p>
            <h1 id="phonics-orientation-title">Please rotate your device</h1>
            <p id="phonics-orientation-description">
              Turn your phone or tablet sideways to explore the island.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
