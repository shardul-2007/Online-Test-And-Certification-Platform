import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendCertificateEmail } from '@/lib/email';
import { generateCertificatePdf } from '@/lib/pdf';
import { saveFeedbackToSupabase } from '@/lib/supabase';

const VALID_RATINGS = ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const attemptId = url.searchParams.get('attemptId');

    if (!attemptId) {
      return NextResponse.json({ success: false, error: 'attemptId is required' }, { status: 400 });
    }

    const existingFeedback = db.feedback.findUnique({ where: { attemptId } });

    return NextResponse.json({
      success: true,
      hasFeedback: !!existingFeedback,
      feedback: existingFeedback,
    });
  } catch (error: any) {
    console.error('Error fetching feedback:', error);
    return NextResponse.json({ success: false, error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      attemptId,
      relevance,
      explanationClarity,
      usefulnessOfExamples,
      suggestions,
      futureTopics,
      participantName,
      participantEmail,
      participantOrganization,
    } = body;

    if (!attemptId) {
      return NextResponse.json({ success: false, error: 'attemptId is required' }, { status: 400 });
    }

    // 1. Validate All 5 Mandatory Questions
    const errors: Record<string, string> = {};

    if (!relevance || !VALID_RATINGS.includes(relevance.trim())) {
      errors.relevance = "Please rate today's session relevance to your academic/professional requirements.";
    }

    if (!explanationClarity || !VALID_RATINGS.includes(explanationClarity.trim())) {
      errors.explanationClarity = 'Please rate how clearly the resource person explained the concepts.';
    }

    if (!usefulnessOfExamples || !VALID_RATINGS.includes(usefulnessOfExamples.trim())) {
      errors.usefulnessOfExamples = 'Please rate the usefulness of examples, demos, and case studies.';
    }

    if (!suggestions || !suggestions.trim()) {
      errors.suggestions = 'Please provide suggestions for improving future FDP programs.';
    }

    if (!futureTopics || !futureTopics.trim()) {
      errors.futureTopics = 'Please specify topics or activities you would like to learn in the future.';
    }

    if (Object.keys(errors).length > 0) {
      return NextResponse.json({
        success: false,
        error: 'All feedback questions are required.',
        validationErrors: errors,
      }, { status: 400 });
    }

    // 2. Resolve Participant Details from attempt or request
    const attempt = db.attempt.findUnique({ where: { id: attemptId } });
    const user = attempt ? db.user.findUnique({ where: { id: attempt.userId } }) : null;

    const name = (participantName || user?.name || 'FDP Participant').trim();
    const email = (participantEmail || user?.email || '').trim();
    const organization = (participantOrganization || user?.organization || null)?.trim() || null;

    // 3. Save feedback in database
    let feedback = db.feedback.findUnique({ where: { attemptId } });
    if (!feedback) {
      feedback = db.feedback.create({
        data: {
          attemptId,
          userId: user?.id,
          participantName: name,
          participantEmail: email,
          participantOrganization: organization,
          relevance: relevance.trim(),
          explanationClarity: explanationClarity.trim(),
          usefulnessOfExamples: usefulnessOfExamples.trim(),
          suggestions: suggestions.trim(),
          futureTopics: futureTopics.trim(),
        },
      });
    }

    // Save to Supabase feedbacks table asynchronously
    saveFeedbackToSupabase({
      attempt_id: attemptId,
      participant_name: name,
      participant_email: email,
      participant_organization: organization,
      relevance: relevance.trim(),
      explanation_clarity: explanationClarity.trim(),
      usefulness_of_examples: usefulnessOfExamples.trim(),
      suggestions: suggestions.trim(),
      future_topics: futureTopics.trim(),
    }).catch((sbErr) => console.warn('Supabase feedback sync warning:', sbErr));

    // 4. If Certificate exists, ensure email delivery is dispatched
    let certificate = db.certificate.findUnique({ where: { attemptId } });
    if (certificate && email && (!certificate.emailSent || certificate.emailSentAt === null)) {
      try {
        const test = db.test.findUnique({ where: { id: certificate.testId } });
        const pdfBytes = await generateCertificatePdf({
          certificateId: certificate.certificateId,
          participantName: name || certificate.participantName,
          participantOrganization: organization || certificate.participantOrganization || undefined,
          testTitle: certificate.testTitle,
          score: certificate.score,
          maxScore: attempt?.maxScore || 50,
          percentage: certificate.percentage,
          issueDate: certificate.issueDate,
          organizationName: test?.organizationName || 'NMIET in association with ISTE',
          certificateTitle: test?.certificateTitle || 'Certificate of Participation',
          appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        });

        await sendCertificateEmail({
          recipientEmail: email,
          recipientName: name,
          testTitle: certificate.testTitle,
          certificateId: certificate.certificateId,
          pdfBuffer: pdfBytes,
        });

        db.certificate.update({
          where: { id: certificate.id },
          data: { emailSent: true, emailSentAt: new Date().toISOString() },
        });
      } catch (mailErr) {
        console.warn('Post-feedback email trigger warning:', mailErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Feedback submitted successfully. Certificate unlocked.',
      feedback,
    });
  } catch (error: any) {
    console.error('Error submitting feedback:', error);
    return NextResponse.json({ success: false, error: error.message || 'Failed to submit feedback' }, { status: 500 });
  }
}
