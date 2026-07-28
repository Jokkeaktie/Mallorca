'use client';

import { useEffect, useRef, useState } from 'react';
import { Skeleton } from '@/components/ui/Skeleton';

export function ApartmentInfoEditor() {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const savedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/apartment-info', { cache: 'no-store' });
        if (!response.ok) {
          setError('Kunne ikke hente teksten.');
          return;
        }
        const data = await response.json();
        setText(data.text ?? '');
      } catch {
        setError('Kunne ikke hente teksten.');
      } finally {
        setIsLoading(false);
      }
    }
    load();
    return () => {
      if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    };
  }, []);

  async function handleSave() {
    setError(null);
    const response = await fetch('/api/apartment-info', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!response.ok) {
      setError('Kunne ikke gemme teksten.');
      return;
    }
    setIsSaved(true);
    if (savedTimeoutRef.current) clearTimeout(savedTimeoutRef.current);
    savedTimeoutRef.current = setTimeout(() => setIsSaved(false), 1800);
  }

  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-base font-semibold text-ink">Generelt</h2>
      <p className="text-sm text-muted">
        Fri tekst, fx adresse, telefonnumre på relevante personer, eller andre praktiske
        oplysninger. Vises øverst på familiens side, over FAQ&apos;en.
      </p>

      {error && <p className="text-sm text-red-700">{error}</p>}
      {isLoading ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-32 w-full rounded-xl2" />
          <Skeleton className="h-9 w-24" />
        </div>
      ) : (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            maxLength={5000}
            placeholder={'Fx:\nAdresse: Carrer Example 12, Port d’Andratx\nKontakt: Sven +45 12345678'}
            className="rounded-xl2 border border-line px-3 py-2 text-sm outline-none focus:border-accent"
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSave}
              className="self-start rounded-xl2 bg-accent px-3 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Gem
            </button>
            {isSaved && <span className="text-xs text-accent">Gemt ✓</span>}
          </div>
        </>
      )}
    </div>
  );
}
