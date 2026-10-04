import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';

const RegisterSchema = z.object({
  testId: z.string().min(1, 'Test ID is required'),
  name: z.string().min(2, 'Full Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().nullable(),
  organization: z.string().optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = RegisterSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.issues[0]?.message || 'Invalid input data',
        },
        { status: 400 }
      );
    }

    const { testId, name, email, phone, organization } = validated.data;

    // Verify test exists and is published
    const test = db.test.findUnique({ where: { id: testId } });
    if (!test || !test.isPublished) {
      return NextResponse.json(
        { success: false, error: 'The requested test is not currently available.' },
        { status: 404 }
      );
    }

    // Upsert or find User
    const user = db.user.upsert({
      where: { email },
      update: {
        name,
        phone: phone || null,
        organization: organization || null,
      },
      create: {
        name,
        email,
        phone: phone || null,
        organization: organization || null,
      },
    });

    // Calculate total questions and max score
    const totalQuestions = test.questions.length;
    const maxScore = test.questions.reduce((sum: number, q: any) => sum + (q.marks || 1), 0);

    // Create a new fresh TestAttempt
    const attempt = db.attempt.create({
      data: {
        testId: test.id,
        userId: user.id,
        totalQuestions,
        maxScore,
      },
    });

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        organization: user.organization,
      },
      test: {
        id: test.id,
        title: test.title,
        durationMinutes: test.durationMinutes,
        passingPercentage: test.passingPercentage,
      },
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
