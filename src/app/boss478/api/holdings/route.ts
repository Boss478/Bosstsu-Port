import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import StockHolding from '@/models/StockHolding';
import { verifyPrivateAuth } from '@/lib/private-auth';

export async function GET() {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const holdings = await StockHolding.find().sort({ symbol: 1 }).lean();
  return NextResponse.json({ holdings });
}

export async function POST(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const body = await request.json();
  const { symbol, shares, avgCost, manualPrice } = body;
  if (!symbol || typeof shares !== 'number' || typeof avgCost !== 'number') {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  const updateData: Record<string, unknown> = { shares, avgCost };
  if (manualPrice !== undefined && manualPrice !== null) {
    updateData.manualPrice = manualPrice;
  }
  const holding = await StockHolding.findOneAndUpdate(
    { symbol: symbol.toUpperCase() },
    { $set: updateData },
    { upsert: true, new: true, runValidators: true }
  ).lean();
  return NextResponse.json({ holding });
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();
  const { symbol } = await request.json();
  if (!symbol) {
    return NextResponse.json({ error: 'Missing symbol' }, { status: 400 });
  }
  await StockHolding.findOneAndDelete({ symbol: symbol.toUpperCase() });
  return NextResponse.json({ success: true });
}
