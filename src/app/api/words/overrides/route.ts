import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import WordOverride from '@/models/Word';

export async function GET() {
  try {
    await dbConnect();
    const overrides = await WordOverride.find({}).lean();
    return NextResponse.json(overrides);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch overrides' }, { status: 500 });
  }
}
