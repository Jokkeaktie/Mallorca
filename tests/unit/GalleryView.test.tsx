// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GalleryView } from '@/components/gallery/GalleryView';

const categories = [{ id: 'cat-1', name: 'Udsigt', sortOrder: 0 }];
const photos = [
  { id: 'p1', categoryId: 'cat-1', sortOrder: 0, createdAt: '2026-01-01T00:00:00.000Z' },
  { id: 'p2', categoryId: null, sortOrder: 0, createdAt: '2026-01-02T00:00:00.000Z' },
];

describe('GalleryView', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => {
      const href = url.toString();
      if (href.includes('/api/gallery/categories')) {
        return new Response(JSON.stringify({ categories }), { status: 200 });
      }
      if (href.includes('/api/gallery/photos')) {
        return new Response(JSON.stringify({ photos }), { status: 200 });
      }
      throw new Error('unexpected url ' + href);
    }) as unknown as typeof fetch;
  });

  it('grupperer billeder efter kategori, og lægger ukategoriserede under "Andet"', async () => {
    render(<GalleryView />);

    expect(await screen.findByText('Udsigt')).toBeInTheDocument();
    expect(screen.getByText('Andet')).toBeInTheDocument();
    expect(screen.getAllByRole('img')).toHaveLength(2);
  });

  it('viser besked når der ikke er nogen billeder', async () => {
    global.fetch = vi.fn(async (url: string) => {
      const href = url.toString();
      if (href.includes('/api/gallery/categories')) {
        return new Response(JSON.stringify({ categories: [] }), { status: 200 });
      }
      return new Response(JSON.stringify({ photos: [] }), { status: 200 });
    }) as unknown as typeof fetch;

    render(<GalleryView />);
    expect(await screen.findByText('Der er ikke lagt nogen billeder op endnu.')).toBeInTheDocument();
  });

  it('åbner og lukker fuldskærmsvisning ved klik på et billede', async () => {
    const user = userEvent.setup();
    render(<GalleryView />);

    const images = await screen.findAllByRole('img');
    await user.click(images[0]!.closest('button')!);

    expect(await screen.findByLabelText('Luk billede')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Luk billede'));
    expect(screen.queryByLabelText('Luk billede')).not.toBeInTheDocument();
  });
});
