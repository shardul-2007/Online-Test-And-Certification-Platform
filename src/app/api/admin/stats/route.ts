import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET() {
  try {
    const admin = await getCurrentAdmin();
    // Allow demo access or authenticated admin
    const stats = db.stats.getOverview();
    const tests = db.test.findMany();
    const recentAttempts = db.attempt.findMany().slice(0, 10);
    const recentCertificates = db.certificate.findMany().slice(0, 10);

    return NextResponse.json({
      success: true,
      stats,
      tests,
      recentAttempts,
      recentCertificates,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
