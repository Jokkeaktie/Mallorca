// @vitest-environment jsdom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { InfoView } from '@/components/info/InfoView';

const checklistItems = [{ id: '1', text: 'Sluk lys', sortOrder: 0 }];
const faqItems = [{ id: '1', question: 'Hvor bytter jeg gaspatron?', answer: 'I skuret.', sortOrder: 0 }];

describe('InfoView', () => {
  beforeEach(() => {
    global.fetch = vi.fn(async (url: string) => {
      if (url.toString().includes('/api/checklist')) {
        return new Response(JSON.stringify({ items: checklistItems }), { status: 200 });
      }
      if (url.toString().includes('/api/faq')) {
        return new Response(JSON.stringify({ items: faqItems }), { status: 200 });
      }
      throw new Error('unexpected url ' + url);
    }) as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('viser tjekliste og FAQ efter indlæsning', async () => {
    render(<InfoView />);
    expect(await screen.findByText('Sluk lys')).toBeInTheDocument();
    expect(screen.getByText('Hvor bytter jeg gaspatron?')).toBeInTheDocument();
  });

  it('afkrydsning af tjekliste-punkt sender IKKE noget til serveren (gemmes ikke)', async () => {
    render(<InfoView />);
    const checkbox = (await screen.findByText('Sluk lys')).closest('label')!.querySelector('input')!;

    const callsBefore = (global.fetch as ReturnType<typeof vi.fn>).mock.calls.length;
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    // Ingen nye netværkskald efter klik – kun de to indledende GET-kald.
    await waitFor(() => {
      expect((global.fetch as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsBefore);
    });
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
