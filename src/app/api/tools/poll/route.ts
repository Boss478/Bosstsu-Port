import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { getError } from '@/lib/error-code';
import { CONFIG } from '@/lib/config';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= CONFIG.TOOLS.RATE_LIMIT_PER_MINUTE) return false;
  entry.count++;
  return true;
}

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
      responses: JSON.parse(JSON.stringify(responses)),
      isActive: session?.isActive ?? false,
      totalCount: count,
    });
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

  if (!checkRateLimit(rateKey)) {
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
    const { studentName, content, fileUrl, stepIndex } = body;

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const existingCount = await ToolResponse.countDocuments({
      sessionId,
      studentToken,
    });

    const maxSubmissions = session.config?.maxSubmissions || 10;

    if (existingCount >= maxSubmissions) {
      return NextResponse.json(
        { error: getError('T07').message, code: getError('T07').code },
        { status: 400 }
      );
    }

    const editToken = crypto.randomUUID();

    const response = await ToolResponse.create({
      sessionId,
      studentName: studentName || null,
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

    const count = await ToolResponse.countDocuments({ sessionId, studentToken });
    if (count === 1) {
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