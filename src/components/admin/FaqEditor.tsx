'use client';

import { useEffect, useState } from 'react';
import type { FaqItem } from '@/lib/types';

export function FaqEditor() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/faq', { cache: 'no-store' });
      if (!response.ok) {
        setError('Kunne ikke hente FAQ.');
        return;
      }
      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setError('Kunne ikke hente FAQ.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const question = newQuestion.trim();
    const answer = newAnswer.trim();
    if (!question || !answer) return;

    const response = await fetch('/api/faq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, answer }),
    });
    if (!response.ok) {
      setError('Kunne ikke tilføje spørgsmålet.');
      return;
    }
    const data = await response.json();
    setItems((prev) => [...prev, data.item]);
    setNewQuestion('');
    setNewAnswer('');
  }

  function handleFieldChange(id: string, field: 'question' | 'answer', value: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  }

  async function handleFieldSave(id: string, field: 'question' | 'answer', value: string) {
    const trimmed = value.trim();
    if (!trimmed) return;
    await fetch(`/api/faq/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: trimmed }),
    });
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Slet dette spørgsmål/svar?');
    if (!confirmed) return;

    const response = await fetch(`/api/faq/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      setError('Kunne ikke slette punktet.');
      return;
    }
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  async function handleMove(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const current = items[index]!;
    const target = items[targetIndex]!;

    const reordered = [...items];
    reordered[index] = target;
    reordered[targetIndex] = current;
    setItems(reordered);

    await Promise.all([
      fetch(`/api/faq/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/faq/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink">Praktisk FAQ</h2>
      <p className="text-sm text-muted">
        Spørgsmål og svar om lejlighedens praktik, fx gaspatron eller affaldssortering.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {isLoading && <p className="text-sm text-muted">Indlæser…</p>}

      {!isLoading && (
        <ul className="flex flex-col gap-3">
          {items.map((item, index) => (
            <li key={item.id} className="flex flex-col gap-2 rounded-xl2 border border-line p-3">
              <div className="flex items-center gap-2">
                <input
                  value={item.question}
                  onChange={(e) => handleFieldChange(item.id, 'question', e.target.value)}
                  onBlur={(e) => handleFieldSave(item.id, 'question', e.target.value)}
                  placeholder="Spørgsmål"
                  className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm font-medium outline-none focus:border-accent"
                />
                <button
                  type="button"
                  onClick={() => handleMove(index, -1)}
                  disabled={index === 0}
                  aria-label="Flyt op"
                  className="rounded-full border border-line px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(index, 1)}
                  disabled={index === items.length - 1}
                  aria-label="Flyt ned"
                  className="rounded-full border border-line px-2 py-1 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
                  aria-label="Slet spørgsmål"
                  className="rounded-full border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
                >
                  Slet
                </button>
              </div>
              <textarea
                value={item.answer}
                onChange={(e) => handleFieldChange(item.id, 'answer', e.target.value)}
                onBlur={(e) => handleFieldSave(item.id, 'answer', e.target.value)}
                placeholder="Svar"
                rows={2}
                className="rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
            </li>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">Ingen spørgsmål endnu.</p>}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex flex-col gap-2 rounded-xl2 border border-dashed border-line p-3">
        <input
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          placeholder="Nyt spørgsmål, fx: Hvor bytter jeg gaspatron?"
          maxLength={200}
          className="rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
        <textarea
          value={newAnswer}
          onChange={(e) => setNewAnswer(e.target.value)}
          placeholder="Svar"
          rows={2}
          maxLength={2000}
          className="rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="self-start rounded-xl2 bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          + Tilføj spørgsmål
        </button>
      </form>
    </div>
  );
}
