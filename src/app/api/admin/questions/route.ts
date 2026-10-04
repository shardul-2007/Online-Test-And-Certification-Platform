import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const testId = searchParams.get('testId');

    if (!testId) {
      return NextResponse.json({ success: false, error: 'testId is required' }, { status: 400 });
    }

    const questions = db.question.findMany({ where: { testId } });
    return NextResponse.json({ success: true, questions });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testId, text, type, marks, category, explanation, options } = body;

    if (!testId || !text || !options || !Array.isArray(options) || options.length < 2) {
      return NextResponse.json(
        { success: false, error: 'Question text and at least 2 options are required' },
        { status: 400 }
      );
    }

    const hasCorrect = options.some((opt: any) => opt.isCorrect);
    if (!hasCorrect) {
      return NextResponse.json(
        { success: false, error: 'At least one option must be marked as correct' },
        { status: 400 }
      );
    }

    const question = db.question.create({
      data: {
        testId,
        text,
        type: type || 'MULTIPLE_CHOICE',
        marks: Number(marks) || 1,
        category: category || 'General',
        explanation: explanation || null,
        options: options.map((opt: any, idx: number) => ({
          text: opt.text,
          isCorrect: Boolean(opt.isCorrect),
          order: idx + 1,
        })),
      },
    });

    return NextResponse.json({ success: true, question });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Question ID is required' }, { status: 400 });
    }

    db.question.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Question deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
