import { NextRequest, NextResponse } from 'next/server';
import { broadcastToSession } from '@/lib/sse-server';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = await req.json();
    const { sessionId, message, messageType, duration } = body;

    if (!sessionId || !message || !messageType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['message', 'timer', 'sticky'].includes(messageType)) {
      return NextResponse.json({ error: 'Invalid messageType' }, { status: 400 });
    }

    broadcastToSession(sessionId, { message, messageType, duration });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
