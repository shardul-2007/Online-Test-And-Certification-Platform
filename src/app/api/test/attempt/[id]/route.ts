import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const attemptId = params.id;
    let attempt = db.attempt.findUnique({ where: { id: attemptId } });

    if (!attempt) {
      // Auto-provision attempt for the FDP assessment so users are never stranded
      const fdpTest =
        db.test.findUnique({ where: { id: 'test-fdp-2026' } }) ||
        db.test.findMany({ where: { isPublished: true } })[0] ||
        db.test.findMany()[0];

      if (fdpTest) {
        const guestUser = db.user.create({
          data: {
            name: 'FDP Participant',
            email: `participant-${Date.now()}@nmiet.edu.in`,
            organization: 'NMIET, Talegaon, Pune',
          },
        });

        const totalQ = fdpTest.questions?.length || 50;
        const maxSc = (fdpTest.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 50;

        attempt = db.attempt.create({
          data: {
            id: attemptId,
            testId: fdpTest.id,
            userId: guestUser.id,
            totalQuestions: totalQ,
            maxScore: maxSc,
          },
        });
      }
    }

    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Examination attempt not found' }, { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: attempt.testId } });
    if (!test) {
      return NextResponse.json({ success: false, error: 'Assessment details could not be found' }, { status: 404 });
    }

    const user = db.user.findUnique({ where: { id: attempt.userId } });

    // Fetch any previously saved answers for this attempt
    const answers = db.answer.findMany({ where: { attemptId } });
    const savedAnswers: Record<string, string> = {};
    const markedForReview: Record<string, boolean> = {};

    answers.forEach((ans) => {
      if (ans.selectedOptionId) {
        savedAnswers[ans.questionId] = ans.selectedOptionId;
      }
      if (ans.isMarkedForReview) {
        markedForReview[ans.questionId] = true;
      }
    });

    // Sanitize questions so correct answers are NEVER sent to the client browser
    const sanitizedQuestions = (test.questions || []).map((q: any) => ({
      id: q.id,
      testId: q.testId,
      text: q.text,
      type: q.type,
      marks: q.marks || 1,
      order: q.order,
      category: q.category,
      options: (q.options || []).map((opt: any) => ({
        id: opt.id,
        questionId: opt.questionId,
        text: opt.text,
        order: opt.order,
      })),
    }));

    return NextResponse.json({
      success: true,
      attempt: {
        id: attempt.id,
        status: attempt.status,
        startedAt: attempt.startedAt,
        timeSpentSeconds: attempt.timeSpentSeconds || 0,
        tabSwitchCount: attempt.tabSwitchCount || 0,
      },
      participant: user ? {
        name: user.name,
        email: user.email,
        organization: user.organization,
      } : null,
      test: {
        id: test.id,
        title: test.title,
        description: test.description,
        durationMinutes: test.durationMinutes || 60,
        passingPercentage: test.passingPercentage || 0,
        questions: sanitizedQuestions,
      },
      savedAnswers,
      markedForReview,
    });
  } catch (error: any) {
    console.error('Error fetching examination session:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
