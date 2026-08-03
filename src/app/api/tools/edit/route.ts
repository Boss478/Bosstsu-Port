import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import ToolSession from '@/models/ToolSession';
import { getError } from '@/lib/error-code';
import { saveFile, sanitizeFilename } from '@/lib/upload';
import { CONFIG } from '@/lib/config';
import { getClientIp, checkToolsRateLimit, hashClientId } from '@/lib/rate-limit';
import { notifyResponsesChange } from '@/lib/sse-server';
import fs from 'fs';
import path from 'path';

const MAX_CONTENT_BYTES = 10 * 1024;
const MAX_VOTERS = 500;

function safeTokenEqual(a: string, b: string): boolean {
  const ha = crypto.createHash('sha256').update(a).digest();
  const hb = crypto.createHash('sha256').update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export async function PATCH(req: NextRequest) {
  const contentType = req.headers.get('content-type') || '';

  if (!contentType.includes('multipart/form-data')) {
    return NextResponse.json({ error: getError('T05').message }, { status: 400 });
  }

  try {
    const formData = await req.formData();
    const responseId = formData.get('responseId') as string;
    const editToken = formData.get('editToken') as string;
    const contentRaw = formData.get('content') as string;
    const action = formData.get('action') as string | null;
    const file = formData.get('file') as File | null;

    // Vote action — no editToken needed for classroom Q&A voting
    if (action === 'vote') {
      if (!responseId) {
        return NextResponse.json({ error: getError('T05').message }, { status: 400 });
      }
      const studentToken = req.headers.get('student-token');
      if (!studentToken) {
        return NextResponse.json({ error: getError('401').message }, { status: 401 });
      }

      // Rate key: IP only — never client-controlled tokens
      if (!checkToolsRateLimit(getClientIp(req))) {
        return NextResponse.json(
          { error: getError('T06').message, code: getError('T06').code },
          { status: 429 },
        );
      }

      await dbConnect();

      const response = await ToolResponse.findById(responseId).lean();
      if (!response) {
        return NextResponse.json({ error: getError('T05').message }, { status: 400 });
      }
      // No self-upvotes
      if (response.studentToken && response.studentToken === studentToken) {
        return NextResponse.json(
          { error: getError('T08').message, code: getError('T08').code },
          { status: 400 },
        );
      }
      const session = await ToolSession.findById(response.sessionId).lean();
      if (!session || !session.isActive) {
        return NextResponse.json(
          { error: getError('T09').message, code: getError('T09').code },
          { status: 400 },
        );
      }
      const responseStep =
        response.stepIndex !== undefined
          ? (session.steps as Record<string, unknown>[] | undefined)?.[response.stepIndex as number]
          : null;
      const effectiveType = (responseStep?.type as string | undefined) || (session.type as string);
      if (effectiveType !== 'qa_board') {
        return NextResponse.json(
          { error: getError('T08').message, code: getError('T08').code },
          { status: 400 },
        );
      }

      // Dedup: hashed voter key, atomic $ne guard, capped array (last MAX_VOTERS)
      const voterKey = hashClientId(`${studentToken}:${getClientIp(req)}`);
      const updated = await ToolResponse.findOneAndUpdate(
        { _id: responseId, voters: { $ne: voterKey } },
        {
          $inc: { 'content.upvotes': 1 },
          $push: { voters: { $each: [voterKey], $slice: -MAX_VOTERS } },
        },
        { returnDocument: 'after' },
      );
      if (!updated) {
        return NextResponse.json(
          { error: getError('T08').message, code: getError('T08').code },
          { status: 400 },
        );
      }
      notifyResponsesChange(String(response.sessionId));
      return NextResponse.json({ success: true });
    }

    if (!responseId || !editToken) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    // Rate check BEFORE any DB work
    if (!checkToolsRateLimit(getClientIp(req))) {
      return NextResponse.json(
        { error: getError('T06').message, code: getError('T06').code },
        { status: 429 },
      );
    }

    if (contentRaw && contentRaw.length > MAX_CONTENT_BYTES) {
      return NextResponse.json({ error: 'Content too large' }, { status: 400 });
    }

    await dbConnect();

    const response = await ToolResponse.findById(responseId).lean();
    if (!response) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    // Timing-safe editToken compare
    if (!safeTokenEqual(response.editToken ?? '', editToken)) {
      return NextResponse.json(
        { error: getError('T08').message, code: getError('T08').code },
        { status: 400 },
      );
    }

    const session = await ToolSession.findById(response.sessionId).lean();
    if (!session || !session.isActive) {
      return NextResponse.json(
        { error: getError('T09').message, code: getError('T09').code },
        { status: 400 },
      );
    }

    const toolTypesAllowEdit = ['assignment', 'padlet'];
    const responseStep =
      response.stepIndex !== undefined
        ? (session.steps as Record<string, unknown>[] | undefined)?.[response.stepIndex as number]
        : null;
    const effectiveType = (responseStep?.type as string | undefined) || (session.type as string);
    if (!toolTypesAllowEdit.includes(effectiveType)) {
      return NextResponse.json(
        { error: getError('T08').message, code: getError('T08').code },
        { status: 400 },
      );
    }

    let content: Record<string, unknown> = {};
    try {
      content = contentRaw ? JSON.parse(contentRaw) : {};
    } catch {
      content = {};
    }

    let newFileUrl: string | null = response.fileUrl || null;
    const stepCfg = responseStep?.config as Record<string, unknown> | undefined;
    const allowFileUpload =
      (stepCfg?.allowFileUpload as boolean | undefined) ??
      ((session.config as Record<string, unknown> | undefined)?.allowFileUpload as
        boolean | undefined);

    if (action === 'remove' && response.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', response.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      newFileUrl = null;
    } else if (file && file.size > 0 && allowFileUpload) {
      if (file.size > CONFIG.TOOLS.MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      if (response.fileUrl) {
        const oldPath = path.join(process.cwd(), 'public', response.fileUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      const namePrefix = response.studentName
        ? `${session.sessionCode}_${sanitizeFilename(response.studentName)}`
        : session.sessionCode;
      newFileUrl = await saveFile(
        file,
        'tools',
        undefined,
        namePrefix,
        CONFIG.TOOLS.ALLOWED_FILE_TYPES,
      );
    }

    await ToolResponse.findByIdAndUpdate(responseId, {
      content,
      ...(newFileUrl !== undefined && { fileUrl: newFileUrl }),
    });
    notifyResponsesChange(String(response.sessionId));

    return NextResponse.json({ success: true, fileUrl: newFileUrl });
  } catch (err) {
    console.error('Edit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
