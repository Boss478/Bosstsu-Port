import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Transaction from '@/models/Transaction';
import { verifyPrivateAuth } from '@/lib/private-auth';
import { CONFIG } from '@/lib/config';
import { formatError, getError } from '@/lib/error-code';

const VALID_CATEGORIES: string[] = [
  ...CONFIG.FINANCE.CATEGORIES.income.map((c) => c.value),
  ...CONFIG.FINANCE.CATEGORIES.expense.map((c) => c.value),
];

function validate(data: Record<string, unknown>): string | null {
  if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0)) return formatError('F05');
  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category as string)) return formatError('F01');
  if (data.type !== undefined && !['income', 'expense'].includes(data.type as string)) return formatError('F01');
  return null;
}

export async function GET(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  const { searchParams } = request.nextUrl;
  const month = searchParams.get('month');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const type = searchParams.get('type');
  const category = searchParams.get('category');

  const filter: Record<string, unknown> = {};
  if (startDate && endDate) {
    filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
  } else if (month) {
    const [year, m] = month.split('-').map(Number);
    if (year && m) {
      const start = new Date(year, m - 1, 1);
      const end = new Date(year, m, 0, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    }
  }
  if (type && ['income', 'expense'].includes(type)) {
    filter.type = type;
  }
  if (category) {
    filter.category = category;
  }

  try {
    const transactions = await Transaction.find(filter).sort({ date: -1 }).lean();
    return NextResponse.json({ transactions });
  } catch {
    return NextResponse.json({ error: formatError('DB01') }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: formatError('F01') }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const transaction = await Transaction.create({
      type: body.type as string,
      amount: body.amount as number,
      category: body.category as string,
      description: (body.description as string) || '',
      date: body.date ? new Date(body.date as string) : new Date(),
    });
    return NextResponse.json({ transaction: transaction.toObject() }, { status: 201 });
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
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: getError('404').message }, { status: 400 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: formatError('F01') }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.type) update.type = body.type;
  if (body.amount !== undefined) update.amount = body.amount;
  if (body.category) update.category = body.category;
  if (body.description !== undefined) update.description = body.description;
  if (body.date) update.date = new Date(body.date as string);

  try {
    const transaction = await Transaction.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!transaction) {
      return NextResponse.json({ error: formatError('F03') }, { status: 404 });
    }
    return NextResponse.json({ transaction });
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
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: getError('404').message }, { status: 400 });
  }

  try {
    const transaction = await Transaction.findByIdAndDelete(id).lean();
    if (!transaction) {
      return NextResponse.json({ error: formatError('F03') }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: formatError('DB03') }, { status: 500 });
  }
}
