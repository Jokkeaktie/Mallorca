'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { CalendarBooking } from '@/lib/types';
import { getTodayInApartmentTimeZone } from '@/lib/date/timezone';
import { formatDanishMonthYear } from '@/lib/date/format';
import { getISOWeek } from 'date-fns';
import {
  shiftMonths,
  shiftWeeks,
  shiftYears,
} from '@/lib/date/calendarGrid';
import { CalendarNav, type CalendarViewMode } from './CalendarNav';
import { MonthView } from './MonthView';
import { WeekView } from './WeekView';
import { YearView } from './YearView';
import { DayDetailsPanel } from './DayDetailsPanel';
import { Legend } from './Legend';
import { CalendarSkeleton } from './CalendarSkeleton';

interface CalendarShellProps {
  isAdmin?: boolean;
  onEditBooking?: (booking: CalendarBooking) => void;
  onDeleteBooking?: (booking: CalendarBooking) => void;
  /** Bumpes udefra (fx efter opret/redigér/slet) for at tvinge genindlæsning. */
  refreshToken?: number;
}

function parseIsoDate(isoDate: string): Date {
  const parts = isoDate.split('-').map(Number);
  const [y, m, d] = [parts[0]!, parts[1]!, parts[2]!];
  return new Date(y, m - 1, d);
}

export function CalendarShell({
  isAdmin,
  onEditBooking,
  onDeleteBooking,
  refreshToken,
}: CalendarShellProps) {
  const todayIso = useMemo(() => getTodayInApartmentTimeZone(), []);
  const today = useMemo(() => parseIsoDate(todayIso), [todayIso]);

  const [view, setView] = useState<CalendarViewMode>('month');
  const [anchor, setAnchor] = useState<Date>(today);
  const [bookings, setBookings] = useState<CalendarBooking[]>([]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadBookings = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const params = new URLSearchParams();
      if (isAdmin) {
        // Administratorer ser også historiske poster ved at hente et bredt interval.
        params.set('from', '1970-01-01');
      }
      const response = await fetch(`/api/bookings?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!response.ok) {
        setLoadError('Kunne ikke hente kalenderen. Prøv at genindlæse siden.');
        return;
      }
      const data = await response.json();
      setBookings(data.bookings ?? []);
    } catch {
      setLoadError('Kunne ikke hente kalenderen. Tjek din internetforbindelse.');
    } finally {
      setIsLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings, refreshToken]);

  const label = useMemo(() => {
    if (view === 'month') return formatDanishMonthYear(anchor);
    if (view === 'year') return String(anchor.getFullYear());
    return `Uge ${getISOWeek(anchor)}, ${anchor.getFullYear()}`;
  }, [view, anchor]);

  function handlePrev() {
    if (view === 'month') setAnchor((a) => shiftMonths(a, -1));
    else if (view === 'week') setAnchor((a) => shiftWeeks(a, -1));
    else setAnchor((a) => shiftYears(a, -1));
  }

  function handleNext() {
    if (view === 'month') setAnchor((a) => shiftMonths(a, 1));
    else if (view === 'week') setAnchor((a) => shiftWeeks(a, 1));
    else setAnchor((a) => shiftYears(a, 1));
  }

  function handleToday() {
    setAnchor(today);
  }

  return (
    <div className="flex flex-col gap-4">
      <CalendarNav
        view={view}
        onViewChange={setView}
        label={label}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
      />

      <Legend />

      {loadError && <p className="text-sm text-red-700">{loadError}</p>}
      {isLoading && !loadError && <CalendarSkeleton />}

      {!isLoading && !loadError && (
        <>
          {view === 'month' && (
            <MonthView
              monthAnchor={anchor}
              today={today}
              bookings={bookings}
              onSelectDay={setSelectedDay}
            />
          )}
          {view === 'week' && (
            <WeekView
              weekAnchor={anchor}
              today={today}
              bookings={bookings}
              onSelectDay={setSelectedDay}
            />
          )}
          {view === 'year' && (
            <YearView
              yearAnchor={anchor}
              today={today}
              bookings={bookings}
              onSelectMonth={(monthAnchor) => {
                setAnchor(monthAnchor);
                setView('month');
              }}
            />
          )}
        </>
      )}

      {selectedDay && (
        <DayDetailsPanel
          isoDate={selectedDay}
          bookings={bookings}
          onClose={() => setSelectedDay(null)}
          isAdmin={isAdmin}
          onEdit={
            onEditBooking
              ? (booking) => {
                  setSelectedDay(null);
                  onEditBooking(booking);
                }
              : undefined
          }
          onDelete={onDeleteBooking}
          onPhotoUploaded={loadBookings}
        />
      )}
    </div>
  );
}
