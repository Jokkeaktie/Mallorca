import { NextResponse, type NextRequest } from 'next/server';
import { hasFamilyOrAdminAccess } from '@/lib/auth/accessControl';
import { createBooking } from '@/lib/bookings/repository';
import { bookingRequestSchema } from '@/lib/validation/bookingRequest';
import { SUGGESTED_COLORS } from '@/lib/colors';
import { sendBookingRequestNotification } from '@/lib/notifications/email';

/**
 * POST /api/booking-requests
 *
 * Lader familie/venner ønske en periode uden at kunne se de eksisterende
 * bookinger (de har ikke adgang til kalenderen). Oprettes altid som et
 * "ønske" (status "request") med en standardfarve – administratorerne ser
 * og behandler ønsket i deres egen kalender, hvor de også kan sætte en
 * anden farve og godkende/afvise det.
 */
export async function POST(request: NextRequest) {
  const isAllowed = await hasFamilyOrAdminAccess();
  if (!isAllowed) {
    return NextResponse.json({ error: 'Ikke godkendt.' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = bookingRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Ugyldigt input.', details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    await createBooking(
      {
        name: parsed.data.name,
        status: 'request',
        color: SUGGESTED_COLORS[0]!.value,
        startDate: parsed.data.startDate,
        endDate: parsed.data.endDate,
        arrivalTime: parsed.data.arrivalTime,
        departureTime: parsed.data.departureTime,
        flightNumber: parsed.data.flightNumber,
        internalComment: parsed.data.note ? `Besked fra familien: ${parsed.data.note}` : null,
      },
      null,
    );
    await sendBookingRequestNotification({
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      endDate: parsed.data.endDate,
      flightNumber: parsed.data.flightNumber,
    });
    return NextResponse.json({}, { status: 201 });
  } catch (error) {
    console.error('Fejl ved oprettelse af ønske', error);
    return NextResponse.json({ error: 'Der opstod en fejl.' }, { status: 500 });
  }
}
