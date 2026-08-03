import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db';
import ToolSession from '@/models/ToolSession';
import { tryAddClient, getIpConnectedCount, MAX_CLIENTS_PER_IP } from '@/lib/sse-server';
import { getClientIp } from '@/lib/rate-limit';

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

  // Per-IP connection cap before any streaming work
  const ip = getClientIp(req);
  if (getIpConnectedCount(ip) >= MAX_CLIENTS_PER_IP) {
    return new Response('Too many connections', { status: 429 });
  }

  let initialStep = -1;
  let kicked = false;

  try {
    await dbConnect();
    const session = await ToolSession.findById(sessionId)
      .select('currentStep kickedStudents isActive')
      .lean();

    if (!session) {
      return new Response('Session not found', { status: 404 });
    }

    const s = session as { currentStep?: number; kickedStudents?: string[]; isActive?: boolean };
    if (s.isActive === false) {
      return new Response('Session inactive', { status: 403 });
    }

    initialStep = s.currentStep ?? -1;
    kicked = studentToken ? (s.kickedStudents ?? []).includes(studentToken) : false;
  } catch (err) {
    console.error('SSE connect DB read error:', err);
    return new Response('Server error', { status: 500 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;

      const safeClose = () => {
        if (closed) return;
        closed = true;
        if (heartbeatInterval) clearInterval(heartbeatInterval);
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Honor the addClient result — on rejection (capacity), close the stream
      // without enqueueing the initial step or starting the heartbeat.
      const { cleanup, accepted } = tryAddClient(sessionId, controller, {
        ip,
        token: studentToken || undefined,
      });
      if (!accepted) {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
        return;
      }

      const stepPayload = JSON.stringify({
        type: 'step',
        currentStep: initialStep,
        kicked,
        kickedTokens: kicked && studentToken ? [studentToken] : [],
      });
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
      // cleanup handled by tryAddClient's returned cleanup
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
