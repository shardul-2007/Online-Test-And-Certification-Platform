import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import QRCode from 'qrcode';

export interface CertificateData {
  certificateId: string;
  participantName: string;
  testTitle: string;
  score: number;
  maxScore: number;
  percentage: number;
  issueDate: string;
  organizationName?: string;
  certificateTitle?: string;
  appUrl?: string;
}

export async function generateCertificatePdf(data: CertificateData): Promise<Uint8Array> {
  const width = 842; // A4 Landscape width
  const height = 595; // A4 Landscape height

  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([width, height]);

  // Fonts
  const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const timesRomanItalic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
  const timesRomanBold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const courier = await pdfDoc.embedFont(StandardFonts.Courier);

  // Palette
  const bgNavy = rgb(0.04, 0.06, 0.12);
  const bgCard = rgb(0.06, 0.09, 0.16);
  const gold = rgb(0.85, 0.68, 0.28);
  const goldLight = rgb(0.96, 0.84, 0.48);
  const cyanAccent = rgb(0.0, 0.88, 0.76);
  const textWhite = rgb(0.96, 0.96, 0.98);
  const textMuted = rgb(0.68, 0.72, 0.82);
  const borderNavy = rgb(0.15, 0.22, 0.35);

  // 1. Background Fill
  page.drawRectangle({
    x: 0,
    y: 0,
    width,
    height,
    color: bgNavy,
  });

  // 2. Inner Certificate Panel
  page.drawRectangle({
    x: 20,
    y: 20,
    width: width - 40,
    height: height - 40,
    color: bgCard,
    borderColor: borderNavy,
    borderWidth: 1.5,
  });

  // 3. Gold Decorative Border
  page.drawRectangle({
    x: 30,
    y: 30,
    width: width - 60,
    height: height - 60,
    borderColor: gold,
    borderWidth: 1.5,
  });

  // Inner subtle accent
  page.drawRectangle({
    x: 34,
    y: 34,
    width: width - 68,
    height: height - 68,
    borderColor: rgb(0.2, 0.25, 0.38),
    borderWidth: 0.75,
  });

  // 4. Corner Geometrics (Gold & Cyan Highlights)
  const drawCorner = (cx: number, cy: number, flipX: number, flipY: number) => {
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx + flipX * 35, y: cy },
      thickness: 3,
      color: gold,
    });
    page.drawLine({
      start: { x: cx, y: cy },
      end: { x: cx, y: cy + flipY * 35 },
      thickness: 3,
      color: gold,
    });
    page.drawCircle({
      x: cx + flipX * 12,
      y: cy + flipY * 12,
      size: 3,
      color: cyanAccent,
    });
  };

  drawCorner(38, 38, 1, 1);
  drawCorner(width - 38, 38, -1, 1);
  drawCorner(38, height - 38, 1, -1);
  drawCorner(width - 38, height - 38, -1, -1);

  // Helper for centered text
  const drawCenteredText = (text: string, y: number, font: any, size: number, color: any) => {
    const textWidth = font.widthOfTextAtSize(text, size);
    page.drawText(text, {
      x: (width - textWidth) / 2,
      y,
      font,
      size,
      color,
    });
  };

  // 5. Header: Organization & Authority
  const orgName = (data.organizationName || 'SKILLCERT GLOBAL INSTITUTE').toUpperCase();
  drawCenteredText(orgName, height - 75, helveticaBold, 13, goldLight);
  drawCenteredText('INTERNATIONAL ACCREDITATION & PROFESSIONAL VERIFICATION COUNCIL', height - 90, courier, 8.5, textMuted);

  // Decorative Horizontal Ribbon Line
  page.drawLine({
    start: { x: 220, y: height - 102 },
    end: { x: width - 220, y: height - 102 },
    thickness: 1,
    color: gold,
  });
  page.drawCircle({
    x: width / 2,
    y: height - 102,
    size: 4,
    color: cyanAccent,
  });

  // 6. Certificate Title
  const certTitle = (data.certificateTitle || 'CERTIFICATE OF ACHIEVEMENT').toUpperCase();
  drawCenteredText(certTitle, height - 140, timesRomanBold, 26, textWhite);

  // Subtitle
  drawCenteredText('THIS CREDENTIAL IS PROUDLY CONFERRED UPON', height - 170, timesRomanItalic, 11, textMuted);

  // 7. Participant Name (Hero Typography)
  drawCenteredText(data.participantName, height - 215, timesRomanBold, 32, goldLight);

  // Underline for name
  const nameWidth = timesRomanBold.widthOfTextAtSize(data.participantName, 32);
  page.drawLine({
    start: { x: (width - nameWidth) / 2 - 20, y: height - 225 },
    end: { x: (width + nameWidth) / 2 + 20, y: height - 225 },
    thickness: 1,
    color: cyanAccent,
  });

  // 8. Description & Test Name
  drawCenteredText(
    'in formal recognition of fulfilling all curricular criteria and demonstrating excellence in the professional examination:',
    height - 252,
    helvetica,
    10.5,
    textMuted
  );

  drawCenteredText(data.testTitle, height - 280, helveticaBold, 17, textWhite);

  // 9. Score and Passing Metric Card
  const scoreText = `Evaluated Score: ${data.score}/${data.maxScore}  |  Passing Grade: ${Math.round(data.percentage)}%  |  Status: CERTIFIED`;
  const badgeWidth = helveticaBold.widthOfTextAtSize(scoreText, 10.5) + 36;
  page.drawRectangle({
    x: (width - badgeWidth) / 2,
    y: height - 322,
    width: badgeWidth,
    height: 24,
    color: rgb(0.08, 0.14, 0.24),
    borderColor: cyanAccent,
    borderWidth: 1,
  });
  drawCenteredText(scoreText, height - 314, helveticaBold, 10.5, cyanAccent);

  // 10. Metadata (Date & Unique Certificate ID)
  const formattedDate = new Date(data.issueDate).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  page.drawText(`Date of Conferral: ${formattedDate}`, {
    x: 60,
    y: 165,
    font: helvetica,
    size: 10,
    color: textMuted,
  });

  page.drawText(`Unique Certificate ID:`, {
    x: 60,
    y: 148,
    font: helvetica,
    size: 9.5,
    color: textMuted,
  });

  page.drawText(data.certificateId, {
    x: 60,
    y: 130,
    font: courier,
    size: 12,
    color: goldLight,
  });

  const fullVerifyUrl = `${data.appUrl || 'http://localhost:3000'}/verify/${data.certificateId}`;
  page.drawText(`Public Verification: ${fullVerifyUrl}`, {
    x: 60,
    y: 112,
    font: courier,
    size: 8,
    color: rgb(0.45, 0.55, 0.72),
  });

  // 11. Signatures
  // Left Signatory
  page.drawLine({
    start: { x: width - 360, y: 150 },
    end: { x: width - 200, y: 150 },
    thickness: 1,
    color: textMuted,
  });
  page.drawText('Dr. Arthur Vance', {
    x: width - 340,
    y: 135,
    font: timesRomanBold,
    size: 11,
    color: textWhite,
  });
  page.drawText('Chair of Examination Board', {
    x: width - 345,
    y: 122,
    font: helvetica,
    size: 8.5,
    color: textMuted,
  });

  // 12. QR Code Generation & Embedding
  try {
    const qrDataUrl = await QRCode.toDataURL(fullVerifyUrl, {
      margin: 1,
      width: 140,
      color: {
        dark: '#00F5C8',
        light: '#070B14',
      },
    });
    const qrBase64 = qrDataUrl.split(',')[1];
    const qrBytes = Buffer.from(qrBase64, 'base64');
    const qrImage = await pdfDoc.embedPng(qrBytes);

    // Draw QR Code
    page.drawImage(qrImage, {
      x: width - 150,
      y: 90,
      width: 75,
      height: 75,
    });

    page.drawText('SCAN TO VERIFY', {
      x: width - 146,
      y: 78,
      font: courier,
      size: 7,
      color: cyanAccent,
    });
  } catch (err) {
    console.error('Error generating QR code for PDF:', err);
  }

  // 13. Official Seal Graphic on Bottom Left / Center
  page.drawCircle({
    x: width / 2,
    y: 110,
    size: 26,
    borderColor: gold,
    borderWidth: 1.5,
    color: rgb(0.08, 0.12, 0.22),
  });
  page.drawCircle({
    x: width / 2,
    y: 110,
    size: 22,
    borderColor: cyanAccent,
    borderWidth: 0.5,
  });
  const sealText = 'VERIFIED';
  const sealWidth = courier.widthOfTextAtSize(sealText, 6.5);
  page.drawText(sealText, {
    x: width / 2 - sealWidth / 2,
    y: 107,
    font: courier,
    size: 6.5,
    color: goldLight,
  });

  // Footer Disclaimer
  drawCenteredText(
    'This credential is electronically issued and authenticated by cryptographic verification standards. Valid worldwide.',
    42,
    helvetica,
    7.5,
    rgb(0.4, 0.45, 0.55)
  );

  return await pdfDoc.save();
}
