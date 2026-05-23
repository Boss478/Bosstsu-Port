import { NextRequest, NextResponse } from 'next/server';
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

    const [session, responses] = await Promise.all([
      ToolSession.findById(sessionId).lean(),
      ToolResponse.find({ sessionId }).sort({ createdAt: 1 }).lean(),
    ]);

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const toolType = (session as { type?: string }).type || 'padlet';

    const BOM = '\uFEFF';
    let csv = BOM;

    switch (toolType) {
      case 'padlet':
        csv += 'studentName,message,createdAt\n';
        responses.forEach(r => {
          csv += `"${(r.studentName || '').replace(/"/g, '""')}","${((r.content as { message?: string })?.message || '').replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
        });
        break;

      case 'poll':
        if ((session as { config?: { pollMode?: string } }).config?.pollMode === 'wordcloud') {
          const wordCounts: Record<string, number> = {};
          responses.forEach(r => {
            const word = (r.content as { word?: string })?.word?.trim();
            if (word) wordCounts[word] = (wordCounts[word] || 0) + 1;
          });
          csv += 'word,count\n';
          Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).forEach(([word, count]) => {
            csv += `"${word.replace(/"/g, '""')}",${count}\n`;
          });
        } else {
          csv += 'studentName,selectedOption,createdAt\n';
          responses.forEach(r => {
            csv += `"${(r.studentName || '').replace(/"/g, '""')}","${((r.content as { selectedOption?: string })?.selectedOption || '').replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
          });
        }
        break;

      case 'assignment':
        csv += 'studentName,answerText,fileName,submittedAt\n';
        responses.forEach(r => {
          csv += `"${(r.studentName || '').replace(/"/g, '""')}","${((r.content as { answer?: string })?.answer || '').replace(/"/g, '""')}","${(r.fileUrl || '').replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
        });
        break;

      case 'qa_board':
        csv += 'studentName,question,upvotes,isAnswered,createdAt\n';
        responses.forEach(r => {
          const content = r.content as { question?: string; upvotes?: number; isAnswered?: boolean };
          csv += `"${(r.studentName || '').replace(/"/g, '""')}","${(content?.question || '').replace(/"/g, '""')}",${content?.upvotes || 0},${content?.isAnswered ? 'Yes' : 'No'},"${new Date(r.createdAt).toISOString()}"\n`;
        });
        break;

      case 'quiz':
        csv += 'studentName,score,totalQuestions,answers,submittedAt\n';
        responses.forEach(r => {
          const content = r.content as { score?: number; total?: number; answers?: Record<string, number> };
          csv += `"${(r.studentName || '').replace(/"/g, '""')}",${content?.score || 0},${content?.total || 0},"${JSON.stringify(content?.answers || {}).replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
        });
        break;

      case 'exit_ticket':
        csv += 'studentName,learned,question,wantToKnow,submittedAt\n';
        responses.forEach(r => {
          const content = r.content as { learned?: string; question?: string; wantToKnow?: string };
          csv += `"${(r.studentName || '').replace(/"/g, '""')}","${(content?.learned || '').replace(/"/g, '""')}","${(content?.question || '').replace(/"/g, '""')}","${(content?.wantToKnow || '').replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
        });
        break;

      default:
        csv += 'studentName,content,createdAt\n';
        responses.forEach(r => {
          csv += `"${(r.studentName || '').replace(/"/g, '""')}","${JSON.stringify(r.content).replace(/"/g, '""')}","${new Date(r.createdAt).toISOString()}"\n`;
        });
    }

    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${session.sessionCode}_results.csv"`,
      },
    });
  } catch (err) {
    console.error('CSV export error:', err);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}