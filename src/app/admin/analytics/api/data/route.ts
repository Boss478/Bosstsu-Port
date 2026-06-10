import { NextResponse } from 'next/server';
import { getAnalyticsStats } from '@/app/actions/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getAnalyticsStats();
    return NextResponse.json(stats);
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
