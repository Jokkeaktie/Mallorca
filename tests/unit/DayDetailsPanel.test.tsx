// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayDetailsPanel } from '@/components/calendar/DayDetailsPanel';
import type { CalendarBooking } from '@/lib/types';

const booking: CalendarBooking = {
  id: 'b1',
  name: 'Joakim H.',
  status: 'approved',
  color: '#3A6351',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
};

describe('DayDetailsPanel', () => {
  it('viser bookingens navn og status', () => {
    render(
      <DayDetailsPanel isoDate="2026-08-12" bookings={[booking]} onClose={vi.fn()} isAdmin={false} />,
    );
    expect(screen.getByText('Joakim H.')).toBeInTheDocument();
    expect(screen.getByText('✓ Godkendt')).toBeInTheDocument();
  });

  it('redigér/slet-knapper vises stadig kun for administratorer', () => {
    render(
      <DayDetailsPanel
        isoDate="2026-08-12"
        bookings={[booking]}
        onClose={vi.fn()}
        isAdmin={false}
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.queryByText('Redigér')).not.toBeInTheDocument();
    expect(screen.queryByText('Slet')).not.toBeInTheDocument();
  });

  it('viser ingen poster-besked når der ikke er bookinger den dag', () => {
    render(<DayDetailsPanel isoDate="2026-08-12" bookings={[]} onClose={vi.fn()} isAdmin={false} />);
    expect(screen.getByText('Ingen ønsker eller bookinger denne dag.')).toBeInTheDocument();
  });
});
