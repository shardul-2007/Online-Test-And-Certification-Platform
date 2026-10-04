import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf';
import { sendCertificateEmail } from '@/lib/email';

function generateUniqueCertificateId(): string {
  const year = new Date().getFullYear();
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let rand = '';
  for (let i = 0; i < 6; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CERT-${year}-${rand}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { attemptId, answers: submittedAnswers, timeSpentSeconds } = body;

    if (!attemptId) {
      return NextResponse.json({ success: false, error: 'attemptId is required' }, { status: 400 });
    }

    const attempt = db.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) {
      return NextResponse.json({ success: false, error: 'Attempt not found' }, { status: 404 });
    }

    // Protection against duplicate submissions
    if (attempt.status === 'COMPLETED') {
      const existingCert = db.certificate.findUnique({ where: { attemptId: attempt.id } });
      return NextResponse.json({
        success: true,
        alreadySubmitted: true,
        attempt,
        certificate: existingCert,
      });
    }

    // Retrieve full authoritative test data with correct answers
    const test = db.test.findUnique({ where: { id: attempt.testId } });
    if (!test) {
      return NextResponse.json({ success: false, error: 'Test not found' }, { status: 404 });
    }

    const user = db.user.findUnique({ where: { id: attempt.userId } });
    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const questions = test.questions || [];
    const totalQuestions = questions.length;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;
    let totalScore = 0;
    let maxScore = 0;

    // Detailed question reviews for feedback
    const questionReviews = [];

    // Map of answers sent or previously auto-saved
    const answerMap: Record<string, string> = {};
    if (submittedAnswers && typeof submittedAnswers === 'object') {
      Object.entries(submittedAnswers).forEach(([qId, optId]) => {
        if (optId) answerMap[qId] = String(optId);
      });
    }

    // Also check any answers saved in DB for this attempt
    const dbAnswers = db.answer.findMany({ where: { attemptId } });
    dbAnswers.forEach((ans) => {
      if (ans.selectedOptionId && !answerMap[ans.questionId]) {
        answerMap[ans.questionId] = ans.selectedOptionId;
      }
    });

    for (const q of questions) {
      const qMarks = q.marks || 1;
      maxScore += qMarks;

      const selectedOptId = answerMap[q.id];
      const correctOption = q.options.find((opt) => opt.isCorrect);

      let isCorrect = false;

      if (!selectedOptId) {
        unanswered++;
      } else if (correctOption && selectedOptId === correctOption.id) {
        correctAnswers++;
        totalScore += qMarks;
        isCorrect = true;
      } else {
        incorrectAnswers++;
      }

      // Persist answer evaluation
      db.answer.upsert({
        where: { attemptId_questionId: { attemptId, questionId: q.id } },
        data: {
          selectedOptionId: selectedOptId || null,
          isCorrect,
        },
      });

      questionReviews.push({
        questionId: q.id,
        text: q.text,
        category: q.category,
        marks: qMarks,
        selectedOptionId: selectedOptId || null,
        correctOptionId: correctOption?.id || null,
        isCorrect,
        isUnanswered: !selectedOptId,
        explanation: q.explanation,
        options: q.options.map((opt) => ({
          id: opt.id,
          text: opt.text,
          isCorrect: opt.isCorrect,
        })),
      });
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;
    const isPassed = percentage >= (test.passingPercentage || 60);

    // Update Attempt record
    const updatedAttempt = db.attempt.update({
      where: { id: attempt.id },
      data: {
        status: 'COMPLETED',
        submittedAt: new Date().toISOString(),
        timeSpentSeconds: timeSpentSeconds || attempt.timeSpentSeconds || 0,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        score: totalScore,
        maxScore,
        percentage,
        isPassed,
      },
    });

    let certificateRecord = null;
    let emailStatus = null;

    // If passed: Generate Certificate, Create Certificate record, Send Email
    if (isPassed) {
      let uniqueCertId = generateUniqueCertificateId();
      // Ensure uniqueness
      while (db.certificate.findUnique({ where: { certificateId: uniqueCertId } })) {
        uniqueCertId = generateUniqueCertificateId();
      }

      certificateRecord = db.certificate.create({
        data: {
          certificateId: uniqueCertId,
          attemptId: attempt.id,
          userId: user.id,
          testId: test.id,
          participantName: user.name,
          participantEmail: user.email,
          testTitle: test.title,
          score: totalScore,
          percentage,
          issueDate: new Date().toISOString(),
          verificationUrl: `/verify/${uniqueCertId}`,
          emailSent: false,
          emailSentAt: null,
        },
      });

      // Generate PDF buffer
      try {
        const pdfBytes = await generateCertificatePdf({
          certificateId: uniqueCertId,
          participantName: user.name,
          testTitle: test.title,
          score: totalScore,
          maxScore,
          percentage,
          issueDate: certificateRecord.issueDate,
          organizationName: test.organizationName,
          certificateTitle: test.certificateTitle,
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        });

        // Trigger transactional email
        const emailResult = await sendCertificateEmail({
          recipientEmail: user.email,
          recipientName: user.name,
          testTitle: test.title,
          certificateId: uniqueCertId,
          pdfBuffer: pdfBytes,
        });

        emailStatus = emailResult;
      } catch (err: any) {
        console.error('Error generating PDF or sending email:', err);
        emailStatus = { success: false, status: 'FAILED', error: err.message };
      }
    }

    return NextResponse.json({
      success: true,
      result: {
        attemptId: attempt.id,
        participantName: user.name,
        participantEmail: user.email,
        testTitle: test.title,
        passingPercentage: test.passingPercentage,
        totalQuestions,
        correctAnswers,
        incorrectAnswers,
        unanswered,
        score: totalScore,
        maxScore,
        percentage,
        isPassed,
        certificate: certificateRecord,
        emailStatus,
        questionReviews,
      },
    });
  } catch (error: any) {
    console.error('Evaluation server error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
