import { NextResponse, type NextRequest } from 'next/server';
import { verifyFamilyPassword } from '@/lib/auth/familyPassword';
import { createFamilySessionToken, FAMILY_SESSION_COOKIE } from '@/lib/auth/familySession';
import { isRateLimited } from '@/lib/auth/rateLimit';
import { familyPasswordLoginSchema } from '@/lib/validation/booking';

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for') ?? 'ukendt';
  if (isRateLimited(`family-login:${ip}`)) {
    return NextResponse.json(
      { error: 'For mange forsøg. Vent lidt og prøv igen.' },
      { status: 429 },
    );
  }

  const body = await request.json().catch(() => null);
  const parsed = familyPasswordLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  const isCorrect = await verifyFamilyPassword(parsed.data.password);
  if (!isCorrect) {
    return NextResponse.json({ error: 'Forkert adgangskode.' }, { status: 401 });
  }

  const { token, maxAgeSeconds } = await createFamilySessionToken();
  const response = NextResponse.json({ ok: true });
  response.cookies.set(FAMILY_SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: maxAgeSeconds,
  });
  return response;
}
