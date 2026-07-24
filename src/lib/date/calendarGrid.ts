import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfISOWeek,
  endOfMonth,
  getISOWeek,
  isSameDay,
  isSameMonth,
  startOfISOWeek,
  startOfMonth,
} from 'date-fns';

/** En enkelt dag i en kalendergitter-visning. */
export interface CalendarDay {
  date: Date;
  isoDate: string; // YYYY-MM-DD
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface CalendarWeek {
  isoWeekNumber: number;
  days: CalendarDay[];
}

function toIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Bygger et månedsgitter med danske ISO-uger (mandag som første dag).
 * Gitteret starter altid på mandagen i ugen der indeholder d. 1. i måneden
 * og slutter søndag i ugen der indeholder månedens sidste dag, så
 * kalenderen altid viser hele uger.
 */
export function buildMonthGrid(monthAnchor: Date, today: Date): CalendarWeek[] {
  const firstOfMonth = startOfMonth(monthAnchor);
  const lastOfMonth = endOfMonth(monthAnchor);
  const gridStart = startOfISOWeek(firstOfMonth);
  const gridEnd = endOfISOWeek(lastOfMonth);

  const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });
  const weeks: CalendarWeek[] = [];

  for (let i = 0; i < allDays.length; i += 7) {
    const weekDays = allDays.slice(i, i + 7);
    const days: CalendarDay[] = weekDays.map((date) => ({
      date,
      isoDate: toIsoDate(date),
      isCurrentMonth: isSameMonth(date, monthAnchor),
      isToday: isSameDay(date, today),
    }));
    weeks.push({
      isoWeekNumber: getISOWeek(weekDays[0]!),
      days,
    });
  }

  return weeks;
}

/** Bygger en enkelt uges dage (mandag-søndag) ud fra en vilkårlig dato i ugen. */
export function buildWeek(weekAnchor: Date, today: Date): CalendarWeek {
  const start = startOfISOWeek(weekAnchor);
  const days = eachDayOfInterval({ start, end: endOfISOWeek(weekAnchor) }).map(
    (date) => ({
      date,
      isoDate: toIsoDate(date),
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
    }),
  );
  return { isoWeekNumber: getISOWeek(start), days };
}

/** De 12 måneder i et givent år, til årsoversigten. */
export function buildYearMonths(yearAnchor: Date): Date[] {
  const jan = new Date(yearAnchor.getFullYear(), 0, 1);
  return Array.from({ length: 12 }, (_, i) => addMonths(jan, i));
}

export function shiftMonths(anchor: Date, amount: number): Date {
  return addMonths(anchor, amount);
}

export function shiftWeeks(anchor: Date, amount: number): Date {
  return addDays(anchor, amount * 7);
}

export function shiftYears(anchor: Date, amount: number): Date {
  return new Date(anchor.getFullYear() + amount, anchor.getMonth(), anchor.getDate());
}
