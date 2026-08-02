import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import mongoose from 'mongoose';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_ENTRIES_PER_PUSH = 200;
const MAX_USER_AGENT_LENGTH = 200;
const MAX_FOCUS_SNAPSHOTS = 20;

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

    const userAgent = (req.headers.get('user-agent') ?? '').slice(0, MAX_USER_AGENT_LENGTH);

    await ToolSession.findByIdAndUpdate(sessionId, {
      $push: {
        focusData: {
          $each: [
            {
              entries: entries.slice(0, MAX_ENTRIES_PER_PUSH),
              totalMs: typeof totalMs === 'number' ? totalMs : 0,
              userAgent,
              submittedAt: new Date(),
            },
          ],
          $slice: -MAX_FOCUS_SNAPSHOTS,
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
