'use client';

import { buildMonthGrid, buildYearMonths } from '@/lib/date/calendarGrid';
import { isDateWithinBooking } from '@/lib/bookings/overlap';
import { formatDanishMonthYear } from '@/lib/date/format';
import type { CalendarBooking } from '@/lib/types';

interface YearViewProps {
  yearAnchor: Date;
  today: Date;
  bookings: CalendarBooking[];
  onSelectMonth: (monthAnchor: Date) => void;
}

export function YearView({ yearAnchor, today, bookings, onSelectMonth }: YearViewProps) {
  const months = buildYearMonths(yearAnchor);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {months.map((monthAnchor) => {
        const weeks = buildMonthGrid(monthAnchor, today);
        return (
          <button
            key={monthAnchor.toISOString()}
            type="button"
            onClick={() => onSelectMonth(monthAnchor)}
            className="rounded-xl2 border border-line bg-white p-3 text-left hover:border-accent"
          >
            <p className="mb-2 text-center text-sm font-semibold capitalize text-ink">
              {formatDanishMonthYear(monthAnchor)}
            </p>
            <div className="grid grid-cols-7 gap-y-1 text-center text-[10px] text-muted">
              {['M', 'T', 'O', 'T', 'F', 'L', 'S'].map((d, i) => (
                <span key={`${d}-${i}`}>{d}</span>
              ))}
              {weeks.flatMap((week) =>
                week.days.map((day) => {
                  const dayBookings = bookings.filter((b) => isDateWithinBooking(day.isoDate, b));
                  return (
                    <div
                      key={day.isoDate}
                      className={`flex flex-col items-center gap-0.5 py-0.5 ${
                        day.isCurrentMonth ? '' : 'opacity-30'
                      }`}
                    >
                      <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full text-[9px] ${
                          day.isToday ? 'bg-accent text-white' : 'text-ink'
                        }`}
                      >
                        {day.date.getDate()}
                      </span>
                      <span className="flex gap-0.5">
                        {dayBookings.slice(0, 3).map((booking) => (
                          <span
                            key={booking.id}
                            className="h-1.5 w-1.5 rounded-full"
                            style={{
                              backgroundColor: booking.color,
                              opacity: booking.status === 'approved' ? 1 : 0.45,
                            }}
                          />
                        ))}
                      </span>
                    </div>
                  );
                }),
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
