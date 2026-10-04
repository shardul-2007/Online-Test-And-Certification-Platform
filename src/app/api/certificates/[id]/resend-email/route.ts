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
    const certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found' }, { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });
    const attempt = db.attempt.findUnique({ where: { id: certificate.attemptId } });

    const maxScore = attempt?.maxScore || 10;

    const pdfBytes = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      participantName: certificate.participantName,
      testTitle: certificate.testTitle,
      score: certificate.score,
      maxScore,
      percentage: certificate.percentage,
      issueDate: certificate.issueDate,
      organizationName: test?.organizationName || 'SkillCert Global Institute',
      certificateTitle: test?.certificateTitle || 'Certificate of Achievement',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    const emailResult = await sendCertificateEmail({
      recipientEmail: certificate.participantEmail,
      recipientName: certificate.participantName,
      testTitle: certificate.testTitle,
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
