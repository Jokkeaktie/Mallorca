'use client';

import { useEffect, useState } from 'react';
import type { ChecklistItem, FaqItem } from '@/lib/types';

export function InfoView() {
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [faq, setFaq] = useState<FaqItem[]>([]);
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const [checklistRes, faqRes] = await Promise.all([
          fetch('/api/checklist', { cache: 'no-store' }),
          fetch('/api/faq', { cache: 'no-store' }),
        ]);
        if (!checklistRes.ok || !faqRes.ok) {
          setError('Kunne ikke hente informationen. Prøv at genindlæse siden.');
          return;
        }
        const checklistData = await checklistRes.json();
        const faqData = await faqRes.json();
        setChecklist(checklistData.items ?? []);
        setFaq(faqData.items ?? []);
      } catch {
        setError('Kunne ikke hente informationen. Tjek din internetforbindelse.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  function toggleChecked(id: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (isLoading) {
    return <p className="text-sm text-muted">Indlæser…</p>;
  }

  if (error) {
    return <p className="text-sm text-red-700">{error}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Inden du rejser</h2>
        {checklist.length === 0 ? (
          <p className="text-sm text-muted">Der er ikke tilføjet nogen tjekliste endnu.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {checklist.map((item) => {
              const isChecked = checked.has(item.id);
              return (
                <li key={item.id}>
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl2 border border-line bg-white p-3">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleChecked(item.id)}
                      className="mt-0.5 h-5 w-5 shrink-0 accent-accent"
                    />
                    <span className={isChecked ? 'text-muted line-through' : 'text-ink'}>
                      {item.text}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        )}
        <p className="text-xs text-muted">
          Afkrydsningerne gemmes ikke og nulstilles, næste gang siden åbnes.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-ink">Praktisk FAQ</h2>
        {faq.length === 0 ? (
          <p className="text-sm text-muted">Der er ikke tilføjet nogen spørgsmål endnu.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {faq.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <li key={item.id} className="rounded-xl2 border border-line bg-white">
                  <button
                    type="button"
                    onClick={() => setOpenFaqId(isOpen ? null : item.id)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center justify-between gap-2 p-3 text-left"
                  >
                    <span className="font-medium text-ink">{item.question}</span>
                    <span aria-hidden="true" className="shrink-0 text-muted">
                      {isOpen ? '–' : '+'}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="whitespace-pre-line border-t border-line p-3 text-sm text-muted">
                      {item.answer}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
