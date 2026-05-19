import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import ToolSession from '@/models/ToolSession';
import { getError } from '@/lib/error-code';
import { saveFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';
import fs from 'fs';
import path from 'path';

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

    if (!responseId || !editToken) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    await dbConnect();

    const response = await ToolResponse.findById(responseId).lean();
    if (!response) {
      return NextResponse.json({ error: getError('T05').message }, { status: 400 });
    }

    if (response.editToken !== editToken) {
      return NextResponse.json({ error: getError('T08').message, code: getError('T08').code }, { status: 400 });
    }

    const session = await ToolSession.findById(response.sessionId).lean();
    if (!session || !session.isActive) {
      return NextResponse.json({ error: getError('T09').message, code: getError('T09').code }, { status: 400 });
    }

    const toolTypesAllowEdit = ['assignment', 'padlet', 'discussion'];
    if (!toolTypesAllowEdit.includes(session.type)) {
      return NextResponse.json({ error: getError('T08').message, code: getError('T08').code }, { status: 400 });
    }

    let content: Record<string, unknown> = {};
    try {
      content = contentRaw ? JSON.parse(contentRaw) : {};
    } catch {
      content = {};
    }

    let newFileUrl: string | null = response.fileUrl || null;

    if (action === 'remove' && response.fileUrl) {
      const filePath = path.join(process.cwd(), 'public', response.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      newFileUrl = null;
    } else if (file && file.size > 0 && session.config?.allowFileUpload) {
      if (file.size > CONFIG.TOOLS.MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
      }
      if (response.fileUrl) {
        const oldPath = path.join(process.cwd(), 'public', response.fileUrl);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      newFileUrl = await saveFile(file, 'tools');
    }

    await ToolResponse.findByIdAndUpdate(responseId, {
      content,
      ...(newFileUrl !== undefined && { fileUrl: newFileUrl }),
    });

    return NextResponse.json({ success: true, fileUrl: newFileUrl });
  } catch (err) {
    console.error('Edit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}