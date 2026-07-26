'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChecklistItem } from '@/lib/types';

export function ChecklistEditor() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [newText, setNewText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    load();
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  async function load() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/checklist', { cache: 'no-store' });
      if (!response.ok) {
        setError('Kunne ikke hente tjeklisten.');
        return;
      }
      const data = await response.json();
      setItems(data.items ?? []);
    } catch {
      setError('Kunne ikke hente tjeklisten.');
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    const text = newText.trim();
    if (!text) return;

    const response = await fetch('/api/checklist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      setError('Kunne ikke tilføje punktet.');
      return;
    }
    const data = await response.json();
    setItems((prev) => [...prev, data.item]);
    setNewText('');
  }

  function handleTextChange(id: string, text: string) {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  }

  async function handleSave(item: ChecklistItem) {
    const trimmed = item.text.trim();
    if (!trimmed) {
      setError('Teksten må ikke være tom.');
      return;
    }

    const response = await fetch(`/api/checklist/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: trimmed }),
    });
    if (!response.ok) {
      setError('Kunne ikke gemme ændringen.');
      return;
    }

    setError(null);
    setSavedId(item.id);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setSavedId(null), 1800);
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm('Slet dette punkt fra tjeklisten?');
    if (!confirmed) return;

    const response = await fetch(`/api/checklist/${id}`, { method: 'DELETE' });
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
      fetch(`/api/checklist/${current.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: target.sortOrder }),
      }),
      fetch(`/api/checklist/${target.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sortOrder: current.sortOrder }),
      }),
    ]);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink">Tjekliste ved afrejse</h2>
      <p className="text-sm text-muted">
        Vises for familie og venner som en liste, de selv kan krydse af (krydsene gemmes lokalt
        på deres enhed, indtil dagen efter opholdet slutter).
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {isLoading && <p className="text-sm text-muted">Indlæser…</p>}

      {!isLoading && (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={item.id} className="flex items-center gap-2 rounded-xl2 border border-line p-2">
              <input
                value={item.text}
                onChange={(e) => handleTextChange(item.id, e.target.value)}
                className="flex-1 rounded-lg border border-line px-2 py-1.5 text-sm outline-none focus:border-accent"
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
                onClick={() => handleSave(item)}
                className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-white hover:opacity-90"
              >
                Gem
              </button>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                aria-label="Slet punkt"
                className="rounded-full border border-red-200 px-2 py-1 text-xs text-red-700 hover:bg-red-50"
              >
                Slet
              </button>
              {savedId === item.id && <span className="text-xs text-accent">Gemt ✓</span>}
            </li>
          ))}
          {items.length === 0 && <p className="text-sm text-muted">Ingen punkter endnu.</p>}
        </ul>
      )}

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Fx: Sluk lys og aircondition"
          maxLength={300}
          className="flex-1 rounded-xl2 border border-line px-3 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded-xl2 bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Gem nyt punkt
        </button>
      </form>
    </div>
  );
}
