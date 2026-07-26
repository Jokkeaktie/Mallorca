// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DayDetailsPanel } from '@/components/calendar/DayDetailsPanel';
import type { CalendarBooking } from '@/lib/types';

const booking: CalendarBooking = {
  id: 'b1',
  name: 'Joakim H.',
  status: 'approved',
  color: '#3A6351',
  startDate: '2026-08-10',
  endDate: '2026-08-17',
  hasPhoto: false,
};

describe('DayDetailsPanel', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async () => new Response(JSON.stringify({ ok: true }), { status: 200 })) as unknown as typeof fetch;
  });

  it('viser upload-knap for nøglebillede UDEN at kræve admin-status (familien må selv uploade)', async () => {
    render(
      <DayDetailsPanel
        isoDate="2026-08-12"
        bookings={[booking]}
        onClose={vi.fn()}
        isAdmin={false}
      />,
    );
    expect(screen.getByText('Tilføj billede af nøgle')).toBeInTheDocument();
  });

  it('uploader et valgt billede til den korrekte booking, uafhængigt af admin-status', async () => {
    const onPhotoUploaded = vi.fn();
    render(
      <DayDetailsPanel
        isoDate="2026-08-12"
        bookings={[booking]}
        onClose={vi.fn()}
        isAdmin={false}
        onPhotoUploaded={onPhotoUploaded}
      />,
    );

    const button = screen.getByText('Tilføj billede af nøgle');
    const container = button.closest('div')!;
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['x'], 'key.jpg', { type: 'image/jpeg' });

    fireEvent.change(fileInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/bookings/b1/photo',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    await waitFor(() => expect(onPhotoUploaded).toHaveBeenCalled());
    expect(await screen.findByText('Opdatér billede af nøgle')).toBeInTheDocument();
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
});
