import { verifyAuth } from '@/lib/auth';

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
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const url = new URL(req.url);
  const id = url.searchParams.get('id');
  if (!id || typeof id !== 'string' || id.length > 36) {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  evictOldest();

  return new Promise<Response>((resolve) => {
    const timer = setTimeout(() => {
      if (pendingInputs.has(id)) {
        pendingInputs.delete(id);
        resolve(Response.json({ value: '', cancelled: true }));
      }
    }, 15000); // Reduced from 30s to 15s

    pendingInputs.set(id, { resolve, timer });
  });
}

export async function POST(req: Request) {
  const isAuth = await verifyAuth();
  if (!isAuth) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  let body: { id?: unknown; value?: unknown; cancelled?: unknown };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'Invalid request' }, { status: 400 });
  }

  const id = typeof body.id === 'string' ? body.id : '';
  const value = typeof body.value === 'string' ? body.value : '';

  if (!id || id.length > 36 || value.length > 1000) {
    return Response.json({ error: 'Invalid input' }, { status: 400 });
  }

  const entry = pendingInputs.get(id);
  if (entry) {
    clearTimeout(entry.timer);
    pendingInputs.delete(id);
    entry.resolve(Response.json({ value, cancelled: !!body.cancelled }));
  }

  return Response.json({ ok: true });
}
