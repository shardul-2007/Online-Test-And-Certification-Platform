import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf';
import { sendCertificateEmail } from '@/lib/email';
import { fetchCloudRegistry, saveCloudRegistry } from '@/lib/cloudStore';

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

    let attempt = db.attempt.findUnique({ where: { id: attemptId } });
    if (!attempt) {
      const fdpTest =
        db.test.findUnique({ where: { id: 'test-fdp-2026' } }) ||
        db.test.findMany({ where: { isPublished: true } })[0] ||
        db.test.findMany()[0];

      if (fdpTest) {
        const guestUser = db.user.create({
          data: {
            name: body.participantName || 'FDP Participant',
            email: body.participantEmail || `participant-${Date.now()}@nmiet.edu.in`,
            organization: body.participantOrganization || 'NMIET, Talegaon, Pune',
          },
        });

        attempt = db.attempt.create({
          data: {
            id: attemptId,
            testId: fdpTest.id,
            userId: guestUser.id,
            totalQuestions: fdpTest.questions?.length || 50,
            maxScore: (fdpTest.questions || []).reduce((sum: number, q: any) => sum + (q.marks || 1), 0) || 50,
          },
        });
      }
    }

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

    let user = db.user.findUnique({ where: { id: attempt.userId } });
    if (!user) {
      user = db.user.create({
        data: {
          name: body.participantName || 'FDP Participant',
          email: body.participantEmail || `participant-${Date.now()}@nmiet.edu.in`,
          organization: body.participantOrganization || 'NMIET, Talegaon, Pune',
        },
      });
    }

    // Update candidate details if passed in submit payload
    if (body.participantName && body.participantName.trim()) {
      user.name = body.participantName.trim();
    }
    if (body.participantOrganization && body.participantOrganization.trim()) {
      user.organization = body.participantOrganization.trim();
    }
    if (body.participantEmail && body.participantEmail.trim()) {
      user.email = body.participantEmail.trim();
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
    // Update Attempt record (all submitted participants earn Certificate of Participation)
    const isPassed = true;
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
        isPassed: true,
      },
    });

    let certificateRecord = null;
    let emailStatus = null;

    // Generate Certificate of Participation for every participant who submits
    let uniqueCertId = generateUniqueCertificateId();
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
        participantOrganization: user.organization || null,
        testTitle: test.title,
        score: totalScore,
        percentage,
        issueDate: new Date().toISOString(),
        verificationUrl: `/verify/${uniqueCertId}`,
        emailSent: false,
        emailSentAt: null,
      },
    });

    // Generate PDF buffer using official template
    try {
      const pdfBytes = await generateCertificatePdf({
        certificateId: uniqueCertId,
        participantName: user.name,
        participantOrganization: user.organization || undefined,
        testTitle: test.title,
        score: totalScore,
        maxScore,
        percentage,
        issueDate: certificateRecord.issueDate,
        organizationName: test.organizationName,
        certificateTitle: test.certificateTitle,
        appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      });

      // Trigger automated transactional email with attached PDF
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

    // Sync participant submission permanently to cloud store
    try {
      const cloud = await fetchCloudRegistry();
      const otherAttempts = (cloud.attempts || []).filter((a) => a.id !== attempt.id);
      const otherCerts = (cloud.certificates || []).filter((c) => c.attemptId !== attempt.id);
      const otherUsers = (cloud.users || []).filter((u) => u.id !== user.id);
      const otherAnswers = (cloud.answers || []).filter((a) => a.attemptId !== attempt.id);

      const newAnswers = questionReviews.map((qr) => ({
        id: `ans-${attempt.id}-${qr.questionId}`,
        attemptId: attempt.id,
        questionId: qr.questionId,
        selectedOptionId: qr.selectedOptionId,
        isMarkedForReview: false,
        isCorrect: qr.isCorrect,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      await saveCloudRegistry({
        users: [...otherUsers, user],
        attempts: [...otherAttempts, updatedAttempt || attempt],
        certificates: certificateRecord ? [...otherCerts, certificateRecord] : otherCerts,
        answers: [...otherAnswers, ...newAnswers],
      });
    } catch (syncErr) {
      console.warn('Permanent cloud sync warning:', syncErr);
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
