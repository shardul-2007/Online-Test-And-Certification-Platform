import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const certId = params.id;
    const certificate = db.certificate.findUnique({ where: { certificateId: certId } });

    if (!certificate) {
      return NextResponse.json({ success: false, error: 'Certificate not found or invalid' }, { status: 404 });
    }

    const test = db.test.findUnique({ where: { id: certificate.testId } });
    const user = db.user.findUnique({ where: { id: certificate.userId } });

    return NextResponse.json({
      success: true,
      certificate: {
        certificateId: certificate.certificateId,
        participantName: certificate.participantName,
        participantEmail: certificate.participantEmail,
        participantOrganization: certificate.participantOrganization || user?.organization || null,
        testTitle: certificate.testTitle,
        score: certificate.score,
        percentage: certificate.percentage,
        issueDate: certificate.issueDate,
        verificationUrl: certificate.verificationUrl,
        emailSent: certificate.emailSent,
        organizationName: test?.organizationName || 'NMIET in association with ISTE',
        certificateTitle: test?.certificateTitle || 'Certificate of Participation',
        status: 'Verified',
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
