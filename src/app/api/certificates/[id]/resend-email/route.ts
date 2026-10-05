import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf';
import { sendCertificateEmail } from '@/lib/email';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certId = params.id;
    const body = await request.json().catch(() => ({}));
    let certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    const recipientName = (body.name || certificate?.participantName || 'FDP Participant').trim();
    const recipientEmail = (body.email || certificate?.participantEmail || '').trim();
    const recipientOrg = (body.organization || certificate?.participantOrganization || '').trim();
    const score = typeof body.score === 'number' ? body.score : (certificate?.score ?? 0);
    const maxScore = typeof body.maxScore === 'number' ? body.maxScore : (certificate ? 50 : 50);
    const percentage = typeof body.percentage === 'number' ? body.percentage : (certificate?.percentage ?? 0);

    if (!recipientEmail) {
      return NextResponse.json({ success: false, error: 'Recipient email address is required' }, { status: 400 });
    }

    if (!certificate) {
      // Self-heal and record certificate in DB
      certificate = db.certificate.create({
        data: {
          certificateId: certId,
          attemptId: (body.attemptId as string) || `attempt-${certId}`,
          userId: `user-${certId}`,
          testId: 'fdp-test-2026',
          participantName: recipientName,
          participantEmail: recipientEmail,
          participantOrganization: recipientOrg || null,
          testTitle: (body.testTitle as string) || 'Faculty Development Programme (FDP) Assessment',
          score,
          percentage,
          issueDate: (body.issueDate as string) || new Date().toISOString(),
          verificationUrl: `/verify/${certId}`,
          emailSent: false,
          emailSentAt: null,
        },
      });
    } else {
      if (body.name) certificate.participantName = recipientName;
      if (body.email) certificate.participantEmail = recipientEmail;
      if (body.organization) certificate.participantOrganization = recipientOrg;
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });

    const pdfBytes = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      participantName: recipientName,
      participantOrganization: recipientOrg || undefined,
      testTitle: certificate.testTitle || 'Faculty Development Programme (FDP) Assessment',
      score,
      maxScore,
      percentage,
      issueDate: certificate.issueDate,
      organizationName: test?.organizationName || 'NMIET in association with ISTE',
      certificateTitle: test?.certificateTitle || 'Certificate of Participation',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    const emailResult = await sendCertificateEmail({
      recipientEmail: recipientEmail,
      recipientName: recipientName,
      testTitle: certificate.testTitle || 'Faculty Development Programme (FDP) Assessment',
      certificateId: certificate.certificateId,
      pdfBuffer: pdfBytes,
    });

    return NextResponse.json({
      success: emailResult.success,
      emailStatus: emailResult,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
