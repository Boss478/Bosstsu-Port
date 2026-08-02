import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolFocusEntry from '@/models/ToolFocusEntry';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ENTRIES_PER_PUSH = 200;
const MAX_USER_AGENT_LENGTH = 200;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, entries, totalMs } = body;

    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId) || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await dbConnect();

    const session = await ToolSession.findById(sessionId).select('isActive').lean();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: 'Session not active' }, { status: 400 });
    }

    await ToolFocusEntry.create({
      sessionId,
      entries: entries.slice(0, MAX_ENTRIES_PER_PUSH),
      totalMs: typeof totalMs === 'number' ? totalMs : 0,
      userAgent: (req.headers.get('user-agent') ?? '').slice(0, MAX_USER_AGENT_LENGTH),
      submittedAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
