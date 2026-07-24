import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin, hasFamilyOrAdminAccess } from '@/lib/auth/accessControl';
import { createBooking, listBookings } from '@/lib/bookings/repository';
import { toPublicBooking } from '@/lib/types';
import { bookingSchema } from '@/lib/validation/booking';
import { getTodayInApartmentTimeZone } from '@/lib/date/timezone';

/**
 * GET /api/bookings
 *
 * Leverer kalenderposter. Administratorer får alle felter; familie/venner
 * (kun med gyldig familie-cookie) får en filtreret udgave uden interne
 * kommentarer, klokkeslæt eller admin-metadata. Feltfiltreringen sker her
 * på serveren, ikke kun i frontend.
 *
 * Query-parametre (valgfrie): from, to (YYYY-MM-DD) til at afgrænse
 * intervallet, fx til måneds-/uge-/årsvisning. Uden "from" leveres poster
 * fra i dag og frem (Europe/Madrid), så standardvisningen ikke fyldes med
 * historik.
 */
export async function GET(request: NextRequest) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const isAdmin = !!(await requireAdmin());
  const from = searchParams.get('from') ?? (isAdmin ? undefined : getTodayInApartmentTimeZone());
  const to = searchParams.get('to') ?? undefined;

  try {
    const bookings = await listBookings(from, to);
    if (isAdmin) {
      return NextResponse.json({ bookings });
    }
    return NextResponse.json({ bookings: bookings.map(toPublicBooking) });
  } catch (error) {
    console.error('Fejl ved hentning af bookinger', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** POST /api/bookings – opret ny kalenderpost. Kun administratorer. */
export async function POST(request: NextRequest) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ugyldigt input.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const booking = await createBooking(parsed.data, adminId);
    return NextResponse.json({ booking }, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af booking', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
