import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';
import { fetchCloudRegistry, saveCloudRegistry } from '@/lib/cloudStore';

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

    // 1. Sync any attempts from persistent cloud store
    try {
      const cloud = await fetchCloudRegistry();
      if (cloud && cloud.attempts && cloud.attempts.length > 0) {
        for (const u of cloud.users || []) {
          if (!db.user.findUnique({ where: { id: u.id } })) {
            db.user.create({ data: u });
          }
        }
        for (const c of cloud.certificates || []) {
          if (!db.certificate.findUnique({ where: { certificateId: c.certificateId } })) {
            db.certificate.create({ data: c });
          }
        }
        for (const att of cloud.attempts || []) {
          const existing = db.attempt.findUnique({ where: { id: att.id } });
          if (!existing) {
            db.attempt.create({
              data: {
                id: att.id,
                testId: att.testId,
                userId: att.userId,
                totalQuestions: att.totalQuestions || 50,
                maxScore: att.maxScore || 50,
              },
            });
            db.attempt.update({
              where: { id: att.id },
              data: {
                status: att.status,
                submittedAt: att.submittedAt,
                score: att.score,
                percentage: att.percentage,
                isPassed: att.isPassed,
                correctAnswers: att.correctAnswers,
                incorrectAnswers: att.incorrectAnswers,
                unanswered: att.unanswered,
                timeSpentSeconds: att.timeSpentSeconds,
              },
            });
          }
        }
        for (const ans of cloud.answers || []) {
          db.answer.upsert({
            where: { attemptId_questionId: { attemptId: ans.attemptId, questionId: ans.questionId } },
            data: ans,
          });
        }
      }
    } catch (syncErr) {
      console.warn('Sync from cloud store note:', syncErr);
    }

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

export async function DELETE(request: NextRequest) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrator access required' }, { status: 401 });
    }

    const body = await request.json();
    const attemptIds: string[] = Array.isArray(body.attemptIds)
      ? body.attemptIds
      : body.attemptId
      ? [body.attemptId]
      : [];

    if (attemptIds.length === 0) {
      return NextResponse.json({ success: false, error: 'No participant attempt IDs specified' }, { status: 400 });
    }

    // 1. Delete locally from memory & /tmp
    db.attempt.deleteMany({ where: { ids: attemptIds } });
    db.certificate.deleteMany({ where: { attemptIds } });
    db.answer.deleteMany({ where: { attemptIds } });

    // 2. Delete from cloud persistent store
    try {
      const cloud = await fetchCloudRegistry();
      const updatedAttempts = cloud.attempts.filter((a) => !attemptIds.includes(a.id));
      const updatedCertificates = cloud.certificates.filter((c) => !attemptIds.includes(c.attemptId));
      const updatedAnswers = cloud.answers.filter((ans) => !attemptIds.includes(ans.attemptId));

      const activeUserIds = new Set(updatedAttempts.map((a) => a.userId));
      const updatedUsers = cloud.users.filter((u) => activeUserIds.has(u.id));

      await saveCloudRegistry({
        users: updatedUsers,
        attempts: updatedAttempts,
        certificates: updatedCertificates,
        answers: updatedAnswers,
      });
    } catch (e) {
      console.warn('Cloud registry delete sync warning:', e);
    }

    return NextResponse.json({
      success: true,
      deletedCount: attemptIds.length,
      message: `Successfully deleted ${attemptIds.length} participant record(s).`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
