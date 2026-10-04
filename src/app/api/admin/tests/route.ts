import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const tests = db.test.findMany();
    return NextResponse.json({ success: true, tests });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, durationMinutes, passingPercentage, certificateTitle, organizationName } = body;

    if (!title || !description) {
      return NextResponse.json({ success: false, error: 'Title and description are required' }, { status: 400 });
    }

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

    const newTest = db.test.create({
      data: {
        title,
        slug: `${slug}-${Date.now().toString(36)}`,
        description,
        durationMinutes: Number(durationMinutes) || 20,
        passingPercentage: Number(passingPercentage) || 60,
        isPublished: true,
        certificateTitle: certificateTitle || 'Certificate of Achievement',
        organizationName: organizationName || 'SkillCert Global Institute',
      },
    });

    return NextResponse.json({ success: true, test: newTest });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, description, durationMinutes, passingPercentage, isPublished, certificateTitle, organizationName } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 });
    }

    const updated = db.test.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(description ? { description } : {}),
        ...(durationMinutes !== undefined ? { durationMinutes: Number(durationMinutes) } : {}),
        ...(passingPercentage !== undefined ? { passingPercentage: Number(passingPercentage) } : {}),
        ...(isPublished !== undefined ? { isPublished: Boolean(isPublished) } : {}),
        ...(certificateTitle ? { certificateTitle } : {}),
        ...(organizationName ? { organizationName } : {}),
      },
    });

    return NextResponse.json({ success: true, test: updated });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Test ID is required' }, { status: 400 });
    }

    db.test.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Test deleted' });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
