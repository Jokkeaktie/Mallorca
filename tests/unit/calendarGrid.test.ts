import { describe, expect, it } from 'vitest';
import { buildMonthGrid, buildWeek } from '@/lib/date/calendarGrid';

describe('danske ISO-ugenumre', () => {
  it('1. januar 2026 (torsdag) ligger i ISO-uge 1', () => {
    const jan1 = new Date(2026, 0, 1);
    const week = buildWeek(jan1, jan1);
    expect(week.isoWeekNumber).toBe(1);
  });

  it('mandag er ugens første dag', () => {
    const jan1 = new Date(2026, 0, 1); // torsdag
    const week = buildWeek(jan1, jan1);
    expect(week.days[0]!.date.getDay()).toBe(1); // 1 = mandag i JS Date
    expect(week.days[6]!.date.getDay()).toBe(0); // 0 = søndag
  });

  it('månedsgitteret indeholder korrekte, fortløbende ISO-ugenumre', () => {
    const august2026 = new Date(2026, 7, 1);
    const weeks = buildMonthGrid(august2026, august2026);
    const weekNumbers = weeks.map((w) => w.isoWeekNumber);
    // Ugenumre skal være stigende (med årsskift-wrap accepteret, sker ikke i august)
    for (let i = 1; i < weekNumbers.length; i++) {
      expect(weekNumbers[i]).toBe(weekNumbers[i - 1]! + 1);
    }
  });

  it('markerer dags dato korrekt', () => {
    const today = new Date(2026, 7, 15);
    const weeks = buildMonthGrid(today, today);
    const todayCell = weeks.flatMap((w) => w.days).find((d) => d.isoDate === '2026-08-15');
    expect(todayCell?.isToday).toBe(true);
  });

  it('dage uden for den valgte måned er markeret som ikke-nuværende måned', () => {
    const august2026 = new Date(2026, 7, 1);
    const weeks = buildMonthGrid(august2026, august2026);
    const firstWeek = weeks[0]!;
    const hasOutsideDay = firstWeek.days.some((d) => !d.isCurrentMonth);
    // August 2026 starter på en lørdag, så gitteret starter i juli.
    expect(hasOutsideDay).toBe(true);
  });
});
