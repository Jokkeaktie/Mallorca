// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekView } from '@/components/calendar/WeekView';
import type { CalendarBooking } from '@/lib/types';

const bookings: CalendarBooking[] = [
  {
    id: '1',
    name: 'Tania H.',
    status: 'approved',
    color: '#C1653A',
    startDate: '2026-08-13',
    endDate: '2026-08-13',
  },
];

describe('WeekView', () => {
  it('viser ISO-ugenummer i overskriften', () => {
    render(
      <WeekView
        weekAnchor={new Date(2026, 7, 12)}
        today={new Date(2026, 7, 12)}
        bookings={[]}
        onSelectDay={vi.fn()}
      />,
    );
    expect(screen.getByText(/Uge 33/)).toBeInTheDocument();
  });

  it('viser 7 dage (mandag-søndag)', () => {
    const { container } = render(
      <WeekView
        weekAnchor={new Date(2026, 7, 12)}
        today={new Date(2026, 7, 12)}
        bookings={[]}
        onSelectDay={vi.fn()}
      />,
    );
    const dayButtons = container.querySelectorAll('button');
    expect(dayButtons).toHaveLength(7);
  });

  it('viser en booking på den rigtige dag', () => {
    render(
      <WeekView
        weekAnchor={new Date(2026, 7, 12)}
        today={new Date(2026, 7, 12)}
        bookings={bookings}
        onSelectDay={vi.fn()}
      />,
    );
    expect(screen.getByText('Tania H.')).toBeInTheDocument();
  });

  it('renderer uden at kræve en bred skærm (ingen fixed-width elementer der forudsætter desktop)', () => {
    const { container } = render(
      <WeekView
        weekAnchor={new Date(2026, 7, 12)}
        today={new Date(2026, 7, 12)}
        bookings={bookings}
        onSelectDay={vi.fn()}
      />,
    );
    const html = container.innerHTML;
    expect(html).not.toMatch(/width:\s*\d{3,}px/);
  });
});
