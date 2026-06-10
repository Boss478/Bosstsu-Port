'use client';

import { useAnalytics } from '@/lib/analytics';
import { type ReactNode } from 'react';

interface TrackedLinkProps {
  href: string;
  eventName: string;
  metadata?: Record<string, unknown>;
  children: ReactNode;
  className?: string;
  download?: boolean;
  target?: string;
  rel?: string;
}

export function TrackedLink({
  href,
  eventName,
  metadata,
  children,
  className,
  download,
  target,
  rel,
}: TrackedLinkProps) {
  const { trackCustomEvent } = useAnalytics();
  const resolvedRel = target === '_blank' && !rel?.includes('noopener')
    ? `${rel || ''} noopener noreferrer`.trim()
    : rel;

  return (
    <a
      href={href}
      download={download}
      target={target}
      rel={resolvedRel}
      className={className}
      onClick={() => trackCustomEvent(eventName, metadata)}
    >
      {children}
    </a>
  );
}
