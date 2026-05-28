import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Subscription from '@/models/Subscription';
import { verifyPrivateAuth } from '@/lib/private-auth';
import { CONFIG } from '@/lib/config';
import { formatError, getError } from '@/lib/error-code';
import type { BillingCycle } from '@/models/Subscription';

const VALID_CATEGORIES: string[] = [
  ...CONFIG.FINANCE.CATEGORIES.expense.map((c) => c.value),
  ...CONFIG.FINANCE.CATEGORIES.income.map((c) => c.value),
];
const VALID_CYCLES: string[] = [...CONFIG.FINANCE.BILLING_CYCLES];

function validate(data: Record<string, unknown>): string | null {
  if (data.amount !== undefined && (typeof data.amount !== 'number' || data.amount <= 0)) return formatError('F05');
  if (data.category !== undefined && !VALID_CATEGORIES.includes(data.category as string)) return formatError('F02');
  if (data.billingCycle !== undefined && !VALID_CYCLES.includes(data.billingCycle as string)) return formatError('F02');
  return null;
}

export async function GET() {
  if (!(await verifyPrivateAuth())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  await dbConnect();

  try {
    const subscriptions = await Subscription.find().sort({ name: 1 }).lean();
    return NextResponse.json({ subscriptions });
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
    return NextResponse.json({ error: formatError('F02') }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  try {
    const subscription = await Subscription.create({
      name: body.name as string,
      amount: body.amount as number,
      billingCycle: body.billingCycle as BillingCycle,
      category: body.category as string,
      nextBillingDate: new Date(body.nextBillingDate as string),
      description: (body.description as string) || '',
    });
    return NextResponse.json({ subscription: subscription.toObject() }, { status: 201 });
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
    return NextResponse.json({ error: formatError('F02') }, { status: 400 });
  }

  const err = validate(body);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const update: Record<string, unknown> = {};
  if (body.name) update.name = body.name;
  if (body.amount !== undefined) update.amount = body.amount;
  if (body.billingCycle) update.billingCycle = body.billingCycle;
  if (body.category) update.category = body.category;
  if (body.nextBillingDate) update.nextBillingDate = new Date(body.nextBillingDate as string);
  if (body.active !== undefined) update.active = body.active;
  if (body.description !== undefined) update.description = body.description;

  try {
    const subscription = await Subscription.findByIdAndUpdate(id, { $set: update }, { new: true, runValidators: true }).lean();
    if (!subscription) {
      return NextResponse.json({ error: formatError('F04') }, { status: 404 });
    }
    return NextResponse.json({ subscription });
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
    const subscription = await Subscription.findByIdAndDelete(id).lean();
    if (!subscription) {
      return NextResponse.json({ error: formatError('F04') }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: formatError('DB03') }, { status: 500 });
  }
}
