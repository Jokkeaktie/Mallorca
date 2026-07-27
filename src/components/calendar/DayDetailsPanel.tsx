'use client';

import type { CalendarBooking } from '@/lib/types';
import { formatDanishDate, formatDanishDateRange } from '@/lib/date/format';
import { isDateWithinBooking } from '@/lib/bookings/overlap';

interface DayDetailsPanelProps {
  isoDate: string;
  bookings: CalendarBooking[];
  onClose: () => void;
  isAdmin?: boolean;
  onEdit?: (booking: CalendarBooking) => void;
  onDelete?: (booking: CalendarBooking) => void;
}

export function DayDetailsPanel({
  isoDate,
  bookings,
  onClose,
  isAdmin,
  onEdit,
  onDelete,
}: DayDetailsPanelProps) {
  const dayBookings = bookings.filter((b) => isDateWithinBooking(isoDate, b));

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 sm:items-center" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-xl2 bg-white p-5 sm:rounded-xl2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold capitalize text-ink">
            {formatDanishDate(isoDate)}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Luk"
            className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-muted hover:bg-canvas"
          >
            ×
          </button>
        </div>

        {dayBookings.length === 0 ? (
          <p className="text-sm text-muted">Ingen ønsker eller bookinger denne dag.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {dayBookings.map((booking) => (
              <li key={booking.id} className="rounded-xl2 border border-line p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-ink">{booking.name}</p>
                    <p className="text-sm text-muted">
                      {formatDanishDateRange(booking.startDate, booking.endDate)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                      booking.status === 'approved'
                        ? 'bg-accent/15 text-accent'
                        : 'bg-muted/15 text-muted'
                    }`}
                  >
                    {booking.status === 'approved' ? '✓ Godkendt' : '~ Ønske'}
                  </span>
                </div>

                {isAdmin && (
                  <div className="mt-2 flex flex-col gap-1 border-t border-line pt-2 text-sm text-muted">
                    {(booking.arrivalTime || booking.departureTime) && (
                      <p>
                        Ankomst: {booking.arrivalTime ?? 'ikke angivet'} · Afrejse:{' '}
                        {booking.departureTime ?? 'ikke angivet'}
                      </p>
                    )}
                    {booking.flightNumber && <p>Flynummer: {booking.flightNumber}</p>}
                    {booking.internalComment && (
                      <p className="italic">&ldquo;{booking.internalComment}&rdquo;</p>
                    )}
                    <div className="mt-1 flex gap-2">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(booking)}
                          className="rounded-full border border-line px-3 py-1 text-xs hover:bg-canvas"
                        >
                          Redigér
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(booking)}
                          className="rounded-full border border-red-200 px-3 py-1 text-xs text-red-700 hover:bg-red-50"
                        >
                          Slet
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
