'use server';

import dbConnect from '@/lib/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';

export async function trackServerEvent(event: {
  path: string;
  eventName: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await dbConnect();
    await AnalyticsEvent.create({
      type: 'custom',
      path: event.path,
      timestamp: new Date(),
      sessionId: 'server',
      eventName: event.eventName,
      metadata: event.metadata || {},
      deviceType: 'desktop',
    });
  } catch {
    // silent
  }
}
