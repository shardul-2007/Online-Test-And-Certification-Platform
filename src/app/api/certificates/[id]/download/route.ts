import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { generateCertificatePdf } from '@/lib/pdf';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certId = params.id;
    const certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    if (!certificate) {
      return new NextResponse('Certificate not found', { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });
    const attempt = db.attempt.findUnique({ where: { id: certificate.attemptId } });

    const maxScore = attempt?.maxScore || 10;

    const pdfBytes = await generateCertificatePdf({
      certificateId: certificate.certificateId,
      participantName: certificate.participantName,
      participantOrganization: certificate.participantOrganization || undefined,
      testTitle: certificate.testTitle,
      score: certificate.score,
      maxScore,
      percentage: certificate.percentage,
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
