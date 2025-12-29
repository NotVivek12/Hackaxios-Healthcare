import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

type UserPreferences = Record<string, unknown>;
interface UserSettingsPayload {
  preferences?: UserPreferences;
  profile?: UserPreferences;
}

type SafeProfileFields = {
  name?: string;
  email?: string;
  phone?: string;
  timezone?: string;
};

export const runtime = 'nodejs';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('preferences profile')
      .lean<{ preferences?: UserPreferences; profile?: UserPreferences }>();

    return NextResponse.json({
      preferences: user?.preferences ?? {},
      profile: user?.profile ?? {},
    });
  } catch (err) {
    console.error('GET /api/user/settings error:', err);
    return NextResponse.json({ error: 'Failed to load settings' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as UserSettingsPayload;
    await connectDB();

    const update: Record<string, unknown> = {};

    if (body.preferences) {
      update['preferences'] = body.preferences;
    }
    if (body.profile) {
      const profileUpdate: SafeProfileFields = {};
      if (typeof body.profile.name === 'string') {
        profileUpdate.name = body.profile.name;
      }
      if (typeof body.profile.email === 'string') {
        profileUpdate.email = body.profile.email;
      }
      if (typeof body.profile.phone === 'string') {
        profileUpdate.phone = body.profile.phone;
      }
      if (typeof body.profile.timezone === 'string') {
        profileUpdate.timezone = body.profile.timezone;
      }

      if (Object.keys(profileUpdate).length > 0) {
        update['profile'] = profileUpdate;
      }
    }

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: update },
      { new: true, runValidators: true }
    ).select('preferences profile');

    return NextResponse.json({
      success: true,
      preferences: user?.preferences ?? {},
      profile: user?.profile ?? {},
    });
  } catch (err) {
    console.error('PUT /api/user/settings error:', err);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
