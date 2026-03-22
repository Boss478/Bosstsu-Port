const pendingInputs = new Map<string, (res: Response) => void>();

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) return Response.json({ error: "missing id" }, { status: 400 });

  return new Promise<Response>((resolve) => {
    pendingInputs.set(id, resolve);

    setTimeout(() => {
      if (pendingInputs.has(id)) {
        pendingInputs.delete(id);
        resolve(Response.json({ value: "", cancelled: true }));
      }
    }, 30000);
  });
}

export async function POST(req: Request) {
  const { id, value, cancelled } = await req.json();
  const resolve = pendingInputs.get(id);

  if (resolve) {
    pendingInputs.delete(id);
    resolve(Response.json({ value, cancelled: !!cancelled }));
  }

  return Response.json({ ok: true });
}
