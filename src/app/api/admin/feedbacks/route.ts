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

    let feedbacks = db.feedback.findMany();

    if (search) {
      feedbacks = feedbacks.filter(
        (f) =>
          f.participantName.toLowerCase().includes(search) ||
          f.participantEmail.toLowerCase().includes(search) ||
          f.participantOrganization?.toLowerCase().includes(search) ||
          f.suggestions.toLowerCase().includes(search) ||
          f.futureTopics.toLowerCase().includes(search)
      );
    }

    if (format === 'csv') {
      const headers = [
        'Feedback ID',
        'Attempt ID',
        'Participant Name',
        'Email Address',
        'College / Organization',
        'Session Relevance',
        'Resource Person Clarity',
        'Usefulness of Examples',
        'Suggestions for Improvement',
        'Future Topics / Activities',
        'Submission Date & Time',
      ];

      const rows = feedbacks.map((f) => [
        `"${f.id}"`,
        `"${f.attemptId}"`,
        `"${f.participantName || ''}"`,
        `"${f.participantEmail || ''}"`,
        `"${f.participantOrganization || 'N/A'}"`,
        `"${f.relevance}"`,
        `"${f.explanationClarity}"`,
        `"${f.usefulnessOfExamples}"`,
        `"${f.suggestions.replace(/"/g, '""')}"`,
        `"${f.futureTopics.replace(/"/g, '""')}"`,
        `"${new Date(f.createdAt).toLocaleString()}"`,
      ]);

      const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="fdp_feedbacks_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ success: true, feedbacks });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
