import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import mongoose from 'mongoose';
import dbConnect, { serializeDoc } from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { getError } from '@/lib/error-code';
import { CONFIG } from '@/lib/config';
import { getClientIp, checkToolsRateLimit, hashClientId } from '@/lib/rate-limit';

const PUBLIC_LIMIT = 500; // higher bounded limit — boards must not truncate at 50
const MAX_NAME_LENGTH = 50;
const MAX_CONTENT_BYTES = 10 * 1024;

// Whitelist of known mascot ids — kept as a plain id-set so API bundles don't
// pull in the sprite data from the client mascot module.
const MASCOT_ID_SET = new Set([
  'fox',
  'cat',
  'bear',
  'bunny',
  'penguin',
  'alien',
  'ninja',
  'dog',
  'ghost',
  'nox',
  'mira',
  'chip',
]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  const requestedLimit = searchParams.get('limit');
  const isAdminRequest = requestedLimit !== null && parseInt(requestedLimit) > PUBLIC_LIMIT;

  if (isAdminRequest) {
    const { verifyAuth } = await import('@/lib/auth');
    const isAuth = await verifyAuth();
    if (!isAuth) {
      return NextResponse.json({ error: getError('401').message }, { status: 401 });
    }
  }

  const limit = isAdminRequest
    ? Math.min(parseInt(requestedLimit as string), CONFIG.TOOLS.PAGINATION.ADMIN_RESPONSES_LIMIT)
    : PUBLIC_LIMIT;

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    // Gate public reads on the join code (PII guard — sessionIds are enumerable)
    if (!isAdminRequest) {
      const code = searchParams.get('code');
      if (!code || code.toUpperCase() !== (session as { sessionCode?: string }).sessionCode) {
        return NextResponse.json({ error: getError('T05').message }, { status: 400 });
      }
    }

    const query: Record<string, unknown> = { sessionId };
    const stepIndex = searchParams.get('stepIndex');
    if (stepIndex !== null) {
      query.stepIndex = parseInt(stepIndex);
    }

    const responses = await ToolResponse.find(query)
      .select('-editToken -ip -voters')
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .lean();

    const count = await ToolResponse.countDocuments(query);

    const aggregateMatch: Record<string, unknown> = {
      sessionId: new mongoose.Types.ObjectId(sessionId),
    };
    if (stepIndex !== null) {
      aggregateMatch.stepIndex = parseInt(stepIndex);
    }

    const [stats] = await ToolResponse.aggregate([
      { $match: aggregateMatch },
      {
        $facet: {
          options: [{ $group: { _id: '$content.selectedOption', n: { $sum: 1 } } }],
          words: [{ $group: { _id: '$content.word', n: { $sum: 1 } } }],
        },
      },
    ]);

    const counts = {
      options: Object.fromEntries(
        (stats?.options ?? [])
          .filter((x: { _id: unknown }) => x._id != null)
          .map((x: { _id: string; n: number }) => [x._id, x.n]),
      ),
      words: Object.fromEntries(
        (stats?.words ?? [])
          .filter((x: { _id: unknown }) => x._id != null)
          .map((x: { _id: string; n: number }) => [x._id, x.n]),
      ),
    };

    const studentToken = req.headers.get('student-token');
    const publicResponses = responses.map((r) => {
      const { studentToken: token, ...rest } = r;
      return { ...rest, isOwn: studentToken !== null && token === studentToken };
    });

    return NextResponse.json(
      {
        responses: serializeDoc(publicResponses),
        isActive: session?.isActive ?? false,
        totalCount: count,
        counts,
      },
      {
        headers: {
          'Cache-Control': 'private, no-store',
        },
      },
    );
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

  // Rate key: IP only — never client-controlled tokens
  if (!checkToolsRateLimit(getClientIp(req))) {
    return NextResponse.json(
      { error: getError('T06').message, code: getError('T06').code },
      { status: 429 },
    );
  }

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) {
      return NextResponse.json(
        { error: getError('T04').message, code: getError('T04').code },
        { status: 400 },
      );
    }
    if (!session.isActive) {
      return NextResponse.json(
        { error: getError('T04').message, code: getError('T04').code },
        { status: 400 },
      );
    }

    const body = await req.json();
    const { studentName, mascot, content, fileUrl, stepIndex } = body;

    if (!content || typeof content !== 'object') {
      return NextResponse.json({ error: 'Invalid content' }, { status: 400 });
    }

    const steps = session.steps as Record<string, unknown>[] | undefined;

    let siVal = -1;
    if (stepIndex !== undefined) {
      siVal = Number(stepIndex);
      const stepCount = steps?.length ?? 0;
      if (!Number.isInteger(siVal) || siVal < 0 || siVal >= stepCount) {
        return NextResponse.json({ error: 'Invalid stepIndex' }, { status: 400 });
      }
    }

    const name = typeof studentName === 'string' ? studentName.trim() : undefined;
    if (name && name.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    }
    if (mascot && (typeof mascot !== 'string' || !MASCOT_ID_SET.has(mascot))) {
      return NextResponse.json({ error: 'Invalid mascot' }, { status: 400 });
    }
    if (JSON.stringify(content).length > MAX_CONTENT_BYTES) {
      return NextResponse.json({ error: 'Content too large' }, { status: 400 });
    }

    const totalExisting = await ToolResponse.countDocuments({ sessionId, studentToken });

    const existingCount =
      siVal >= 0
        ? await ToolResponse.countDocuments({ sessionId, studentToken, stepIndex: siVal })
        : totalExisting;

    const stepCfg =
      siVal >= 0 ? (steps?.[siVal]?.config as Record<string, unknown> | undefined) : null;
    const maxSubmissions =
      (stepCfg?.maxSubmissions as number | undefined) ??
      (session.config?.maxSubmissions as number | undefined) ??
      1;

    if (existingCount >= maxSubmissions) {
      const result: Record<string, unknown> = {
        error: getError('T07').message,
        code: getError('T07').code,
      };
      if (body.content && typeof body.content === 'object' && 'total' in body.content) {
        const histQuery: Record<string, unknown> = { sessionId, studentToken };
        if (siVal >= 0) histQuery.stepIndex = siVal;
        const prevAttempts = await ToolResponse.find(histQuery, 'content createdAt')
          .sort({ createdAt: -1 })
          .lean();
        const scores = prevAttempts
          .map((a) => ((a.content as Record<string, unknown>)?.score as number) ?? -1)
          .filter((s) => s >= 0);
        result.bestScore = scores.length ? Math.max(...scores) : 0;
        result.total = (body.content as Record<string, unknown>).total;
        result.history = prevAttempts.map((a) => ({
          score: ((a.content as Record<string, unknown>)?.score as number) ?? 0,
          date: a.createdAt,
        }));
      }
      return NextResponse.json(result, { status: 400 });
    }

    const editToken = crypto.randomUUID();

    const insertDoc: Record<string, unknown> = {
      sessionId,
      studentName: name || null,
      mascot: mascot || null,
      content,
      fileUrl: typeof fileUrl === 'string' && fileUrl.startsWith('/uploads/') ? fileUrl : null,
      studentToken,
      editToken,
      ip: hashClientId(getClientIp(req)),
      ...(siVal >= 0 && { stepIndex: siVal }),
    };

    // Atomic upsert — same TOCTOU guard as /api/tools/respond (filter-based
    // upsert, no unique index). A concurrent duplicate submit matches the
    // existing doc (updatedExisting) and fails cleanly → 400.
    let response: { _id: unknown };
    if (maxSubmissions <= 1) {
      const res = await ToolResponse.findOneAndUpdate(
        { sessionId, studentToken, ...(siVal >= 0 ? { stepIndex: siVal } : {}) },
        { $setOnInsert: insertDoc },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, runValidators: true },
      );
      const meta = (res as { lastErrorObject?: { updatedExisting?: boolean } } | null)
        ?.lastErrorObject;
      if (meta?.updatedExisting) {
        const result: Record<string, unknown> = {
          error: getError('T07').message,
          code: getError('T07').code,
        };
        return NextResponse.json(result, { status: 400 });
      }
      response = (res as { value: { _id: unknown } }).value;
    } else {
      response = await ToolResponse.create(insertDoc);
    }

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
    if ((err as { code?: number })?.code === 11000) {
      // Concurrent duplicate submission lost the race → limit already reached
      return NextResponse.json(
        { error: getError('T07').message, code: getError('T07').code },
        { status: 400 },
      );
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
