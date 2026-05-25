import dbConnect from "@/lib/db";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyModel = any;

export interface FetchPublishedOptions {
  model: AnyModel;
  match: Record<string, unknown>;
  select: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sort: any;
  skip: number;
  limit: number;
}

export interface FetchPublishedResult {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  docs: any[];
  total: number;
}

export async function fetchPublished(opts: FetchPublishedOptions): Promise<FetchPublishedResult> {
  try {
    await dbConnect();
    const [docs, total] = await Promise.all([
      opts.model.find(opts.match)
        .select(opts.select)
        .sort(opts.sort)
        .skip(opts.skip)
        .limit(opts.limit)
        .lean(),
      opts.model.countDocuments(opts.match),
    ]);
    return { docs: docs as never[], total: total as number };
  } catch {
    return { docs: [], total: 0 };
  }
}
