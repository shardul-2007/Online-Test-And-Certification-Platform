import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { COOKIE_NAME, createAdminSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, isDemo } = body;

    let admin = null;

    if (isDemo) {
      // 1-Click Demo Login for effortless evaluation
      admin = db.admin.findUnique({ where: { email: 'admin@skillcert.org' } });
      if (!admin) {
        const allAdmins = db.admin.findMany();
        admin = allAdmins[0] || null;
      }
    } else {
      if (!email || !password) {
        return NextResponse.json({ success: false, error: 'Email and password required' }, { status: 400 });
      }

      admin = db.admin.findUnique({ where: { email } });
      if (!admin || admin.password !== password) {
        return NextResponse.json({ success: false, error: 'Invalid admin credentials' }, { status: 401 });
      }
    }

    if (!admin) {
      return NextResponse.json({ success: false, error: 'Admin account not found' }, { status: 404 });
    }

    const token = createAdminSessionToken(admin.id, admin.email);

    const response = NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
