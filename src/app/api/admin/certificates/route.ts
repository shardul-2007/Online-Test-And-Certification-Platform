import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrator access required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const certificates = db.certificate.findMany({ search });

    return NextResponse.json({
      success: true,
      certificates,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
