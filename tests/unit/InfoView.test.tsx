// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InfoView } from '@/components/info/InfoView';

const checklistItems = [{ id: '1', text: 'Sluk lys', sortOrder: 0 }];
const faqItems = [{ id: '1', question: 'Hvor bytter jeg gaspatron?', answer: 'I skuret.', sortOrder: 0 }];

describe('InfoView', () => {
  beforeEach(() => {
    window.localStorage.clear();
    global.fetch = vi.fn(async (url: string) => {
      const href = url.toString();
      if (href.includes('/api/checklist')) {
        return new Response(JSON.stringify({ items: checklistItems }), { status: 200 });
      }
      if (href.includes('/api/faq')) {
        return new Response(JSON.stringify({ items: faqItems }), { status: 200 });
      }
      if (href.includes('/api/bookings')) {
        return new Response(JSON.stringify({ bookings: [] }), { status: 200 });
      }
      throw new Error('unexpected url ' + href);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('viser FAQ og tjekliste efter indlæsning', async () => {
    render(<InfoView />);
    expect(await screen.findByText('Hvor bytter jeg gaspatron?')).toBeInTheDocument();
    expect(screen.getByText('Sluk lys')).toBeInTheDocument();
  });

  it('viser FAQ FØR tjeklisten i rækkefølgen', async () => {
    render(<InfoView />);
    await screen.findByText('Hvor bytter jeg gaspatron?');
    const headings = screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent);
    expect(headings).toEqual(['Praktisk FAQ', 'Inden du rejser']);
  });

  it('afkrydsning af tjekliste-punkt sender IKKE noget til serveren, men gemmes lokalt', async () => {
    render(<InfoView />);
    const checkbox = (await screen.findByText('Sluk lys')).closest('label')!.querySelector('input')!;

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Ingen nye netværkskald efter klik – kun de indledende GET-kald.
    await waitFor(() => {
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
    });

    // Men afkrydsningen er gemt lokalt (localStorage), så den overlever en genindlæsning.
    expect(window.localStorage.getItem('mallorca-checklist-v1')).toContain('"1"');
  });

  it('FAQ-spørgsmål folder svaret ud og ind ved klik', async () => {
    render(<InfoView />);
    const question = await screen.findByText('Hvor bytter jeg gaspatron?');

    expect(screen.queryByText('I skuret.')).not.toBeInTheDocument();
    fireEvent.click(question);
    expect(screen.getByText('I skuret.')).toBeInTheDocument();
    fireEvent.click(question);
    expect(screen.queryByText('I skuret.')).not.toBeInTheDocument();
  });
});
