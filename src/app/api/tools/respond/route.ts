import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import ToolSession from '@/models/ToolSession';
import { hashIP } from '@/lib/session-code';
import { getError } from '@/lib/error-code';
import { saveFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 5) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  let ip = 'unknown';
  let ipHash = '';

  try {
    const forwarded = req.headers.get('x-forwarded-for');
    ip = forwarded?.split(',')[0] || 'unknown';
    ipHash = hashIP(ip);
  } catch {
    // continue without IP hash
  }

  let sessionId: string | null = null;

  try {
    const formData = await req.formData();
    sessionId = formData.get('sessionId') as string || null;

    if (!sessionId) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    const rateKey = `${sessionId}:${ipHash}`;
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

    const existingCount = await ToolResponse.countDocuments({ sessionId, ipHash });
    if (existingCount >= maxSubmissions) {
      return NextResponse.json(
        { error: getError('T07').message },
        { status: 400 }
      );
    }

    const studentName = formData.get('studentName') as string || undefined;
    const contentRaw = formData.get('content') as string;
    const file = formData.get('file') as File | null;

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
      fileUrl = await saveFile(file, 'tools');
    }

    const editToken = crypto.randomUUID();

    const response = await ToolResponse.create({
      sessionId,
      studentName: studentName || undefined,
      content,
      fileUrl,
      ipHash,
      editToken,
    } as Parameters<typeof ToolResponse.create>[0]) as { _id: { toString(): string } };

    return NextResponse.json({ success: true, id: response._id.toString(), editToken });
  } catch (err) {
    console.error('Respond error:', err);
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('ERROR_U05') || msg.includes('ERROR_U06') || msg.includes('ERROR_U07')) {
      return NextResponse.json({ error: msg }, { status: 500 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}