import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId, entries, totalMs } = body;

    if (!sessionId || !Array.isArray(entries)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    await dbConnect();

    await ToolSession.findByIdAndUpdate(sessionId, {
      $push: {
        focusData: {
          entries,
          totalMs,
          userAgent: req.headers.get('user-agent') ?? '',
          submittedAt: new Date(),
        },
      },
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
