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
    const search = searchParams.get('search')?.toLowerCase() || '';
    const format = searchParams.get('format');
    const status = searchParams.get('status');

    let attempts = db.attempt.findMany();

    if (search) {
      attempts = attempts.filter(
        (a) =>
          a.user?.name.toLowerCase().includes(search) ||
          a.user?.email.toLowerCase().includes(search) ||
          a.user?.organization?.toLowerCase().includes(search) ||
          a.test?.title.toLowerCase().includes(search) ||
          a.certificate?.certificateId.toLowerCase().includes(search)
      );
    }

    if (status === 'passed') {
      attempts = attempts.filter((a) => a.isPassed);
    } else if (status === 'failed') {
      attempts = attempts.filter((a) => a.status === 'COMPLETED' && !a.isPassed);
    }

    // CSV EXPORT SUPPORT WITH COMPLETE CANDIDATE & CERTIFICATE TRACKING
    if (format === 'csv') {
      const headers = [
        'Attempt ID',
        'Participant Name',
        'Email Address',
        'Phone Number',
        'College / Organization',
        'Assessment Title',
        'Score Obtained',
        'Max Marks',
        'Percentage',
        'Correct Answers',
        'Incorrect Answers',
        'Unanswered Questions',
        'Outcome Status',
        'Certificate ID',
        'Certificate Verification URL',
        'Email Sent Status',
        'Time Spent (Sec)',
        'Date & Time Completed',
      ];

      const rows = attempts.map((a) => [
        `"${a.id}"`,
        `"${a.user?.name || ''}"`,
        `"${a.user?.email || ''}"`,
        `"${a.user?.phone || 'N/A'}"`,
        `"${a.user?.organization || 'N/A'}"`,
        `"${a.test?.title || ''}"`,
        a.score,
        a.maxScore,
        `"${a.percentage}%"`,
        a.correctAnswers || 0,
        a.incorrectAnswers || 0,
        a.unanswered || 0,
        `"${a.status}"`,
        `"${a.certificate?.certificateId || 'N/A'}"`,
        `"${a.certificate?.verificationUrl || ''}"`,
        `"${a.certificate?.emailSent ? 'Delivered' : 'Pending/Not Sent'}"`,
        a.timeSpentSeconds || 0,
        `"${a.submittedAt ? new Date(a.submittedAt).toLocaleString() : 'In Progress'}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="participants_results_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, attempts });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
