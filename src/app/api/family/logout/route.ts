import { NextResponse } from 'next/server';
import { FAMILY_SESSION_COOKIE } from '@/lib/auth/familySession';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FAMILY_SESSION_COOKIE, '', { path: '/', maxAge: 0 });
  return response;
}
