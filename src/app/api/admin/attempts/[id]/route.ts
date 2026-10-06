import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentAdmin } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const admin = await getCurrentAdmin();
    if (!admin || admin.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
      return NextResponse.json({ success: false, error: 'Unauthorized: Administrator access required' }, { status: 401 });
    }

    const attemptId = params.id;
    const attempt = db.attempt.findUnique({ where: { id: attemptId } });

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: attempt.testId } });
    const user = db.user.findUnique({ where: { id: attempt.userId } });
    const certificate = db.certificate.findUnique({ where: { attemptId } }) || attempt.certificate;

    // Fetch candidate answers
    const answers = db.answer.findMany({ where: { attemptId } });
    const answersMap = new Map(answers.map((a) => [a.questionId, a]));

    const questions = test?.questions || [];
    const detailedResponses = questions.map((q, idx) => {
      const userAns = answersMap.get(q.id);
      const selectedOption = q.options.find((opt) => opt.id === userAns?.selectedOptionId);
      const correctOption = q.options.find((opt) => opt.isCorrect);

      return {
        number: idx + 1,
        questionId: q.id,
        text: q.text,
        category: q.category,
        marks: q.marks || 1,
        selectedOptionId: userAns?.selectedOptionId || null,
        selectedOptionText: selectedOption?.text || 'Unanswered',
        correctOptionId: correctOption?.id || null,
        correctOptionText: correctOption?.text || '',
        isCorrect: userAns?.isCorrect ?? false,
        isUnanswered: !userAns?.selectedOptionId,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
          isSelected: opt.id === userAns?.selectedOptionId,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        score: attempt.score,
        maxScore: attempt.maxScore,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpentSeconds: attempt.timeSpentSeconds,
        user: {
          id: user?.id,
          name: user?.name,
          email: user?.email,
          phone: user?.phone,
          organization: user?.organization,
        },
        certificate: certificate
          ? {
              certificateId: certificate.certificateId,
              issueDate: certificate.issueDate,
              verificationUrl: certificate.verificationUrl,
              emailSent: certificate.emailSent,
              emailSentAt: certificate.emailSentAt,
            }
          : null,
        responses: detailedResponses,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
