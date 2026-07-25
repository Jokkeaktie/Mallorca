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
      title={`${booking.name} – ${isApproved ? 'Godkendt' : 'Ønske'}`}
    >
      <span aria-hidden="true" className="shrink-0">
        {isApproved ? '✓' : '~'}
      </span>
      <span className="min-w-0 truncate">{booking.name}</span>
    </span>
  );
}
