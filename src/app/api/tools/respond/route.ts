import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import ToolSession from '@/models/ToolSession';
import { getError } from '@/lib/error-code';
import { saveFile, sanitizeFilename } from '@/lib/upload';
import { CONFIG } from '@/lib/config';
import { getClientIp, checkToolsRateLimit, hashClientId } from '@/lib/rate-limit';
import { notifyResponsesChange } from '@/lib/sse-server';

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

function safeTokenEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function POST(req: NextRequest) {
  const studentToken = req.headers.get('student-token');
  if (!studentToken) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  let sessionId: string | null = null;

  try {
    const formData = await req.formData();
    sessionId = (formData.get('sessionId') as string) || null;

    if (!sessionId) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    // Rate key: IP only — never client-controlled tokens
    if (!checkToolsRateLimit(getClientIp(req))) {
      return NextResponse.json({ error: getError('T06').message }, { status: 429 });
    }

    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) {
      return NextResponse.json({ error: getError('T04').message }, { status: 400 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: getError('T04').message }, { status: 400 });
    }

    const stepIndex = formData.get('stepIndex') as string | null;
    const studentName = (formData.get('studentName') as string | null)?.trim() || undefined;
    const mascot = (formData.get('mascot') as string | null) || undefined;
    const contentRaw = formData.get('content') as string;
    const file = formData.get('file') as File | null;

    const steps = session.steps as Record<string, unknown>[] | undefined;

    let siVal = -1;
    if (stepIndex !== null) {
      siVal = Number(stepIndex);
      const stepCount = steps?.length ?? 0;
      if (!Number.isInteger(siVal) || siVal < 0 || siVal >= stepCount) {
        return NextResponse.json({ error: 'Invalid stepIndex' }, { status: 400 });
      }
    }

    if (studentName && studentName.length > MAX_NAME_LENGTH) {
      return NextResponse.json({ error: 'Name too long' }, { status: 400 });
    }
    if (mascot && !MASCOT_ID_SET.has(mascot)) {
      return NextResponse.json({ error: 'Invalid mascot' }, { status: 400 });
    }
    if (contentRaw && contentRaw.length > MAX_CONTENT_BYTES) {
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
      return NextResponse.json({ error: getError('T07').message }, { status: 400 });
    }

    let content: Record<string, unknown> = {};
    try {
      content = contentRaw ? JSON.parse(contentRaw) : {};
    } catch {
      content = {};
    }

    let fileUrl: string | null = null;
    const allowFileUpload =
      (stepCfg?.allowFileUpload as boolean | undefined) ??
      ((session.config as Record<string, unknown> | undefined)?.allowFileUpload as
        boolean | undefined);
    if (file && file.size > 0 && allowFileUpload) {
      if (file.size > CONFIG.TOOLS.MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      const namePrefix = studentName
        ? `${session.sessionCode}_${sanitizeFilename(studentName)}`
        : session.sessionCode;
      fileUrl = await saveFile(file, 'tools', false, namePrefix, CONFIG.TOOLS.ALLOWED_FILE_TYPES);
    }

    const editToken = crypto.randomUUID();

    const insertDoc: Record<string, unknown> = {
      sessionId,
      studentName: studentName || undefined,
      mascot: mascot || undefined,
      content,
      fileUrl,
      studentToken,
      editToken,
      ip: hashClientId(getClientIp(req)),
      ...(siVal >= 0 && { stepIndex: siVal }),
    };

    // Atomic upsert: the (session, token, step) filter makes the maxSubmissions<=1
    // path race-free — a concurrent duplicate submit matches the existing doc
    // (updatedExisting) and is rejected with T07. No unique index required.
    let response: { _id: { toString(): string } };
    if (maxSubmissions <= 1) {
      const res = await ToolResponse.findOneAndUpdate(
        { sessionId, studentToken, stepIndex: siVal >= 0 ? siVal : null },
        { $setOnInsert: insertDoc },
        { upsert: true, returnDocument: 'after', includeResultMetadata: true, runValidators: true },
      );
      const meta = (res as { lastErrorObject?: { updatedExisting?: boolean } } | null)
        ?.lastErrorObject;
      if (meta?.updatedExisting) {
        return NextResponse.json({ error: getError('T07').message }, { status: 400 });
      }
      response = (res as { value: { _id: { toString(): string } } }).value;
    } else {
      response = (await ToolResponse.create(insertDoc)) as { _id: { toString(): string } };
    }

    await ToolSession.findByIdAndUpdate(sessionId, { $inc: { responseCount: 1 } });

    const isFirstSubmission = totalExisting === 0;
    if (isFirstSubmission) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { participantCount: 1 },
      });
    }

    notifyResponsesChange(sessionId);

    return NextResponse.json({ success: true, id: response._id.toString(), editToken, fileUrl });
  } catch (err) {
    console.error('Respond error:', err);
    if ((err as { code?: number })?.code === 11000) {
      // Concurrent duplicate submission lost the race → limit already reached
      return NextResponse.json({ error: getError('T07').message }, { status: 400 });
    }
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ERROR_U05') || msg.includes('ERROR_U06') || msg.includes('ERROR_U07')) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const studentToken = req.headers.get('student-token');
  if (!studentToken) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  try {
    // Rate check BEFORE any DB read — invalid ids must not burn pool-3 queries
    if (!checkToolsRateLimit(getClientIp(req))) {
      return NextResponse.json({ error: getError('T06').message }, { status: 429 });
    }

    const body = await req.json();
    const { responseId, editToken } = body;

    if (!responseId || !editToken) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    await dbConnect();

    const response = await ToolResponse.findById(responseId);
    if (!response) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    const sessionId = String(response.sessionId);

    if (!safeTokenEqual(response.editToken ?? '', editToken)) {
      return NextResponse.json({ error: getError('T08').message }, { status: 400 });
    }

    await ToolResponse.findByIdAndDelete(responseId);
    await ToolSession.findByIdAndUpdate(sessionId, { $inc: { responseCount: -1 } });
    notifyResponsesChange(sessionId);

    if (response.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', response.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
