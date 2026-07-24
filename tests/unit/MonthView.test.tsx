// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MonthView } from '@/components/calendar/MonthView';
import type { CalendarBooking } from '@/lib/types';

const bookings: CalendarBooking[] = [
  {
    id: '1',
    name: 'Joakim H.',
    status: 'request',
    color: '#3A6351',
    startDate: '2026-08-10',
    endDate: '2026-08-17',
  },
  {
    id: '2',
    name: 'Peter og Lise',
    status: 'request',
    color: '#2F5D8A',
    startDate: '2026-08-10',
    endDate: '2026-08-20',
  },
];

describe('MonthView', () => {
  it('viser danske ISO-ugenumre', () => {
    const anchor = new Date(2026, 7, 1);
    render(<MonthView monthAnchor={anchor} today={anchor} bookings={[]} onSelectDay={vi.fn()} />);
    // Gitterets første række starter mandag d. 27. juli 2026, som er ISO-uge 31.
    const weekNumbers = screen.getAllByTestId('iso-week-number').map((el) => el.textContent);
    expect(weekNumbers).toContain('31');
  });

  it('markerer dags dato', () => {
    const anchor = new Date(2026, 7, 15);
    render(<MonthView monthAnchor={anchor} today={anchor} bookings={[]} onSelectDay={vi.fn()} />);
    const todayCell = screen.getByText('15');
    expect(todayCell.className).toContain('bg-accent');
  });

  it('viser flere overlappende ønsker samtidig på samme dag', () => {
    const anchor = new Date(2026, 7, 1);
    render(
      <MonthView monthAnchor={anchor} today={anchor} bookings={bookings} onSelectDay={vi.fn()} />,
    );
    expect(screen.getAllByText('Joakim H.').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Peter og Lise').length).toBeGreaterThan(0);
  });
});
