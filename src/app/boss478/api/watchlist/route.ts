import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StockWatchlist from '@/models/StockWatchlist';

export async function GET() {
  try {
    await dbConnect();
    const doc = await StockWatchlist.findOne({}).lean();
    return NextResponse.json({ symbols: doc?.symbols ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch watchlist' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { symbols } = await request.json();
    if (!Array.isArray(symbols)) {
      return NextResponse.json({ error: 'symbols array required' }, { status: 400 });
    }
    const doc = await StockWatchlist.findOneAndUpdate(
      {},
      { $set: { symbols } },
      { upsert: true, new: true }
    ).lean();
    return NextResponse.json({ symbols: doc?.symbols ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update watchlist' },
      { status: 500 }
    );
  }
}
