import { verifyAuth } from '@/lib/auth';
import { createErrorResponse } from '@/lib/error-code';

const pendingInputs = new Map<string, { resolve: (res: Response) => void; timer: NodeJS.Timeout }>();
const MAX_ENTRIES = 50;

function evictOldest(): void {
  if (pendingInputs.size >= MAX_ENTRIES) {
    const firstKey = pendingInputs.keys().next().value;
    if (firstKey !== undefined) {
      const entry = pendingInputs.get(firstKey);
      if (entry) clearTimeout(entry.timer);
      pendingInputs.delete(firstKey);
    }
  }
}

export async function GET(req: Request) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    const err = createErrorResponse('401');
    return Response.json({ error: err }, { status: err.httpStatus });
  }

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id || typeof id !== 'string' || id.length > 36) {
    const err = createErrorResponse('P01');
    return Response.json({ error: err }, { status: err.httpStatus });
  }

  evictOldest();

  return new Promise<Response>((resolve) => {
    const timer = setTimeout(() => {
      if (pendingInputs.has(id)) {
        pendingInputs.delete(id);
        resolve(Response.json({ value: '', cancelled: true }));
      }
    }, 15000);

    pendingInputs.set(id, { resolve, timer });
  });
}

export async function POST(req: Request) {
  const isAuth = await verifyAuth();
  if (!isAuth) {
    const err = createErrorResponse('401');
    return Response.json({ error: err }, { status: err.httpStatus });
  }

  let body: { id?: unknown; value?: unknown; cancelled?: unknown };
  try {
    body = await req.json();
  } catch {
    const err = createErrorResponse('P01');
    return Response.json({ error: err }, { status: err.httpStatus });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const value = typeof body.value === 'string' ? body.value : '';

  if (!id || id.length > 36 || value.length > 1000) {
    const err = createErrorResponse('P02');
    return Response.json({ error: err }, { status: err.httpStatus });
  }

  const entry = pendingInputs.get(id);
  if (entry) {
    clearTimeout(entry.timer);
    pendingInputs.delete(id);
    entry.resolve(Response.json({ value, cancelled: !!body.cancelled }));
  }

  return Response.json({ ok: true });
}