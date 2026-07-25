export type BookingStatus = 'request' | 'approved';

/** Fuldt kalenderpost-objekt, kun til administratorbrug. */
export interface AdminBooking {
  id: string;
  name: string;
  status: BookingStatus;
  color: string;
  startDate: string; // ISO-dato (YYYY-MM-DD)
  endDate: string; // ISO-dato (YYYY-MM-DD)
  arrivalTime: string | null; // HH:mm
  departureTime: string | null; // HH:mm
  internalComment: string | null;
  createdBy: string | null;
  photoPath: string | null;
  photoContentType: string | null;
  /** Bekvemmeligheds-felt afledt af photoPath, så frontend ikke selv skal tjekke det. */
  hasPhoto: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Begrænset udgave af en kalenderpost til familievisningen.
 * Indeholder bevidst IKKE tidspunkter, kommentarer eller admin-metadata.
 * "hasPhoto" fortæller kun OM der findes et billede (fx af nøglegemmested) –
 * selve billedet hentes separat via /api/bookings/[id]/photo, som selv
 * tjekker adgang, uanset om kalderen er familie eller administrator.
 */
export interface PublicBooking {
  id: string;
  name: string;
  status: BookingStatus;
  color: string;
  startDate: string;
  endDate: string;
  hasPhoto: boolean;
}

/**
 * Fælles type til kalendervisningen. Indeholder altid de offentlige felter;
 * admin-felterne er valgfrie og kun til stede når API'et har leveret dem
 * (dvs. når kaldet kom fra en logget ind administrator).
 */
export interface CalendarBooking extends PublicBooking {
  arrivalTime?: string | null;
  departureTime?: string | null;
  internalComment?: string | null;
  createdBy?: string | null;
  photoPath?: string | null;
  photoContentType?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export function toPublicBooking(booking: AdminBooking): PublicBooking {
  return {
    id: booking.id,
    name: booking.name,
    status: booking.status,
    color: booking.color,
    startDate: booking.startDate,
    endDate: booking.endDate,
    hasPhoto: booking.hasPhoto,
  };
}

/**
 * Praktisk info til familievisningen. Der er ingen private felter her –
 * alt indhold i disse to typer er tiltænkt at blive vist til familie/venner.
 */
export interface ChecklistItem {
  id: string;
  text: string;
  sortOrder: number;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  sortOrder: number;
}
