// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NewRequestsPanel } from '@/components/admin/NewRequestsPanel';
import type { AdminBooking } from '@/lib/types';

const pendingBooking: AdminBooking = {
  id: 'b1',
  name: 'Peter og Lise',
  status: 'request',
  color: '#2F5D8A',
  startDate: '2027-08-10',
  endDate: '2027-08-17',
  arrivalTime: null,
  departureTime: null,
  flightNumber: 'SK1533',
  internalComment: null,
  createdBy: null,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const approvedBooking: AdminBooking = {
  ...pendingBooking,
  id: 'b2',
  name: 'Tania H.',
  status: 'approved',
  createdAt: '2026-06-01T00:00:00.000Z',
};

describe('NewRequestsPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return new Response(
          JSON.stringify({ bookings: [approvedBooking, pendingBooking] }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
  });

  it('viser kun ubehandlede ønsker, ikke godkendte bookinger', async () => {
    render(<NewRequestsPanel refreshToken={0} onEdit={vi.fn()} onChanged={vi.fn()} />);

    expect(await screen.findByText('Peter og Lise')).toBeInTheDocument();
    expect(screen.queryByText('Tania H.')).not.toBeInTheDocument();
  });

  it('viser ikke noget panel, når der ikke er ubehandlede ønsker', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ bookings: [approvedBooking] }), { status: 200 }),
    ) as unknown as typeof fetch;

    const { container } = render(
      <NewRequestsPanel refreshToken={0} onEdit={vi.fn()} onChanged={vi.fn()} />,
    );

    await waitFor(() => expect(container.querySelector('.animate-pulse')).not.toBeInTheDocument());
    expect(container).toBeEmptyDOMElement();
  });

  it('godkender et ønske med ét tryk og kalder onChanged', async () => {
    const user = userEvent.setup();
    const onChanged = vi.fn();
    render(<NewRequestsPanel refreshToken={0} onEdit={vi.fn()} onChanged={onChanged} />);

    await screen.findByText('Peter og Lise');
    await user.click(screen.getByText('✓ Godkend'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bookings/b1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"status":"approved"'),
      }),
    );
  });

  it('kalder onEdit med bookingen ved tryk på Redigér', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<NewRequestsPanel refreshToken={0} onEdit={onEdit} onChanged={vi.fn()} />);

    await screen.findByText('Peter og Lise');
    await user.click(screen.getByText('Redigér'));

    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'b1' }));
  });
});
