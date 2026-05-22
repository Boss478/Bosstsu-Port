import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId)
      .select('currentStep steps.title steps.type allowStudentNavigation')
      .lean();

    if (!session) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    return NextResponse.json({
      currentStep: (session as { currentStep?: number }).currentStep ?? -1,
      totalSteps: ((session as { steps?: unknown[] }).steps?.length) ?? 1,
      allowStudentNavigation: (session as { allowStudentNavigation?: boolean }).allowStudentNavigation ?? false,
    });
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
