import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { verifyAuth } from '@/lib/auth';
import { getClientIp, checkToolsRateLimit } from '@/lib/rate-limit';
import { getError } from '@/lib/error-code';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const studentToken = searchParams.get('studentToken');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  const rateKey = `${sessionId}:${getClientIp(req)}:${studentToken || 'anon'}`;
  if (!checkToolsRateLimit(rateKey)) {
    return NextResponse.json(
      { error: getError('T06').message, code: getError('T06').code },
      { status: 429, headers: { 'Retry-After': '10' } },
    );
  }

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId)
      .select('currentStep steps.title steps.type allowStudentNavigation kickedStudents')
      .lean();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const s = session as { currentStep?: number; steps?: unknown[]; allowStudentNavigation?: boolean; kickedStudents?: string[] };
    const kicked = studentToken ? (s.kickedStudents ?? []).includes(studentToken) : false;

    return NextResponse.json({
      currentStep: s.currentStep ?? -1,
      totalSteps: s.steps?.length ?? 1,
      allowStudentNavigation: s.allowStudentNavigation ?? false,
      kicked,
    }, { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' } });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { sessionId, stepIndex } = body;

    if (!sessionId || typeof stepIndex !== 'number') {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await dbConnect();
    const session = await ToolSession.findById(sessionId)
      .select('steps')
      .lean();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const totalSteps = ((session as { steps?: unknown[] }).steps?.length) ?? 1;
    if (stepIndex < -1 || stepIndex >= totalSteps) {
      return NextResponse.json({ error: 'Invalid step index' }, { status: 400 });
    }

    await ToolSession.findByIdAndUpdate(sessionId, { currentStep: stepIndex });

    return NextResponse.json({ currentStep: stepIndex });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
