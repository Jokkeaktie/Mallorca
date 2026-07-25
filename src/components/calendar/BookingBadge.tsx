import type { CalendarBooking } from '@/lib/types';
import { getReadableTextColor } from '@/lib/colors';

interface BookingBadgeProps {
  booking: CalendarBooking;
  size?: 'sm' | 'md';
}

/**
 * Visuel repræsentation af en booking. Status kan altid aflæses uden farve:
 * "Ønske" har stribet mønster + ~-ikon, "Godkendt" har fuld farve + ✓-ikon.
 */
export function BookingBadge({ booking, size = 'sm' }: BookingBadgeProps) {
  const textColor = getReadableTextColor(booking.color);
  const isApproved = booking.status === 'approved';

  return (
    <span
      className={`flex min-w-0 max-w-full items-center gap-1 rounded-md border border-black/10 px-1.5 ${
        size === 'sm' ? 'py-0.5 text-[11px]' : 'py-1 text-sm'
      } ${isApproved ? 'pattern-approved' : 'pattern-request'}`}
      style={{ '--pattern-color': booking.color, color: textColor } as React.CSSProperties}
      title={`${booking.name} – ${isApproved ? 'Godkendt' : 'Ønske'}${
        booking.hasPhoto ? ' · billede vedhæftet' : ''
      }`}
    >
      <span aria-hidden="true" className="shrink-0">
        {isApproved ? '✓' : '~'}
      </span>
      <span className="min-w-0 truncate">{booking.name}</span>
      {booking.hasPhoto && (
        <svg
          aria-hidden="true"
          viewBox="0 0 20 20"
          fill="currentColor"
          className={`shrink-0 opacity-80 ${size === 'sm' ? 'h-2.5 w-2.5' : 'h-3.5 w-3.5'}`}
        >
          <path d="M7.5 4a1 1 0 0 0-.83.45L5.87 6H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-1.87l-.8-1.55A1 1 0 0 0 12.5 4h-5ZM10 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
        </svg>
      )}
    </span>
  );
}
