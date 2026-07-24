import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { setFamilyPassword } from '@/lib/auth/familyPassword';
import { changeFamilyPasswordSchema } from '@/lib/validation/booking';

/** POST /api/admin/password – skift familiens fælles adgangskode. Kun administratorer. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = changeFamilyPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Adgangskoden skal være mindst 8 tegn.' },
      { status: 400 },
    );
  }

  try {
    await setFamilyPassword(parsed.data.newPassword);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved skift af familie-adgangskode', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
