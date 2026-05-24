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

export async function POST(req: NextRequest) {
  const studentToken = req.headers.get('student-token');
  if (!studentToken) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  let sessionId: string | null = null;

  try {
    const formData = await req.formData();
    sessionId = formData.get('sessionId') as string || null;

    if (!sessionId) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    const rateKey = `${sessionId}:${getClientIp(req)}:${studentToken}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json(
        { error: getError('T06').message },
        { status: 429 }
      );
    }

    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) {
      return NextResponse.json({ error: getError('T04').message }, { status: 400 });
    }
    if (!session.isActive) {
      return NextResponse.json({ error: getError('T04').message }, { status: 400 });
    }

    const maxSubmissions = session.config?.maxSubmissions || 10;

    const existingCount = await ToolResponse.countDocuments({ sessionId, studentToken });
    if (existingCount >= maxSubmissions) {
      return NextResponse.json(
        { error: getError('T07').message },
        { status: 400 }
      );
    }

    const studentName = formData.get('studentName') as string || undefined;
    const contentRaw = formData.get('content') as string;
    const file = formData.get('file') as File | null;
    const stepIndex = formData.get('stepIndex') as string | null;

    let content: Record<string, unknown> = {};
    try {
      content = contentRaw ? JSON.parse(contentRaw) : {};
    } catch {
      content = {};
    }

    let fileUrl: string | null = null;
    if (file && file.size > 0 && session.config?.allowFileUpload) {
      if (file.size > CONFIG.TOOLS.MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      const namePrefix = studentName ? `${session.sessionCode}_${sanitizeFilename(studentName)}` : session.sessionCode;
      fileUrl = await saveFile(file, 'tools', undefined, namePrefix);
    }

    const editToken = crypto.randomUUID();

    const response = await ToolResponse.create({
      sessionId,
      studentName: studentName || undefined,
      content,
      fileUrl,
      studentToken,
      editToken,
      ip: getClientIp(req),
      ...(stepIndex !== null && { stepIndex: parseInt(stepIndex) }),
    } as Parameters<typeof ToolResponse.create>[0]) as { _id: { toString(): string } };

    await ToolSession.findByIdAndUpdate(sessionId, { $inc: { responseCount: 1 } });

    const isFirstSubmission = existingCount === 0;
    if (isFirstSubmission) {
      await ToolSession.findByIdAndUpdate(sessionId, {
        $inc: { participantCount: 1 },
      });
    }

    return NextResponse.json({ success: true, id: response._id.toString(), editToken, fileUrl });
  } catch (err) {
    console.error('Respond error:', err);
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
    const rateKey = `${sessionId}:${getClientIp(req)}:${studentToken}`;
    if (!checkRateLimit(rateKey)) {
      return NextResponse.json({ error: getError('T06').message }, { status: 429 });
    }

    if (response.editToken !== editToken) {
      return NextResponse.json({ error: getError('T08').message }, { status: 400 });
    }

    await ToolResponse.findByIdAndDelete(responseId);
    await ToolSession.findByIdAndUpdate(sessionId, { $inc: { responseCount: -1 } });

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