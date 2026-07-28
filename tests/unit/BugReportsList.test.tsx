// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BugReportsList } from '@/components/admin/BugReportsList';
import type { BugReport } from '@/lib/types';

const openReport: BugReport = {
  id: 'r1',
  description: 'Lyset i køkkenet virker ikke',
  reporterName: 'Josefine',
  photos: [],
  status: 'new',
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

const resolvedReport: BugReport = {
  id: 'r2',
  description: 'Test',
  reporterName: 'Peter',
  photos: [],
  status: 'resolved',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-02T00:00:00.000Z',
};

describe('BugReportsList', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string, init?: RequestInit) => {
      if (!init || init.method === undefined) {
        return new Response(
          JSON.stringify({ reports: [openReport, resolvedReport] }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }) as unknown as typeof fetch;
  });

  it('viser åbne fejlrapporter med det samme, men skjuler løste bag en knap', async () => {
    render(<BugReportsList />);

    expect(await screen.findByText('Lyset i køkkenet virker ikke')).toBeInTheDocument();
    expect(screen.getByText('● Åben')).toBeInTheDocument();
    expect(screen.queryByText('Test')).not.toBeInTheDocument();
    expect(screen.getByText('+ Vis løste fejlrapporter (1)')).toBeInTheDocument();
  });

  it('viser løste fejlrapporter efter tryk på knappen', async () => {
    const user = userEvent.setup();
    render(<BugReportsList />);

    await screen.findByText('Lyset i køkkenet virker ikke');
    await user.click(screen.getByText('+ Vis løste fejlrapporter (1)'));

    expect(screen.getByText('Test')).toBeInTheDocument();
    expect(screen.getByText('✓ Løst')).toBeInTheDocument();
  });

  it('viser "Ingen åbne fejlrapporter." når alle er løst', async () => {
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ reports: [resolvedReport] }), { status: 200 }),
    ) as unknown as typeof fetch;

    render(<BugReportsList />);

    expect(await screen.findByText('Ingen åbne fejlrapporter.')).toBeInTheDocument();
    expect(screen.getByText('+ Vis løste fejlrapporter (1)')).toBeInTheDocument();
  });

  it('markerer en åben rapport som løst', async () => {
    const user = userEvent.setup();
    render(<BugReportsList />);

    await screen.findByText('Lyset i køkkenet virker ikke');
    await user.click(screen.getByText('Markér som løst'));

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bug-reports/r1',
      expect.objectContaining({
        method: 'PATCH',
        body: expect.stringContaining('"status":"resolved"'),
      }),
    );
  });
});
