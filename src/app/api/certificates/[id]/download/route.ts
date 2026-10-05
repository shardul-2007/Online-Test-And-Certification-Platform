import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certId = params.id;
    const url = new URL(request.url);
    const qName = url.searchParams.get('name');
    const qOrg = url.searchParams.get('org');
    const qScore = Number(url.searchParams.get('score')) || 0;
    const qMaxScore = Number(url.searchParams.get('maxScore')) || 50;
    const qPct = Number(url.searchParams.get('pct')) || 0;

    let certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    if (!certificate) {
      certificate = db.certificate.create({
        data: {
          certificateId: certId,
          attemptId: `attempt-${certId}`,
          userId: `user-${certId}`,
          testId: 'fdp-test-2026',
          participantName: qName ? decodeURIComponent(qName).trim() : 'FDP Participant',
          participantEmail: 'participant@nmiet.edu.in',
          participantOrganization: qOrg ? decodeURIComponent(qOrg).trim() : 'NMIET in association with ISTE',
          testTitle: 'Faculty Development Programme (FDP) Assessment',
          score: qScore,
          percentage: qPct,
          issueDate: new Date().toISOString(),
          verificationUrl: `/verify/${certId}`,
          emailSent: false,
          emailSentAt: null,
        },
      });
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });
    const attempt = db.attempt.findUnique({ where: { id: certificate.attemptId } });

    const participantName = qName ? decodeURIComponent(qName).trim() : certificate.participantName;
    const participantOrg = qOrg ? decodeURIComponent(qOrg).trim() : certificate.participantOrganization;
    const score = qScore > 0 ? qScore : certificate.score;
    const maxScore = qMaxScore > 0 ? qMaxScore : (attempt?.maxScore || 50);
    const percentage = qPct > 0 ? qPct : certificate.percentage;

    const pdfBytes = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      participantName: participantName || certificate.participantName,
      participantOrganization: participantOrg || certificate.participantOrganization || undefined,
      testTitle: certificate.testTitle,
      score,
      maxScore,
      percentage,
      issueDate: certificate.issueDate,
      organizationName: test?.organizationName || 'NMIET in association with ISTE',
      certificateTitle: test?.certificateTitle || 'Certificate of Participation',
      appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    });

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${certificate.certificateId}.pdf"`,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
      },
    });
  } catch (error: any) {
    console.error('Error generating PDF download:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
