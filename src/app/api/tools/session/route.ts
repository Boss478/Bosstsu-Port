import { NextRequest, NextResponse } from 'next/server';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolSession from '@/models/ToolSession';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Missing session code' }, { status: 400 });
  }

  try {
    await dbConnect();

    const session = await ToolSession.findOne({ sessionCode: code.toUpperCase() }).lean();
    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const response = {
      _id: session._id,
      sessionCode: session.sessionCode,
      title: session.title,
      type: (session as { type?: string }).type,
      config: (session as { config?: unknown }).config,
      isActive: session.isActive,
    };

    return NextResponse.json(serializeDoc(response), { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60' } });
  } catch (err) {
    console.error('Session lookup error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}