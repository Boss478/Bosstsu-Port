import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { getClientIp, checkToolsRateLimit } from '@/lib/rate-limit';
import { getError } from '@/lib/error-code';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const studentToken = req.headers.get('student-token');

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });
  }

  if (!checkToolsRateLimit(getClientIp(req))) {
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

    const s = session as {
      currentStep?: number;
      steps?: unknown[];
      allowStudentNavigation?: boolean;
      kickedStudents?: string[];
    };
    const kicked = studentToken ? (s.kickedStudents ?? []).includes(studentToken) : false;

    return NextResponse.json(
      {
        currentStep: s.currentStep ?? -1,
        totalSteps: s.steps?.length ?? 1,
        allowStudentNavigation: s.allowStudentNavigation ?? false,
        kicked,
      },
      { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' } },
    );
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
