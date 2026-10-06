import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { COOKIE_NAME, createAdminSessionToken } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, isDemo } = body;

    const normalizedEmail = (email || '').trim().toLowerCase();
    const rawPassword = (password || '').trim();

    // STRICT ADMIN RESTRICTION: ONLY shardulparihar2007@gmail.com with Shardul@123
    if (normalizedEmail !== 'shardulparihar2007@gmail.com' || rawPassword !== 'Shardul@123') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Access restricted exclusively to authorized administrator (shardulparihar2007@gmail.com).' },
        { status: 401 }
      );
    }

    let admin = db.admin.findUnique({ where: { email: 'shardulparihar2007@gmail.com' } });

    if (!admin) {
      admin = db.admin.create({
        data: {
          id: 'admin-shardul',
          email: 'shardulparihar2007@gmail.com',
          name: 'Shardul Parihar',
          password: 'Shardul@123',
          role: 'SUPERADMIN',
        },
      });
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
