'use client';

import { useState } from 'react';

export function BookingRequestForm() {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Skriv dit navn eller familiens navn.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Angiv både ankomst- og afrejsedato.');
      return;
    }
    if (endDate < startDate) {
      setError('Afrejsedato skal være samme dag som eller efter ankomstdato.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/booking-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          startDate,
          endDate,
          note: note.trim() || undefined,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? 'Kunne ikke sende ønsket. Prøv igen.');
        return;
      }
      setName('');
      setStartDate('');
      setEndDate('');
      setNote('');
      setIsSent(true);
    } catch {
      setError('Kunne ikke sende ønsket. Tjek din internetforbindelse.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl2 border border-line bg-white p-6 text-center">
        <p className="text-lg">✓</p>
        <p className="text-ink">Tak! Jeres ønske er sendt til Sven og Inger.</p>
        <button
          type="button"
          onClick={() => setIsSent(false)}
          className="text-sm text-accent underline underline-offset-2"
        >
          Ønsk en periode mere
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl2 border border-line bg-white p-4"
    >
      <div className="flex flex-col gap-2">
        <label htmlFor="requestName" className="text-sm font-medium text-ink">
          Navn
        </label>
        <input
          id="requestName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          placeholder="Fx Joakim H."
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <label htmlFor="requestStartDate" className="text-sm font-medium text-ink">
            Ankomst
          </label>
          <input
            id="requestStartDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="requestEndDate" className="text-sm font-medium text-ink">
            Afrejse
          </label>
          <input
            id="requestEndDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="requestNote" className="text-sm font-medium text-ink">
          Besked <span className="text-muted">(valgfrit)</span>
        </label>
        <textarea
          id="requestNote"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          maxLength={500}
          placeholder="Fx noget I gerne vil fortælle Sven og Inger om ønsket"
          className="rounded-xl2 border border-line px-3 py-2 text-base outline-none focus:border-accent"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl2 bg-accent px-4 py-3 text-base font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {isSubmitting ? 'Sender…' : 'Send ønske'}
      </button>
    </form>
  );
}
