import { cookies } from 'next/headers';
import { db } from './db';

const COOKIE_NAME = 'certipulse_admin_session';

export function createAdminSessionToken(adminId: string, email: string): string {
  const payload = {
    adminId,
    email,
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

export function parseAdminSessionToken(token: string): { adminId: string; email: string } | null {
  try {
    const raw = Buffer.from(token, 'base64').toString('utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.adminId || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return { adminId: parsed.adminId, email: parsed.email };
  } catch {
    return null;
  }
}

export async function getCurrentAdmin() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const session = parseAdminSessionToken(token);
  if (!session) return null;

  // STRICT REQUIREMENT: Only shardulparihar2007@gmail.com is permitted administrator access
  if (session.email.toLowerCase() !== 'shardulparihar2007@gmail.com') {
    return null;
  }

  const admin = db.admin.findUnique({ where: { id: session.adminId } }) ||
    db.admin.findUnique({ where: { email: 'shardulparihar2007@gmail.com' } });
  if (!admin) return null;

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    role: admin.role,
  };
}

export { COOKIE_NAME };
