import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import AnalyticsEvent from '@/models/AnalyticsEvent';
import { getEnv } from '@/lib/env';
import { checkAnalyticsRateLimit, getClientIp } from '@/lib/rate-limit';
import { CONFIG } from '@/lib/config';
import crypto from 'node:crypto';

export async function POST(request: NextRequest) {
  const dnt = request.headers.get('dnt');
  if (dnt === '1') {
    return NextResponse.json({ error: 'Tracking disabled by DNT' }, { status: 451 });
  }

  const ip = getClientIp(request);
  const allowed = checkAnalyticsRateLimit(ip, CONFIG.ANALYTICS.RATE_LIMIT, 60000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: { events?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const rawEvents = body?.events;
  if (!Array.isArray(rawEvents) || rawEvents.length === 0) {
    return NextResponse.json({ error: 'No events provided' }, { status: 400 });
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > CONFIG.ANALYTICS.MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Request too large' }, { status: 413 });
  }

  if (rawEvents.length > CONFIG.ANALYTICS.MAX_BATCH_SIZE) {
    return NextResponse.json({ error: 'Too many events' }, { status: 400 });
  }

  const salt = getEnv().ANALYTICS_SALT || '';
  const ipHash = crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');

  const valid: Record<string, unknown>[] = [];
  for (const e of rawEvents) {
    if (typeof e !== 'object' || e === null) continue;
    const event = e as Record<string, unknown>;
    if (
      (event.type !== 'pageview' && event.type !== 'custom') ||
      typeof event.path !== 'string' ||
      event.path.length > 200 ||
      typeof event.sessionId !== 'string' ||
      !event.sessionId ||
      (event.type === 'pageview' && event.path.startsWith('/test/'))
    )
      continue;

    const metadata = event.metadata;
    if (metadata !== undefined && typeof metadata === 'object' && metadata !== null) {
      const metaStr = JSON.stringify(metadata);
      if (metaStr.length > CONFIG.ANALYTICS.MAX_METADATA_BYTES) {
        event.metadata = { _truncated: true };
      }
    }

    valid.push({
      ...event,
      ipHash,
      timestamp: new Date(),
      userAgent: typeof event.userAgent === 'string' ? event.userAgent.slice(0, 200) : undefined,
    });
  }

  if (valid.length === 0) {
    return NextResponse.json({ error: 'No valid events' }, { status: 400 });
  }

  await dbConnect();
  await AnalyticsEvent.insertMany(valid, { ordered: false });

  return new NextResponse(null, { status: 204 });
}
