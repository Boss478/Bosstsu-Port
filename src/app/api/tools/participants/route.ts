import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import ToolResponse from '@/models/ToolResponse';
import mongoose from 'mongoose';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get('sessionId');

  if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
    return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
  }

  try {
    await dbConnect();

    const participants = await ToolResponse.aggregate([
      { $match: { sessionId: new mongoose.Types.ObjectId(sessionId) } },
      { $match: { studentToken: { $ne: null } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$studentToken',
          studentName: { $first: '$studentName' },
          mascot: { $first: '$mascot' },
          createdAt: { $first: '$createdAt' },
          responseCount: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          studentToken: '$_id',
          studentName: 1,
          mascot: 1,
          createdAt: 1,
          responseCount: 1,
        },
      },
      { $sort: { createdAt: -1 } },
    ]);

    return NextResponse.json({ participants }, { headers: { 'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30' } });
  } catch (err) {
    console.error('Participants fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch participants' }, { status: 500 });
  }
}
