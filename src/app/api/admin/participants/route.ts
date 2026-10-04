import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
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
          a.test?.title.toLowerCase().includes(search)
      );
    }

    if (status === 'passed') {
      attempts = attempts.filter((a) => a.isPassed);
    } else if (status === 'failed') {
      attempts = attempts.filter((a) => a.status === 'COMPLETED' && !a.isPassed);
    }

    // CSV EXPORT SUPPORT
    if (format === 'csv') {
      const headers = [
        'Attempt ID',
        'Participant Name',
        'Email',
        'Organization',
        'Test Title',
        'Score',
        'Max Score',
        'Percentage',
        'Status',
        'Passed',
        'Certificate ID',
        'Tab Switches',
        'Date Completed',
      ];

      const rows = attempts.map((a) => [
        `"${a.id}"`,
        `"${a.user?.name || ''}"`,
        `"${a.user?.email || ''}"`,
        `"${a.user?.organization || 'N/A'}"`,
        `"${a.test?.title || ''}"`,
        a.score,
        a.maxScore,
        `${a.percentage}%`,
        `"${a.status}"`,
        a.isPassed ? 'YES' : 'NO',
        `"${a.certificate?.certificateId || 'N/A'}"`,
        a.tabSwitchCount || 0,
        `"${a.submittedAt ? new Date(a.submittedAt).toISOString() : 'In Progress'}"`,
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
