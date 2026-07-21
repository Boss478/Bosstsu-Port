import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { addClient } from '@/lib/sse-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const HEARTBEAT_INTERVAL_MS = 30 * 1000;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');
  const studentToken = searchParams.get('studentToken');

  if (!sessionId) {
    return new Response('Missing sessionId', { status: 400 });
  }

  let initialStep = -1;
  let kicked = false;

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId)
      .select('currentStep kickedStudents')
      .lean();

    if (session) {
      const s = session as { currentStep?: number; kickedStudents?: string[] };
      initialStep = s.currentStep ?? -1;
      kicked = studentToken ? (s.kickedStudents ?? []).includes(studentToken) : false;
    }
  } catch (err) {
    console.error('SSE connect DB read error:', err);
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const cleanup = addClient(sessionId, controller);
      let closed = false;

      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        cleanup();
        try { controller.close(); } catch { /* already closed */ }
      };

      const stepPayload = JSON.stringify({ type: 'step', currentStep: initialStep, kicked });
      try {
        controller.enqueue(encoder.encode(`event: step\ndata: ${stepPayload}\n\n`));
      } catch {
        safeClose();
        return;
      }

      const heartbeatInterval = setInterval(() => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode('event: heartbeat\ndata: {}\n\n'));
        } catch {
          safeClose();
        }
      }, HEARTBEAT_INTERVAL_MS);

      req.signal.addEventListener('abort', () => {
        safeClose();
      });
    },
    cancel() {
      // cleanup handled by addClient's returned cleanup
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
