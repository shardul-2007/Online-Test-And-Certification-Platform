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
    const certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });
    const attempt = db.attempt.findUnique({ where: { id: certificate.attemptId } });

    const maxScore = attempt?.maxScore || 50;

    const recipientName = (body.name || certificate.participantName || 'Participant').trim();
    const recipientEmail = (body.email || certificate.participantEmail || '').trim();
    const recipientOrg = (body.organization || certificate.participantOrganization || '').trim();

    if (body.name) certificate.participantName = recipientName;
    if (body.email) certificate.participantEmail = recipientEmail;
    if (body.organization) certificate.participantOrganization = recipientOrg;

    const pdfBytes = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      participantName: recipientName,
      participantOrganization: recipientOrg || undefined,
      testTitle: certificate.testTitle || 'Faculty Development Programme (FDP) Assessment',
      score: certificate.score,
      maxScore,
      percentage: certificate.percentage,
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
