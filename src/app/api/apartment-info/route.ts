import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess, requireAdmin } from '@/lib/auth/accessControl';
import { getApartmentInfo, setApartmentInfo } from '@/lib/settings/apartmentInfo';
import { apartmentInfoSchema } from '@/lib/validation/content';

/** GET /api/apartment-info – fri tekst om lejligheden. Familie/venner og administratorer. */
export async function GET() {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const text = await getApartmentInfo();
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Fejl ved hentning af lejligheds-info', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** PATCH /api/apartment-info – opdatér teksten. Kun administratorer. */
export async function PATCH(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = apartmentInfoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Ugyldigt input.' }, { status: 400 });
  }

  try {
    await setApartmentInfo(parsed.data.text);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved opdatering af lejligheds-info', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
