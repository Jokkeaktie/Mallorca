'use client';

import { buildWeek } from '@/lib/date/calendarGrid';
import { isDateWithinBooking } from '@/lib/bookings/overlap';
import { formatDanishWeekday } from '@/lib/date/format';
import type { CalendarBooking } from '@/lib/types';
import { BookingBadge } from './BookingBadge';

interface WeekViewProps {
  weekAnchor: Date;
  today: Date;
  bookings: CalendarBooking[];
  onSelectDay: (isoDate: string) => void;
}

export function WeekView({ weekAnchor, today, bookings, onSelectDay }: WeekViewProps) {
  const week = buildWeek(weekAnchor, today);

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-muted">Uge {week.isoWeekNumber}</p>
      <div className="flex flex-col gap-2">
        {week.days.map((day) => {
          const dayBookings = bookings.filter((b) => isDateWithinBooking(day.isoDate, b));

          return (
            <button
              key={day.isoDate}
              type="button"
              onClick={() => onSelectDay(day.isoDate)}
              className={`flex items-start gap-3 rounded-xl2 border border-line bg-white p-3 text-left ${
                day.isToday ? 'ring-2 ring-accent' : ''
              }`}
            >
              <div className="flex w-14 shrink-0 flex-col items-center">
                <span className="text-xs uppercase text-muted">{formatDanishWeekday(day.date)}</span>
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full text-sm ${
                    day.isToday ? 'bg-accent font-semibold text-white' : 'text-ink'
                  }`}
                >
                  {day.date.getDate()}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
                {dayBookings.length === 0 ? (
                  <span className="py-1.5 text-sm text-muted">Ledig</span>
                ) : (
                  dayBookings.map((booking) => (
                    <BookingBadge key={booking.id} booking={booking} size="md" />
                  ))
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
