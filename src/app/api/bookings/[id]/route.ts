import { NextResponse, type NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/auth/accessControl';
import { deleteBooking, getBookingById, updateBooking } from '@/lib/bookings/repository';
import { bookingSchema } from '@/lib/validation/booking';

interface RouteParams {
  params: { id: string };
}

/** GET /api/bookings/:id – fuld detalje. Kun administratorer. */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const booking = await getBookingById(params.id);
  if (!booking) {
    return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
  }
  return NextResponse.json({ booking });
}

/** PATCH /api/bookings/:id – opdatér kalenderpost. Kun administratorer. */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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
    const booking = await updateBooking(params.id, parsed.data);
    if (!booking) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ booking });
  } catch (error) {
    console.error('Fejl ved opdatering af booking', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}

/** DELETE /api/bookings/:id – slet kalenderpost. Kun administratorer. */
export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const adminId = await requireAdmin();
  if (!adminId) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  try {
    const deleted = await deleteBooking(params.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Ikke fundet.' }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Fejl ved sletning af booking', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
