import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateData {
  certificateId: string;
  participantName: string;
  participantOrganization?: string;
  testTitle?: string;
  score?: number;
  maxScore?: number;
  percentage?: number;
  issueDate?: string;
  organizationName?: string;
  certificateTitle?: string;
  appUrl?: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const templatePathClean = path.join(process.cwd(), 'public', 'certificate-template-clean.jpg');
  const templatePathRaw = path.join(process.cwd(), 'public', 'certificate-template.jpg');

  const templateFile = fs.existsSync(templatePathClean)
    ? templatePathClean
    : fs.existsSync(templatePathRaw)
    ? templatePathRaw
    : null;

  if (templateFile) {
    try {
      const imgBytes = fs.readFileSync(templateFile);
      const pdfDoc = await PDFDocument.create();
      const img = await pdfDoc.embedJpg(imgBytes);

      const width = img.width || 1024;
      const height = img.height || 707;
      const page = pdfDoc.addPage([width, height]);

      // 1. Draw official high-res NMIET & ISTE certificate template
      page.drawImage(img, { x: 0, y: 0, width, height });

      const timesBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
      const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const participantName = (data.participantName || 'PARTICIPANT NAME').toUpperCase().trim();
      const orgName = (data.participantOrganization || '').trim();
      const certId = data.certificateId || 'CERT-NMIET-2026';
      const appUrl = (data.appUrl || 'http://localhost:3000').replace(/\/$/, '');

      // 2. Clear out the participant name zone cleanly (between y=374 and y=412 in PDF coords)
      page.drawRectangle({
        x: 100,
        y: 374,
        width: 824,
        height: 38,
        color: rgb(1, 1, 1),
      });

      // Redraw the crisp dark underline below participant name
      page.drawLine({
        start: { x: 100, y: 374 },
        end: { x: 924, y: 374 },
        thickness: 1.5,
        color: rgb(0.12, 0.16, 0.28),
      });

      // Compute font size so long names scale dynamically without clipping
      let nameSize = 25;
      let calculatedWidth = timesBold.widthOfTextAtSize(participantName, nameSize);
      const maxAvailableWidth = 760;
      if (calculatedWidth > maxAvailableWidth) {
        nameSize = Math.max(16, (maxAvailableWidth / calculatedWidth) * nameSize);
        calculatedWidth = timesBold.widthOfTextAtSize(participantName, nameSize);
      }
      const nameX = (width - calculatedWidth) / 2;

      // Draw the participant name prominently centered
      page.drawText(participantName, {
        x: nameX,
        y: 382,
        size: nameSize,
        font: timesBold,
        color: rgb(0.08, 0.12, 0.25),
      });

      // 3. Organization / College Name after "FROM"
      page.drawRectangle({
        x: 175,
        y: 314,
        width: 715,
        height: 24,
        color: rgb(1, 1, 1),
      });

      page.drawLine({
        start: { x: 175, y: 314 },
        end: { x: 890, y: 314 },
        thickness: 1,
        color: rgb(0.25, 0.3, 0.42),
      });

      if (orgName) {
        let orgSize = 13;
        let orgWidth = helveticaBold.widthOfTextAtSize(orgName, orgSize);
        if (orgWidth > 680) {
          orgSize = Math.max(10, (680 / orgWidth) * orgSize);
        }
        page.drawText(orgName, {
          x: 185,
          y: 320,
          size: orgSize,
          font: helveticaBold,
          color: rgb(0.12, 0.16, 0.28),
        });
      }

      // 4. Unique Verification QR Code in bottom-right corner
      try {
        const qrUrl = `${appUrl}/verify/${certId}`;
        const qrDataUrl = await QRCode.toDataURL(qrUrl, { margin: 1, width: 96 });
        const qrBase64 = qrDataUrl.split(',')[1];
        const qrImage = await pdfDoc.embedPng(Buffer.from(qrBase64, 'base64'));
        page.drawImage(qrImage, {
          x: 948,
          y: 18,
          width: 48,
          height: 48,
        });
      } catch (qrErr) {
        console.warn('QR code generation skipped:', qrErr);
      }

      // 5. Verification Metadata text in bottom-left corner
      page.drawText(`Certificate ID: ${certId}`, {
        x: 36,
        y: 28,
        size: 8.5,
        font: helveticaBold,
        color: rgb(0.3, 0.35, 0.45),
      });
      page.drawText(`Verify Online: ${appUrl}/verify/${certId}`, {
        x: 36,
        y: 18,
        size: 7.5,
        font: helvetica,
        color: rgb(0.4, 0.45, 0.55),
      });

      return await pdfDoc.save();
    } catch (err) {
      console.error('Error generating template-based PDF, falling back to vector:', err);
    }
  }

  // Fallback vector generation if template is unavailable
  const width = 842;
  const height = 595;
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);

  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: rgb(0.04, 0.06, 0.12),
  });

  page.drawRectangle({
    x: 24,
    y: 24,
    width: width - 48,
    height: height - 48,
    color: rgb(0.98, 0.98, 1),
    borderColor: rgb(0.85, 0.68, 0.28),
    borderWidth: 2,
  });

  page.drawText("NUTAN MAHARASHTRA VIDYA PRASARAK MANDAL'S (NMVPM)", {
    x: 180,
    y: height - 60,
    size: 11,
    font: helveticaBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  page.drawText('NUTAN MAHARASHTRA INSTITUTE OF ENGINEERING AND TECHNOLOGY', {
    x: 120,
    y: height - 80,
    size: 15,
    font: helveticaBold,
    color: rgb(0.08, 0.12, 0.25),
  });

  page.drawText('CERTIFICATE OF PARTICIPATION', {
    x: 230,
    y: height - 160,
    size: 24,
    font: timesRomanBold,
    color: rgb(0.08, 0.12, 0.28),
  });

  const participantName = (data.participantName || 'PARTICIPANT').toUpperCase();
  page.drawText(participantName, {
    x: (width - timesRomanBold.widthOfTextAtSize(participantName, 24)) / 2,
    y: height - 240,
    size: 24,
    font: timesRomanBold,
    color: rgb(0.1, 0.15, 0.3),
  });

  page.drawText('Certificate ID: ' + data.certificateId, {
    x: 40,
    y: 40,
    size: 9,
    font: helvetica,
    color: rgb(0.3, 0.3, 0.4),
  });

  return await pdfDoc.save();
}
