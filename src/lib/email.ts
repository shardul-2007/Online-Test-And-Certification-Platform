import nodemailer from 'nodemailer';
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
  const orgName = process.env.ORGANIZATION_NAME || 'Department of Information Technology, NMIET (in association with ISTE)';

  const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #060912; color: #E2E8F0; margin: 0; padding: 24px; }
    .card { max-width: 600px; margin: 0 auto; background: #0E1626; border: 1px solid #1E293B; border-radius: 14px; padding: 36px; box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .header { text-align: center; margin-bottom: 24px; border-bottom: 1px solid #1E293B; padding-bottom: 20px; }
    .title { color: #F5D061; font-size: 20px; font-weight: 700; margin: 0 0 6px 0; }
    .subtitle { color: #94A3B8; font-size: 13px; margin: 0; line-height: 1.5; }
    .content { font-size: 15px; line-height: 1.6; color: #CBD5E1; margin: 24px 0; }
    .cert-box { background: #070B14; border: 1px dashed #F5D061; border-radius: 10px; padding: 18px; text-align: center; margin: 24px 0; }
    .cert-id { font-family: monospace; font-size: 20px; color: #F5D061; font-weight: bold; letter-spacing: 1px; }
    .btn-container { text-align: center; margin: 30px 0; }
    .btn { display: inline-block; padding: 12px 24px; margin: 0 8px 10px 8px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; }
    .btn-primary { background: #F5D061; color: #070B14; }
    .btn-secondary { background: #1E293B; color: #E2E8F0; border: 1px solid #334155; }
    .footer { text-align: center; font-size: 12px; color: #64748B; border-top: 1px solid #1E293B; padding-top: 20px; margin-top: 32px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1 class="title">Nutan Maharashtra Institute of Engineering & Technology</h1>
      <p class="subtitle">Department of Information Technology · In Association with ISTE<br>Faculty Development Programme (5th to 9th Oct, 2026)</p>
    </div>

    <div class="content">
      <p>Hi <strong>${recipientName}</strong>,</p>
      <p>Congratulations on completing the assessment for the Faculty Development Programme on <strong>“Recent advances in cyber security and blockchain for secure digital transformation”</strong> held on 5th to 9th Oct, 2026.</p>
      <p>Your official <strong>Certificate of Participation</strong> has been generated successfully and is attached directly to this email.</p>
    </div>

    <div class="cert-box">
      <div style="font-size: 12px; color: #94A3B8; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 0.5px;">Certificate Identifier</div>
      <div class="cert-id">${certificateId}</div>
    </div>

    <div class="btn-container">
      <a href="${downloadUrl}" class="btn btn-primary">Download Certificate (PDF)</a>
      <a href="${verifyUrl}" class="btn btn-secondary">Verify Certificate Online</a>
    </div>

    <div class="content">
      <p>A printable, high-resolution PDF copy of your Certificate of Participation is also attached below for your records and professional portfolios.</p>
      <p>Regards,<br><strong>Department of Information Technology</strong><br>Nutan Maharashtra Institute of Engineering and Technology (NMIET), Talegaon, Pune</p>
    </div>

    <div class="footer">
      <p>© 2026 NMIET & ISTE. All rights reserved.</p>
      <p>Public Verification Link: ${verifyUrl}</p>
    </div>
  </div>
</body>
</html>
  `;

  const textBody = `
Hi ${recipientName},

Congratulations on completing the assessment for the Faculty Development Programme on “Recent advances in cyber security and blockchain for secure digital transformation” held on 5th to 9th Oct, 2026 organized by Department of Information Technology, NMIET in association with ISTE.

Your Certificate of Participation has been generated successfully.

Certificate ID:
${certificateId}

You can download and verify your certificate using the links below:

Download Certificate:
${downloadUrl}

Verify Certificate:
${verifyUrl}

Attached is your official PDF certificate.

Regards,
Department of Information Technology, NMIET (in association with ISTE)
  `.trim();

  const apiKey = process.env.RESEND_API_KEY;
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER || process.env.GMAIL_USER;
  const smtpPass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;

  // 1. Send via SMTP / Gmail App Password if configured
  if (smtpUser && smtpPass) {
    try {
      const isGmail = !smtpHost || smtpHost.includes('gmail') || !!process.env.GMAIL_USER;
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: Number(process.env.SMTP_PORT || 587),
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

      const fromAddress = process.env.SMTP_FROM || `"NMIET & ISTE FDP" <${smtpUser}>`;

      const info = await transporter.sendMail({
        from: fromAddress,
        to: recipientEmail,
        subject: 'Congratulations! Your FDP Certificate of Participation is Ready',
        text: textBody,
        html: htmlBody,
        attachments: [
          {
            filename: `${certificateId}.pdf`,
            content: Buffer.from(pdfBuffer),
          },
        ],
      });

      const log = db.emailLog.create({
        data: {
          certificateId,
          recipient: recipientEmail,
          emailType: 'CERTIFICATE_DELIVERY',
          status: 'DELIVERED',
          providerId: info.messageId || `smtp_${Date.now()}`,
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
    } catch (smtpErr: any) {
      console.error('Failed to send email via SMTP:', smtpErr);
      db.emailLog.create({
        data: {
          certificateId,
          recipient: recipientEmail,
          emailType: 'CERTIFICATE_DELIVERY',
          status: 'FAILED',
          providerId: null,
          errorMessage: smtpErr.message || 'SMTP Error',
        },
      });

      return {
        success: false,
        status: 'FAILED',
        error: smtpErr.message,
      };
    }
  }

  // 2. Send via Resend if RESEND_API_KEY is configured
  if (apiKey && apiKey.startsWith('re_')) {
    try {
      const resend = new Resend(apiKey);
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'certificates@resend.dev';

      const response = await resend.emails.send({
        from: `NMIET FDP <${fromEmail}>`,
        to: recipientEmail,
        subject: 'Congratulations! Your FDP Certificate of Participation is Ready',
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
