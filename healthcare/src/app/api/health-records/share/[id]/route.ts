import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HealthRecordModel from '@/models/HealthRecord';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const url = new URL(req.url);
    const parts = url.pathname.split('/');
    const recordId = parts[parts.length - 1];

    if (!mongoose.Types.ObjectId.isValid(recordId)) {
      return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
    }

    const record = await HealthRecordModel.findOne({ _id: recordId, userId: session.user.id });
    if (!record) {
      return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
    }

    // Placeholder: implement actual sharing (email/permissions) later.
    return NextResponse.json({ success: true, message: 'Record shared (placeholder)' });
  } catch (err) {
    console.error('POST /api/health-records/share/[id] error:', err);
    return NextResponse.json({ error: 'Failed to share record' }, { status: 500 });
  }
}
