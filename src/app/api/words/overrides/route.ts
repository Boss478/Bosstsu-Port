import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WordOverride from '@/models/WordOverride';
import { verifyAuth } from '@/lib/auth';

export async function GET() {
  const isAuth = await verifyAuth();
  if (!isAuth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    await dbConnect();
    const overrides = await WordOverride.find({}).lean();
    return NextResponse.json(overrides);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
  }
}
