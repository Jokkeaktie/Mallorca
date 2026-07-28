// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryManager } from '@/components/admin/GalleryManager';

const categories = [{ id: 'cat-1', name: 'Udsigt', sortOrder: 0 }];
const photos = [{ id: 'p1', categoryId: 'cat-1', sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' }];

/** Kategorinavnet vises både i et <input> og som valgmulighed i <select>-bokse; denne matcher rammer kun input-feltet. */
function categoryNameInput(name: string) {
  return (value: string, element: Element | null) => value === name && element?.tagName === 'INPUT';
}

function mockFetch() {
  return vi.fn(async (url: string, init?: RequestInit) => {
    const href = url.toString();
    if (!init || init.method === undefined) {
      if (href.includes('/api/gallery/categories')) {
        return new Response(JSON.stringify({ categories }), { status: 200 });
      }
      if (href.includes('/api/gallery/photos')) {
        return new Response(JSON.stringify({ photos }), { status: 200 });
      }
    }
    if (init?.method === 'POST' && href.includes('/api/gallery/categories')) {
      return new Response(
        JSON.stringify({ category: { id: 'cat-2', name: 'Inventar', sortOrder: 1 } }),
        { status: 201 },
      );
    }
    if (init?.method === 'POST' && href.includes('/api/gallery/photos')) {
      return new Response(
        JSON.stringify({ photo: { id: 'p2', categoryId: null, sortOrder: 0, createdAt: '' } }),
        { status: 201 },
      );
    }
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as unknown as typeof fetch;
}

describe('GalleryManager', () => {
  beforeEach(() => {
    global.fetch = mockFetch();
  });

  it('viser eksisterende kategorier og billeder grupperet', async () => {
    render(<GalleryManager />);

    expect(await screen.findByDisplayValue(categoryNameInput('Udsigt'))).toBeInTheDocument();
    expect(screen.getAllByText('Udsigt').length).toBeGreaterThan(0);
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('opretter en ny kategori', async () => {
    const user = userEvent.setup();
    render(<GalleryManager />);

    await screen.findByDisplayValue(categoryNameInput('Udsigt'));
    await user.type(screen.getByPlaceholderText('Fx: Udsigt'), 'Inventar');
    await user.click(screen.getByText('Ny kategori'));

    expect(await screen.findByDisplayValue(categoryNameInput('Inventar'))).toBeInTheDocument();
  });

  it('sletter en kategori og gør dens billeder ukategoriserede', async () => {
    const user = userEvent.setup();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    render(<GalleryManager />);

    await screen.findByDisplayValue(categoryNameInput('Udsigt'));
    await user.click(screen.getByRole('button', { name: 'Slet' }));

    expect(await screen.findByRole('heading', { name: 'Ukategoriseret' })).toBeInTheDocument();
    expect(screen.queryByDisplayValue(categoryNameInput('Udsigt'))).not.toBeInTheDocument();
  });
});
