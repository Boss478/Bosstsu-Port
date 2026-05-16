import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import ToolSession from '@/models/ToolSession';
import { getError } from '@/lib/error-code';
import { saveFile } from '@/lib/upload';
import { CONFIG } from '@/lib/config';

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { responseId, editToken, content } = body;

    if (!responseId || !editToken || !content) {
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

    await ToolResponse.findByIdAndUpdate(responseId, {
      content,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Edit error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}