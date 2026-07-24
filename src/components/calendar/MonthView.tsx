'use client';

import { buildMonthGrid } from '@/lib/date/calendarGrid';
import { isDateWithinBooking } from '@/lib/bookings/overlap';
import type { CalendarBooking } from '@/lib/types';
import { BookingBadge } from './BookingBadge';

const WEEKDAY_LABELS = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];
const MAX_VISIBLE_PER_DAY = 3;

interface MonthViewProps {
  monthAnchor: Date;
  today: Date;
  bookings: CalendarBooking[];
  onSelectDay: (isoDate: string) => void;
}

export function MonthView({ monthAnchor, today, bookings, onSelectDay }: MonthViewProps) {
  const weeks = buildMonthGrid(monthAnchor, today);

  return (
    <div className="overflow-hidden rounded-xl2 border border-line bg-white">
      <div className="grid grid-cols-[2.25rem_repeat(7,1fr)] border-b border-line bg-canvas text-xs font-medium text-muted">
        <div className="py-2 text-center" aria-hidden="true">
          Uge
        </div>
        {WEEKDAY_LABELS.map((label) => (
          <div key={label} className="py-2 text-center">
            {label}
          </div>
        ))}
      </div>

      {weeks.map((week) => (
        <div
          key={week.isoWeekNumber + '-' + week.days[0]!.isoDate}
          className="grid grid-cols-[2.25rem_repeat(7,1fr)] border-b border-line last:border-b-0"
        >
          <div
            data-testid="iso-week-number"
            aria-label={`Uge ${week.isoWeekNumber}`}
            className="flex items-center justify-center border-r border-line bg-canvas text-xs font-medium text-muted"
          >
            {week.isoWeekNumber}
          </div>
          {week.days.map((day) => {
            const dayBookings = bookings.filter((b) => isDateWithinBooking(day.isoDate, b));
            const visible = dayBookings.slice(0, MAX_VISIBLE_PER_DAY);
            const overflowCount = dayBookings.length - visible.length;

            return (
              <button
                key={day.isoDate}
                type="button"
                onClick={() => onSelectDay(day.isoDate)}
                className={`flex min-h-[4.5rem] flex-col gap-0.5 border-r border-line p-1 text-left last:border-r-0 sm:min-h-[6rem] sm:p-1.5 ${
                  day.isCurrentMonth ? 'bg-white' : 'bg-canvas/60 text-muted'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                    day.isToday ? 'bg-accent font-semibold text-white' : ''
                  }`}
                >
                  {day.date.getDate()}
                </span>
                <div className="flex flex-col gap-0.5">
                  {visible.map((booking) => (
                    <BookingBadge key={booking.id} booking={booking} />
                  ))}
                  {overflowCount > 0 && (
                    <span className="text-[11px] text-muted">+{overflowCount} mere</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}
