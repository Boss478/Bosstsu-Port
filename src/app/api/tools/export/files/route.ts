import { NextRequest, NextResponse } from 'next/server';
import { Archiver } from 'archiver';
import fs from 'fs';
import path from 'path';
import { PassThrough } from 'stream';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import ToolResponse from '@/models/ToolResponse';
import { verifyAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 });

  try {
    await dbConnect();

    const session = await ToolSession.findById(sessionId).lean();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    if ((session as { type?: string }).type !== 'assignment') {
      return NextResponse.json({ error: 'ZIP export only available for Assignment tools' }, { status: 400 });
    }

    const responses = await ToolResponse.find({ sessionId }).sort({ createdAt: 1 }).lean();

    const archive = new Archiver('zip', { zlib: { level: 9 } });
    const chunks: Buffer[] = [];

    const passthrough = new PassThrough();
    passthrough.on('data', chunk => chunks.push(Buffer.from(chunk)));
    archive.pipe(passthrough);

    const summaryRows = ['studentName,answerText,fileName,submittedAt'];
    for (const r of responses) {
      const content = r.content as { answer?: string };
      const studentName = r.studentName || 'anonymous';
      summaryRows.push(`"${studentName.replace(/"/g, '""')}","${(content?.answer || '').replace(/"/g, '""')}","${(r.fileUrl || '').replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"`);
    }
    archive.append(summaryRows.join('\n'), { name: '_summary.csv' });

    for (const r of responses) {
      if (r.fileUrl) {
        const studentName = (r.studentName || `student_${r._id}`).replace(/[<>:"/\\|?*]/g, '_');
        const filePath = path.join(process.cwd(), 'public', r.fileUrl);
        if (fs.existsSync(filePath)) {
          const ext = path.extname(r.fileUrl) || '.bin';
          const safeName = `${studentName}${ext}`;
          archive.file(filePath, { name: safeName });
        }
      }
    }

    await archive.finalize();

    const zipBuffer = Buffer.concat(chunks);

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${session.sessionCode}_files.zip"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });
  } catch (err) {
    console.error('ZIP export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}