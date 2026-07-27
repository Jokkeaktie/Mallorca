'use client';

import { useEffect, useState } from 'react';
import type { PublicBooking } from '@/lib/types';
import { getTodayInApartmentTimeZone } from '@/lib/date/timezone';
import { BookingPhotoUploadInline } from '@/components/calendar/BookingPhotoUploadInline';

/**
 * Viser kun nøglebillede-upload for det ophold, der er aktivt LIGE NU (hvis
 * der er et) – uden at vise resten af kalenderen eller andre bookinger.
 * Bruges på familiens forside, som ikke længere har en kalenderoversigt.
 */
export function CurrentStayKeyPhoto() {
  const [booking, setBooking] = useState<PublicBooking | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const todayIso = getTodayInApartmentTimeZone();
        const response = await fetch('/api/bookings', { cache: 'no-store' });
        if (!response.ok) return;
        const data = await response.json();
        const bookings: PublicBooking[] = data.bookings ?? [];
        const current = bookings.find(
          (b) => b.status === 'approved' && b.startDate <= todayIso && todayIso <= b.endDate,
        );
        setBooking(current ?? null);
      } catch {
        // Ingen fejlvisning her – det er en diskret ekstra-boks, ikke kernefunktionen.
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading || !booking) return null;

  return (
    <div className="flex flex-col gap-2 rounded-xl2 border border-line bg-white p-4">
      <h2 className="text-sm font-medium text-ink">Nøglegemmested – {booking.name}</h2>
      <p className="text-xs text-muted">
        I bor i lejligheden lige nu. Tilføj gerne et billede af, hvor nøglen er gemt, til den
        næste gæst.
      </p>
      <BookingPhotoUploadInline
        bookingId={booking.id}
        bookingName={booking.name}
        hasPhotoInitially={booking.hasPhoto}
      />
    </div>
  );
}
