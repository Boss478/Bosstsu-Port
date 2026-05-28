import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Budget from '@/models/Budget';
import { verifyPrivateAuth } from '@/lib/private-auth';
import { CONFIG } from '@/lib/config';
import { formatError, getError } from '@/lib/error-code';

const VALID_CATEGORIES: string[] = [
  ...CONFIG.FINANCE.CATEGORIES.income.map((c) => c.value),
  ...CONFIG.FINANCE.CATEGORIES.expense.map((c) => c.value),
];

function isValidMonth(month: string): boolean {
  return /^\d{4}-\d{2}$/.test(month);
}

function previousMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  const { searchParams } = request.nextUrl;
  const month = searchParams.get('month');
  if (!month || !isValidMonth(month)) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  try {
    const budget = await Budget.findOne({ month }).lean();
    return NextResponse.json({ budget: budget || { month, budgets: [] } });
  } catch {
    return NextResponse.json({ error: formatError('DB01') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  let body: { month: string; budgets: Array<{ category: string; limit: number }> };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  if (!body.month || !isValidMonth(body.month)) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  if (!Array.isArray(body.budgets)) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  for (const b of body.budgets) {
    if (!VALID_CATEGORIES.includes(b.category) || typeof b.limit !== 'number' || b.limit < 0) {
      return NextResponse.json({ error: formatError('F06') }, { status: 400 });
    }
  }

  try {
    const budget = await Budget.findOneAndUpdate(
      { month: body.month },
      { $set: { budgets: body.budgets } },
      { new: true, upsert: true, runValidators: true }
    ).lean();
    return NextResponse.json({ budget }, { status: 201 });
  } catch {
    return NextResponse.json({ error: formatError('DB01') }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  const { searchParams } = request.nextUrl;
  const month = searchParams.get('month');
  if (!month || !isValidMonth(month)) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  let body: { category: string; limit: number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  if (!VALID_CATEGORIES.includes(body.category) || typeof body.limit !== 'number' || body.limit < 0) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  try {
    const budget = await Budget.findOneAndUpdate(
      { month },
      { $set: { 'budgets.$[elem].limit': body.limit } },
      {
        arrayFilters: [{ 'elem.category': body.category }],
        new: true,
        runValidators: true,
      }
    ).lean();

    if (!budget) {
      return NextResponse.json({ error: formatError('F07') }, { status: 404 });
    }
    return NextResponse.json({ budget });
  } catch {
    return NextResponse.json({ error: formatError('DB02') }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  const { searchParams } = request.nextUrl;
  const month = searchParams.get('month');
  if (!month || !isValidMonth(month)) {
    return NextResponse.json({ error: formatError('F06') }, { status: 400 });
  }

  try {
    const budget = await Budget.findOneAndDelete({ month }).lean();
    if (!budget) {
      return NextResponse.json({ error: formatError('F07') }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: formatError('DB03') }, { status: 500 });
  }
}
