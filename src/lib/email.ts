import { Resend } from 'resend';
import { db } from './db';

export interface SendCertificateEmailParams {
  recipientEmail: string;
  recipientName: string;
  testTitle: string;
  certificateId: string;
  pdfBuffer: Uint8Array | Buffer;
  appUrl?: string;
}

export async function sendCertificateEmail(params: SendCertificateEmailParams): Promise<{
  success: boolean;
  status: 'DELIVERED' | 'SENT' | 'SIMULATED' | 'FAILED';
  providerId?: string;
  error?: string;
}> {
  const {
    recipientEmail,
    recipientName,
    testTitle,
    certificateId,
    pdfBuffer,
    appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  } = params;

  const downloadUrl = `${appUrl}/api/certificates/${certificateId}/download`;
  const verifyUrl = `${appUrl}/verify/${certificateId}`;
  const orgName = process.env.ORGANIZATION_NAME || 'SkillCert Global Institute';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #070B14; color: #E2E8F0; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0E1626; border: 1px solid #1E293B; border-radius: 12px; padding: 36px; }
    .header { text-align: center; margin-bottom: 24px; }
    .title { color: #00F5C8; font-size: 22px; font-weight: 700; margin: 0 0 8px 0; }
    .subtitle { color: #94A3B8; font-size: 14px; margin: 0; }
    .content { font-size: 15px; line-height: 1.6; color: #CBD5E1; margin: 24px 0; }
    .cert-box { background: #070B14; border: 1px dashed #00F5C8; border-radius: 8px; padding: 18px; text-align: center; margin: 24px 0; }
    .cert-id { font-family: monospace; font-size: 18px; color: #F5D061; font-weight: bold; letter-spacing: 1px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; padding: 12px 24px; margin: 0 8px 10px 8px; border-radius: 6px; font-weight: 600; text-decoration: none; font-size: 14px; }
    .btn-primary { background: #00F5C8; color: #070B14; }
    .btn-secondary { background: #1E293B; color: #E2E8F0; border: 1px solid #334155; }
    .footer { text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="title">SkillCert Global Institute</h1>
      <p class="subtitle">Official Academic & Industry Certification</p>
    </div>

    <div class="content">
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>Congratulations on successfully completing <strong>${testTitle}</strong>!</p>
      <p>Your performance has been evaluated and your official, cryptographically verifiable certificate has been generated.</p>
    </div>

    <div class="cert-box">
      <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Certificate Identifier</div>
      <div class="cert-id">${certificateId}</div>
    </div>

    <div class="btn-container">
      <a href="${downloadUrl}" class="btn btn-primary">Download Certificate (PDF)</a>
      <a href="${verifyUrl}" class="btn btn-secondary">Verify Certificate</a>
    </div>

    <div class="content">
      <p>A copy of your PDF certificate is also attached to this email for your permanent records and LinkedIn credential sharing.</p>
      <p>Regards,<br><strong>${orgName}</strong></p>
    </div>

    <div class="footer">
      <p>© ${new Date().getFullYear()} ${orgName}. All rights reserved.</p>
      <p>This is an automated transactional message. Verification URL: ${verifyUrl}</p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
Hi ${recipientName},

Congratulations on successfully completing ${testTitle}.

Your certificate has been generated successfully.

Certificate ID:
${certificateId}

You can download and verify your certificate using the links below:

Download Certificate:
${downloadUrl}

Verify Certificate:
${verifyUrl}

Regards,
${orgName}
  `.trim();

  const apiKey = process.env.RESEND_API_KEY;

  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'certificates@resend.dev';

      const response = await resend.emails.send({
        from: `${orgName} <${fromEmail}>`,
        to: recipientEmail,
        subject: 'Congratulations! Your Certificate is Ready',
        text: textBody,
        html: htmlBody,
        attachments: [
          {
            filename: `${certificateId}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      const log = db.emailLog.create({
        data: {
          certificateId,
          recipient: recipientEmail,
          emailType: 'CERTIFICATE_DELIVERY',
          status: 'DELIVERED',
          providerId: response.data?.id || `msg_${Date.now()}`,
          errorMessage: null,
        },
      });

      db.certificate.update({
        where: { certificateId },
        data: { emailSent: true, emailSentAt: new Date().toISOString() },
      });

      return {
        success: true,
        status: 'DELIVERED',
        providerId: log.providerId || undefined,
      };
    } catch (err: any) {
      console.error('Failed to send email via Resend:', err);
      db.emailLog.create({
        data: {
          certificateId,
          recipient: recipientEmail,
          emailType: 'CERTIFICATE_DELIVERY',
          status: 'FAILED',
          providerId: null,
          errorMessage: err.message || 'Unknown Resend error',
        },
      });

      return {
        success: false,
        status: 'FAILED',
        error: err.message,
      };
    }
  } else {
    // Simulated Transactional Email Delivery (Zero API key friction for development & testing)
    const simulatedMsgId = `sim_msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    db.emailLog.create({
      data: {
        certificateId,
        recipient: recipientEmail,
        emailType: 'CERTIFICATE_DELIVERY',
        status: 'SIMULATED',
        providerId: simulatedMsgId,
        errorMessage: null,
      },
    });

    db.certificate.update({
      where: { certificateId },
      data: { emailSent: true, emailSentAt: new Date().toISOString() },
    });

    return {
      success: true,
      status: 'SIMULATED',
      providerId: simulatedMsgId,
    };
  }
}
