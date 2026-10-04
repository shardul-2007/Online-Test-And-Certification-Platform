import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const testId = params.id;
    const test = db.test.findUnique({ where: { id: testId } });

    if (!test) {
      // Also attempt by slug
      const testBySlug = db.test.findUnique({ where: { slug: testId } });
      if (!testBySlug) {
        return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
      }
      return sanitizeAndReturn(testBySlug);
    }

    return sanitizeAndReturn(test);
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function sanitizeAndReturn(test: any) {
  // Deep-clone and sanitize options to never leak `isCorrect` or `explanation` to browser
  const sanitizedQuestions = test.questions.map((q: any) => ({
    id: q.id,
    testId: q.testId,
    text: q.text,
    type: q.type,
    marks: q.marks,
    order: q.order,
    category: q.category,
    options: q.options.map((opt: any) => ({
      id: opt.id,
      questionId: opt.questionId,
      text: opt.text,
      order: opt.order,
      // NOTE: isCorrect is deliberately excluded
    })),
  }));

  return NextResponse.json({
    success: true,
    test: {
      id: test.id,
      title: test.title,
      slug: test.slug,
      description: test.description,
      durationMinutes: test.durationMinutes,
      passingPercentage: test.passingPercentage,
      certificateTitle: test.certificateTitle,
      organizationName: test.organizationName,
      questions: sanitizedQuestions,
    },
  });
}
