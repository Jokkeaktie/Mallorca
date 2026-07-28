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
  flightNumber: string | null;
  internalComment: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Begrænset udgave af en kalenderpost til familievisningen.
 * Indeholder bevidst IKKE tidspunkter, kommentarer eller admin-metadata.
 */
export interface PublicBooking {
  id: string;
  name: string;
  status: BookingStatus;
  color: string;
  startDate: string;
  endDate: string;
}

/**
 * Fælles type til kalendervisningen. Indeholder altid de offentlige felter;
 * admin-felterne er valgfrie og kun til stede når API'et har leveret dem
 * (dvs. når kaldet kom fra en logget ind administrator).
 */
export interface CalendarBooking extends PublicBooking {
  arrivalTime?: string | null;
  departureTime?: string | null;
  flightNumber?: string | null;
  internalComment?: string | null;
  createdBy?: string | null;
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

export type BugReportStatus = 'new' | 'resolved';

export interface BugReportPhoto {
  path: string;
  contentType: string;
}

/**
 * Fejlrapport fra familie/venner. Kun administratorer kan læse disse –
 * der findes bevidst ingen "offentlig" udgave af denne type.
 */
export interface BugReport {
  id: string;
  description: string;
  reporterName: string | null;
  photos: BugReportPhoto[];
  status: BugReportStatus;
  createdAt: string;
  updatedAt: string;
}

/** Kategori i billedgalleriet (fx "Udsigt", "Inventar"), navngivet af administratorerne. */
export interface GalleryCategory {
  id: string;
  name: string;
  sortOrder: number;
}

/**
 * Billede i galleriet. Selve billeddataen leveres separat via
 * /api/gallery/photos/:id/image, som tjekker adgang - denne type
 * indeholder bevidst ikke sti/content-type.
 */
export interface GalleryPhoto {
  id: string;
  categoryId: string | null;
  sortOrder: number;
  createdAt: string;
}
