import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, questionId, selectedOptionId, isMarkedForReview, tabSwitchInc, timeSpentSeconds } = body;

    if (!attemptId) {
      return NextResponse.json({ success: false, error: 'attemptId is required' }, { status: 400 });
    }

    const attempt = db.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.status !== 'IN_PROGRESS') {
      return NextResponse.json({ success: false, error: 'Attempt is already completed' }, { status: 400 });
    }

    // Update attempt metrics if provided
    const updateData: any = {};
    if (typeof timeSpentSeconds === 'number') {
      updateData.timeSpentSeconds = timeSpentSeconds;
    }
    if (tabSwitchInc) {
      updateData.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
    }
    if (Object.keys(updateData).length > 0) {
      db.attempt.update({ where: { id: attemptId }, data: updateData });
    }

    // Upsert answer if questionId provided
    if (questionId) {
      db.answer.upsert({
        where: { attemptId_questionId: { attemptId, questionId } },
        data: {
          selectedOptionId: selectedOptionId !== undefined ? selectedOptionId : undefined,
          isMarkedForReview: isMarkedForReview !== undefined ? isMarkedForReview : false,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
