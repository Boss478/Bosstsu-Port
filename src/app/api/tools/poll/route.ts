import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { getError } from '@/lib/error-code';
import { CONFIG } from '@/lib/config';
import { getClientIp, checkToolsRateLimit } from '@/lib/rate-limit';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const since = searchParams.get('since');

  if (!sessionId) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  try {
    await dbConnect();

    const query: Record<string, unknown> = { sessionId };
    if (since) {
      query.createdAt = { $gt: new Date(parseInt(since)) };
    }
    const stepIndex = searchParams.get('stepIndex');
    if (stepIndex !== null) {
      query.stepIndex = parseInt(stepIndex);
    }

    const responses = await ToolResponse.find(query)
      .sort({ createdAt: 1 })
      .limit(CONFIG.TOOLS.PAGINATION.TOOLS_PUBLIC)
      .lean();

    const session = await ToolSession.findById(sessionId).lean();
    const count = await ToolResponse.countDocuments(query);

    return NextResponse.json({
      responses: serializeDoc(responses),
      isActive: session?.isActive ?? false,
      totalCount: count,
    }, { headers: { 'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60' } });
  } catch (err) {
    console.error('Poll error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  const studentToken = req.headers.get('student-token');
  if (!studentToken) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  const rateKey = `${sessionId}:${getClientIp(req)}:${studentToken}`;

  if (!checkToolsRateLimit(rateKey)) {
    return NextResponse.json(
      { error: getError('T06').message, code: getError('T06').code },
      { status: 429 }
    );
  }

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) {
      return NextResponse.json({ error: getError('T04').message, code: getError('T04').code }, { status: 400 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: getError('T04').message, code: getError('T04').code }, { status: 400 });
    }

    const body = await req.json();
    const { studentName, mascot, content, fileUrl, stepIndex } = body;

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const totalExisting = await ToolResponse.countDocuments({ sessionId, studentToken });

    const existingCount = stepIndex !== undefined
      ? await ToolResponse.countDocuments({ sessionId, studentToken, stepIndex })
      : totalExisting;

    const si = stepIndex !== undefined ? stepIndex : -1;
    const stepCfg = si >= 0
      ? (session.steps as Record<string, unknown>[] | undefined)?.[si]?.config as Record<string, unknown> | undefined
      : null;
    const maxSubmissions = (stepCfg?.maxSubmissions as number | undefined) ?? (session.config?.maxSubmissions as number | undefined) ?? 1;

    if (existingCount >= maxSubmissions) {
      const result: Record<string, unknown> = {
        error: getError('T07').message,
        code: getError('T07').code,
      };
      if (body.content && typeof body.content === 'object' && 'total' in body.content) {
        const histQuery: Record<string, unknown> = { sessionId, studentToken };
        if (stepIndex !== undefined) histQuery.stepIndex = stepIndex;
        const prevAttempts = await ToolResponse.find(
          histQuery,
          'content createdAt',
        ).sort({ createdAt: -1 }).lean();
        const scores = prevAttempts
          .map(a => ((a.content as Record<string, unknown>)?.score as number) ?? -1)
          .filter(s => s >= 0);
        result.bestScore = scores.length ? Math.max(...scores) : 0;
        result.total = (body.content as Record<string, unknown>).total;
        result.history = prevAttempts.map(a => ({
          score: ((a.content as Record<string, unknown>)?.score as number) ?? 0,
          date: a.createdAt,
        }));
      }
      return NextResponse.json(result, { status: 400 });
    }

    const editToken = crypto.randomUUID();

    const response = await ToolResponse.create({
      sessionId,
      studentName: studentName || null,
      mascot: mascot || null,
      content,
      fileUrl: fileUrl || null,
      studentToken,
      editToken,
      ip: getClientIp(req),
      ...(stepIndex !== undefined && { stepIndex }),
    });

    await ToolSession.findByIdAndUpdate(sessionId, {
      $inc: { responseCount: 1 },
    });

    const isFirstSubmission = totalExisting === 0;
    if (isFirstSubmission) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { participantCount: 1 },
      });
    }

    return NextResponse.json({ success: true, id: response._id, editToken });
  } catch (err) {
    console.error('Submit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}